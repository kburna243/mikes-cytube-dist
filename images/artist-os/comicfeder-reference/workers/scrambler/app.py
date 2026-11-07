#!/usr/bin/env python3
"""
Federführer – Externer Scrambler-Worker (workers/scrambler/app.py)

Berechnet adversariale Störungen per Projected Gradient Descent (PGD) gegen den
Bild-Encoder eines offenen CLIP-Modells (Standard: ViT-B-32) unter Einhaltung:
  - eines L∞-Budgets je Stärke (leicht / mittel / stark),
  - einer strikten SSIM-Untergrenze (Standard: 0.97; automatische Budget-Reduktion),
  - gekachelter Verarbeitung (Tiling mit weicher Überblendung) für große Bilder
    unter Beibehaltung der Originalauflösung und Einhaltung von 4 GB VRAM,
  - HMAC-SHA256-Signaturprüfung, Größenlimit und Job-Zeitlimit,
  - echter Messung von Kosinus-Ähnlichkeit (Zielmodell + zweites Transfer-Modell),
    SSIM und PSNR ohne geschätzte Werte.
"""

from __future__ import annotations

import base64
import gc
import hashlib
import hmac
import json
import logging
import math
import os
import struct
import time
import zlib
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional, Tuple

# Logging ohne Bilddaten
logger = logging.getLogger("scrambler_worker")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("[%(asctime)s] %(levelname)s %(message)s"))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)


# ---------------------------------------------------------------------------
# Konfiguration & Fehlerklassen
# ---------------------------------------------------------------------------

STRENGTH_LINFINITY_BUDGET: Dict[str, int] = {
    "leicht": int(os.environ.get("SCRAMBLER_EPS_LEICHT", "4")),
    "mittel": int(os.environ.get("SCRAMBLER_EPS_MITTEL", "8")),
    "stark": int(os.environ.get("SCRAMBLER_EPS_STARK", "14")),
}

STRENGTH_PGD_STEPS: Dict[str, int] = {
    "leicht": int(os.environ.get("SCRAMBLER_STEPS_LEICHT", "6")),
    "mittel": int(os.environ.get("SCRAMBLER_STEPS_MITTEL", "10")),
    "stark": int(os.environ.get("SCRAMBLER_STEPS_STARK", "14")),
}


class ScramblerError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


# ---------------------------------------------------------------------------
# Reiner PNG-Codec (Fallback, falls Pillow/NumPy in Testumgebungen fehlen)
# ---------------------------------------------------------------------------

def _paeth_predictor(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def decode_rgb_image(data: bytes) -> Tuple[int, int, bytearray]:
    """Dekodiert ein Bild nach RGB-Bytes (width, height, bytearray(w*h*3))."""
    try:
        from PIL import Image  # type: ignore
        import io
        with Image.open(io.BytesIO(data)) as im:
            if im.width * im.height > int(os.environ.get("SCRAMBLER_MAX_PIXELS", "4000000")):
                raise ScramblerError("Bildauflösung zu groß.", 413)
            rgb = im.convert("RGB")
            w, h = rgb.size
            return w, h, bytearray(rgb.tobytes())
    except ImportError:
        pass

    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ScramblerError("Ungültiges PNG-Format.", 400)

    pos = 8
    width = height = 0
    color_type = 2
    idat_chunks: List[bytes] = []

    while pos + 8 <= len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        chunk_type = data[pos + 4:pos + 8]
        chunk_data = data[pos + 8:pos + 8 + length]
        pos += 12 + length
        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, _, _, _ = struct.unpack(">IIBBBBB", chunk_data[:13])
            if bit_depth != 8 or color_type not in (2, 6):
                raise ScramblerError("Nur 8-Bit RGB/RGBA PNGs werden im Fallback unterstützt.", 400)
        elif chunk_type == b"IDAT":
            idat_chunks.append(chunk_data)
        elif chunk_type == b"IEND":
            break

    if width <= 0 or height <= 0 or width * height > int(os.environ.get("SCRAMBLER_MAX_PIXELS", "4000000")):
        raise ScramblerError("Bildauflösung ungültig oder zu groß.", 413)
    bpp = 3 if color_type == 2 else 4
    expected_size = height * (width * bpp + 1)
    decoder = zlib.decompressobj()
    raw = decoder.decompress(b"".join(idat_chunks), expected_size + 1)
    if len(raw) != expected_size or not decoder.eof:
        raise ScramblerError("Ungültige PNG-Bilddaten.", 400)
    stride = width * bpp
    recon = bytearray(height * stride)
    in_pos = 0

    for y in range(height):
        ftype = raw[in_pos]
        in_pos += 1
        row_start = y * stride
        prev_start = (y - 1) * stride
        for x in range(stride):
            val = raw[in_pos]
            in_pos += 1
            a = recon[row_start + x - bpp] if x >= bpp else 0
            b = recon[prev_start + x] if y > 0 else 0
            c = recon[prev_start + x - bpp] if (x >= bpp and y > 0) else 0
            if ftype == 0:
                recon[row_start + x] = val
            elif ftype == 1:
                recon[row_start + x] = (val + a) & 0xFF
            elif ftype == 2:
                recon[row_start + x] = (val + b) & 0xFF
            elif ftype == 3:
                recon[row_start + x] = (val + ((a + b) >> 1)) & 0xFF
            elif ftype == 4:
                recon[row_start + x] = (val + _paeth_predictor(a, b, c)) & 0xFF

    if bpp == 3:
        return width, height, recon

    rgb_out = bytearray(width * height * 3)
    out_idx = 0
    for i in range(0, len(recon), 4):
        rgb_out[out_idx] = recon[i]
        rgb_out[out_idx + 1] = recon[i + 1]
        rgb_out[out_idx + 2] = recon[i + 2]
        out_idx += 3
    return width, height, rgb_out


def encode_rgb_png(width: int, height: int, rgb: bytes | bytearray) -> bytes:
    """Kodiert RGB-Bytes verlustfrei als sRGB-PNG."""
    try:
        from PIL import Image  # type: ignore
        import io
        im = Image.frombytes("RGB", (width, height), bytes(rgb))
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        return buf.getvalue()
    except ImportError:
        pass

    def make_chunk(chunk_type: bytes, chunk_data: bytes) -> bytes:
        crc = zlib.crc32(chunk_type + chunk_data) & 0xFFFFFFFF
        return struct.pack(">I", len(chunk_data)) + chunk_type + chunk_data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    stride = width * 3
    raw_rows = bytearray((stride + 1) * height)
    for y in range(height):
        row_offset = y * (stride + 1)
        raw_rows[row_offset] = 0
        src_offset = y * stride
        raw_rows[row_offset + 1:row_offset + 1 + stride] = rgb[src_offset:src_offset + stride]
    compressed = zlib.compress(bytes(raw_rows), level=6)
    return (
        b"\x89PNG\r\n\x1a\n"
        + make_chunk(b"IHDR", ihdr)
        + make_chunk(b"IDAT", compressed)
        + make_chunk(b"IEND", b"")
    )


# ---------------------------------------------------------------------------
# Messfunktionen: SSIM, PSNR und Kosinus-Ähnlichkeit
# ---------------------------------------------------------------------------

def compute_psnr_and_ssim(
    width: int,
    height: int,
    orig_rgb: bytes | bytearray,
    prot_rgb: bytes | bytearray,
) -> Tuple[float, float]:
    """Berechnet echte PSNR (dB) und SSIM (8×8-Fenster auf Luminanz Y)."""
    n_bytes = width * height * 3
    if n_bytes == 0:
        return 100.0, 1.0

    mse_sum = 0.0
    for i in range(n_bytes):
        d = float(orig_rgb[i]) - float(prot_rgb[i])
        mse_sum += d * d
    mse = mse_sum / n_bytes
    psnr = 100.0 if mse <= 1e-10 else 10.0 * math.log10((255.0 * 255.0) / mse)

    # Luminanz für SSIM
    y_orig = [0.0] * (width * height)
    y_prot = [0.0] * (width * height)
    for p in range(width * height):
        idx = p * 3
        y_orig[p] = 0.299 * orig_rgb[idx] + 0.587 * orig_rgb[idx + 1] + 0.114 * orig_rgb[idx + 2]
        y_prot[p] = 0.299 * prot_rgb[idx] + 0.587 * prot_rgb[idx + 1] + 0.114 * prot_rgb[idx + 2]

    c1 = (0.01 * 255.0) ** 2
    c2 = (0.03 * 255.0) ** 2
    win = 8
    ssim_sum = 0.0
    win_count = 0

    step_y = max(1, height // 32) * win if height > 128 else win
    step_x = max(1, width // 32) * win if width > 128 else win

    for by in range(0, max(1, height - win + 1), min(win, max(1, step_y))):
        for bx in range(0, max(1, width - win + 1), min(win, max(1, step_x))):
            h_lim = min(win, height - by)
            w_lim = min(win, width - bx)
            cnt = h_lim * w_lim
            if cnt == 0:
                continue
            sum_x = sum_y = 0.0
            for dy in range(h_lim):
                row = (by + dy) * width + bx
                for dx in range(w_lim):
                    sum_x += y_orig[row + dx]
                    sum_y += y_prot[row + dx]
            mu_x = sum_x / cnt
            mu_y = sum_y / cnt

            var_x = var_y = cov = 0.0
            for dy in range(h_lim):
                row = (by + dy) * width + bx
                for dx in range(w_lim):
                    vx = y_orig[row + dx] - mu_x
                    vy = y_prot[row + dx] - mu_y
                    var_x += vx * vx
                    var_y += vy * vy
                    cov += vx * vy
            var_x /= cnt
            var_y /= cnt
            cov /= cnt

            num = (2.0 * mu_x * mu_y + c1) * (2.0 * cov + c2)
            den = (mu_x * mu_x + mu_y * mu_y + c1) * (var_x + var_y + c2)
            ssim_sum += num / den if den != 0 else 1.0
            win_count += 1

    ssim = ssim_sum / win_count if win_count > 0 else 1.0
    return psnr, max(-1.0, min(1.0, ssim))


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    na = math.sqrt(sum(a * a for a in vec_a))
    nb = math.sqrt(sum(b * b for b in vec_b))
    if na <= 1e-12 or nb <= 1e-12:
        return 0.0
    return max(-1.0, min(1.0, dot / (na * nb)))


# ---------------------------------------------------------------------------
# Vision-Encoder: OpenCLIP (PyTorch) + Deterministischer Patch-Encoder (Tests)
# ---------------------------------------------------------------------------

class VisionEncoder:
    name: str = "base"

    def encode_rgb(self, width: int, height: int, rgb: bytes | bytearray) -> List[float]:
        raise NotImplementedError

    def pgd_perturb_tile(
        self,
        width: int,
        height: int,
        tile_rgb: bytes | bytearray,
        eps_pixel: int,
        steps: int,
        deadline: float,
    ) -> bytearray:
        raise NotImplementedError


class DeterministicPatchVisionEncoder(VisionEncoder):
    """
    Synthetic frequency test double, explicitly injected by offline tests only.
    Its hand-written update is not OpenCLIP PGD and proves no protective effect.
    """

    def __init__(self, name: str = "synthetic-test-primary", freq_scale: int = 1) -> None:
        self.name = name
        self.freq_scale = freq_scale

    def encode_rgb(self, width: int, height: int, rgb: bytes | bytearray) -> List[float]:
        dim = 32
        feats = [0.0] * dim
        if width == 0 or height == 0:
            return feats

        s = self.freq_scale
        for y in range(height):
            row = y * width * 3
            for x in range(width):
                idx = row + x * 3
                r = float(rgb[idx]) - 127.5
                g = float(rgb[idx + 1]) - 127.5
                b = float(rgb[idx + 2]) - 127.5

                # Lokale hochfrequente Kanten-/Patch-Filter
                p_parity = 1.0 if ((x // s + y // s) & 1) == 0 else -1.0
                p_diag = 1.0 if (((x + y) // s) & 1) == 0 else -1.0
                bin_idx = (((x // (2 * s)) * 5 + (y // (2 * s)) * 7) % (dim // 4)) * 4

                feats[bin_idx] += r * p_parity
                feats[bin_idx + 1] += g * p_diag
                feats[bin_idx + 2] += b * p_parity * p_diag
                feats[bin_idx + 3] += (0.5 * r - 0.25 * g + 0.25 * b) * p_parity

        norm = math.sqrt(sum(v * v for v in feats))
        if norm > 1e-9:
            feats = [v / norm for v in feats]
        return feats

    def pgd_perturb_tile(
        self,
        width: int,
        height: int,
        tile_rgb: bytes | bytearray,
        eps_pixel: int,
        steps: int,
        deadline: float,
    ) -> bytearray:
        orig_emb = self.encode_rgb(width, height, tile_rgb)
        cur = bytearray(tile_rgb)
        if eps_pixel <= 0 or steps <= 0:
            return cur

        s = self.freq_scale
        dim = 32
        alpha = max(1.0, float(eps_pixel) / max(1, steps // 2))

        for _ in range(steps):
            if time.monotonic() > deadline:
                raise ScramblerError("Zeitlimit für Scrambler-Job überschritten.", 504)

            cur_emb = self.encode_rgb(width, height, cur)
            # Wir bewegen die Einbettung entgegengesetzt zu orig_emb (Minimierung Kosinus-Ähnlichkeit)
            target_dir = [-(orig_emb[d] + 0.5 * cur_emb[d]) for d in range(dim)]

            for y in range(height):
                row = y * width * 3
                for x in range(width):
                    idx = row + x * 3
                    p_parity = 1.0 if ((x // s + y // s) & 1) == 0 else -1.0
                    p_diag = 1.0 if (((x + y) // s) & 1) == 0 else -1.0
                    bin_idx = (((x // (2 * s)) * 5 + (y // (2 * s)) * 7) % (dim // 4)) * 4

                    grad_r = target_dir[bin_idx] * p_parity + 0.5 * target_dir[bin_idx + 3] * p_parity
                    grad_g = target_dir[bin_idx + 1] * p_diag - 0.25 * target_dir[bin_idx + 3] * p_parity
                    grad_b = target_dir[bin_idx + 2] * p_parity * p_diag + 0.25 * target_dir[bin_idx + 3] * p_parity

                    for c_off, grad_c in ((0, grad_r), (1, grad_g), (2, grad_b)):
                        sign = 1 if grad_c >= 0 else -1
                        orig_val = tile_rgb[idx + c_off]
                        cand = int(round(cur[idx + c_off] + alpha * sign))
                        low = max(0, orig_val - eps_pixel)
                        high = min(255, orig_val + eps_pixel)
                        cur[idx + c_off] = max(low, min(high, cand))

        return cur


class OpenClipVisionEncoder(VisionEncoder):
    """
    Echter PyTorch + open_clip_torch Bild-Encoder mit speichersparendem PGD
    (fp16 auf GPU für <= 4 GB VRAM, float32 auf CPU).
    """

    def __init__(self, model_name: str = "ViT-B-32", pretrained: str = "laion2b_s34b_b79k") -> None:
        import torch  # type: ignore
        import open_clip  # type: ignore

        self.torch = torch
        self.name = model_name
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.use_fp16 = self.device.type == "cuda"

        model, _, _ = open_clip.create_model_and_transforms(
            model_name,
            pretrained=pretrained,
            device=self.device,
        )
        model.eval()
        for param in model.parameters():
            param.requires_grad_(False)
        if self.use_fp16:
            model = model.half()
        self.model = model
        self.image_size = model.visual.image_size
        cfg = getattr(model.visual, "preprocess_cfg", {})
        self.mean = cfg.get("mean", (0.48145466, 0.4578275, 0.40821073))
        self.std = cfg.get("std", (0.26862954, 0.26130258, 0.27577711))

    def _rgb_to_tensor(self, width: int, height: int, rgb: bytes | bytearray):
        torch = self.torch
        import numpy as np  # type: ignore

        arr = np.frombuffer(rgb, dtype=np.uint8).reshape((height, width, 3)).astype(np.float32) / 255.0
        tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).to(self.device)
        if self.use_fp16:
            tensor = tensor.half()
        return tensor

    def _normalize_for_clip(self, x):
        torch = self.torch
        import torch.nn.functional as F  # type: ignore

        resized = F.interpolate(x, size=((self.image_size, self.image_size) if isinstance(self.image_size, int) else self.image_size), mode="bilinear", align_corners=False)
        mean = torch.tensor(self.mean, device=self.device, dtype=resized.dtype).view(1, 3, 1, 1)
        std = torch.tensor(self.std, device=self.device, dtype=resized.dtype).view(1, 3, 1, 1)
        return (resized - mean) / std

    def encode_rgb(self, width: int, height: int, rgb: bytes | bytearray) -> List[float]:
        torch = self.torch
        with torch.no_grad():
            x = self._rgb_to_tensor(width, height, rgb)
            normed = self._normalize_for_clip(x)
            emb = self.model.encode_image(normed)
            emb = emb / emb.norm(dim=-1, keepdim=True).clamp_min(1e-8)
            return [float(v) for v in emb[0].detach().cpu().float().tolist()]

    def pgd_perturb_tile(
        self,
        width: int,
        height: int,
        tile_rgb: bytes | bytearray,
        eps_pixel: int,
        steps: int,
        deadline: float,
    ) -> bytearray:
        torch = self.torch
        import numpy as np  # type: ignore

        if eps_pixel <= 0 or steps <= 0:
            return bytearray(tile_rgb)

        eps = float(eps_pixel) / 255.0
        alpha = max(eps / max(1, steps), 1.0 / 255.0)

        x_orig = self._rgb_to_tensor(width, height, tile_rgb)
        with torch.no_grad():
            orig_feat = self.model.encode_image(self._normalize_for_clip(x_orig))
            orig_feat = orig_feat / orig_feat.norm(dim=-1, keepdim=True).clamp_min(1e-8)

        # Random start avoids the zero gradient at cosine(original, original).
        delta = torch.empty_like(x_orig).uniform_(-eps, eps).requires_grad_(True)

        for _ in range(steps):
            if time.monotonic() > deadline:
                raise ScramblerError("Zeitlimit für Scrambler-Job überschritten.", 504)

            adv = (x_orig + delta).clamp(0.0, 1.0)
            adv_feat = self.model.encode_image(self._normalize_for_clip(adv))
            adv_feat = adv_feat / adv_feat.norm(dim=-1, keepdim=True).clamp_min(1e-8)

            # Minimierung der Kosinus-Ähnlichkeit zwischen Original und geschütztem Bild
            cos_sim = (orig_feat * adv_feat).sum(dim=-1).mean()
            self.model.zero_grad(set_to_none=True)
            if delta.grad is not None:
                delta.grad.zero_()
            cos_sim.backward()

            with torch.no_grad():
                grad_sign = delta.grad.sign()
                delta.data = (delta.data - alpha * grad_sign).clamp(-eps, eps)
                delta.data = (x_orig + delta.data).clamp(0.0, 1.0) - x_orig

        with torch.no_grad():
            final_tensor = ((x_orig + delta).clamp(0.0, 1.0)[0].permute(1, 2, 0).detach().cpu().float().numpy() * 255.0)
            out_bytes = np.clip(np.round(final_tensor), 0, 255).astype(np.uint8).tobytes()
            if self.device.type == "cuda":
                torch.cuda.empty_cache()
            return bytearray(out_bytes)


def load_encoders() -> Tuple[VisionEncoder, VisionEncoder]:
    """Lädt Zielmodell (Standard ViT-B-32) und zweites Transfer-Modell."""
    # Synthetic encoders are injected explicitly by unit tests, never used in service.
    try:
        primary = OpenClipVisionEncoder(
            os.environ.get("SCRAMBLER_MODEL_NAME", "ViT-B-32"),
            os.environ.get("SCRAMBLER_PRETRAINED", "laion2b_s34b_b79k"))
        transfer = OpenClipVisionEncoder(
            os.environ.get("SCRAMBLER_TRANSFER_MODEL", "ViT-B-16-SigLIP"),
            os.environ.get("SCRAMBLER_TRANSFER_PRETRAINED", "webli"))
        return primary, transfer
    except Exception as exc:
        logger.error("OpenCLIP unavailable: %s", type(exc).__name__)
        raise ScramblerError("Schutzschicht gerade nicht verfügbar", 503) from exc


# ---------------------------------------------------------------------------
# Gekachelte PGD-Verarbeitung mit weicher Überblendung & SSIM-Garantie
# ---------------------------------------------------------------------------

def _extract_tile(
    width: int,
    rgb: bytes | bytearray,
    x0: int,
    y0: int,
    tw: int,
    th: int,
) -> bytearray:
    tile = bytearray(tw * th * 3)
    for ty in range(th):
        src_start = ((y0 + ty) * width + x0) * 3
        dst_start = ty * tw * 3
        tile[dst_start:dst_start + tw * 3] = rgb[src_start:src_start + tw * 3]
    return tile


def perturb_image_tiled(
    width: int,
    height: int,
    orig_rgb: bytes | bytearray,
    encoder: VisionEncoder,
    eps_pixel: int,
    steps: int,
    tile_size: int,
    tile_overlap: int,
    deadline: float,
) -> Tuple[bytearray, int]:
    """
    Verarbeitet große Bilder in überlappenden Kacheln (Tiles) mit linearer
    Randgewichtung, sodass keine Kantenartefakte entstehen und die Originalauflösung
    exakt erhalten bleibt.
    """
    tile_size = max(16, tile_size)
    tile_overlap = max(0, min(tile_size // 2 - 1, tile_overlap))
    stride = max(1, tile_size - tile_overlap)

    if width <= tile_size and height <= tile_size:
        perturbed = encoder.pgd_perturb_tile(width, height, orig_rgb, eps_pixel, steps, deadline)
        return perturbed, 1

    acc_delta = [0.0] * (width * height * 3)
    acc_weight = [0.0] * (width * height)
    tiles_count = 0

    y_positions = list(range(0, max(1, height - tile_size), stride))
    if not y_positions or y_positions[-1] + tile_size < height:
        y_positions.append(max(0, height - tile_size))

    x_positions = list(range(0, max(1, width - tile_size), stride))
    if not x_positions or x_positions[-1] + tile_size < width:
        x_positions.append(max(0, width - tile_size))

    for y0 in y_positions:
        th = min(tile_size, height - y0)
        for x0 in x_positions:
            tw = min(tile_size, width - x0)
            tile_orig = _extract_tile(width, orig_rgb, x0, y0, tw, th)
            tile_adv = encoder.pgd_perturb_tile(tw, th, tile_orig, eps_pixel, steps, deadline)
            tiles_count += 1

            for ty in range(th):
                wy = 1.0
                if tile_overlap > 0:
                    if y0 > 0 and ty < tile_overlap:
                        wy = min(wy, (ty + 1) / float(tile_overlap + 1))
                    if y0 + th < height and (th - 1 - ty) < tile_overlap:
                        wy = min(wy, (th - ty) / float(tile_overlap + 1))
                for tx in range(tw):
                    wx = 1.0
                    if tile_overlap > 0:
                        if x0 > 0 and tx < tile_overlap:
                            wx = min(wx, (tx + 1) / float(tile_overlap + 1))
                        if x0 + tw < width and (tw - 1 - tx) < tile_overlap:
                            wx = min(wx, (tw - tx) / float(tile_overlap + 1))
                    w = wx * wy
                    g_pix = (y0 + ty) * width + (x0 + tx)
                    g_idx = g_pix * 3
                    t_idx = (ty * tw + tx) * 3
                    acc_weight[g_pix] += w
                    acc_delta[g_idx] += (float(tile_adv[t_idx]) - float(tile_orig[t_idx])) * w
                    acc_delta[g_idx + 1] += (float(tile_adv[t_idx + 1]) - float(tile_orig[t_idx + 1])) * w
                    acc_delta[g_idx + 2] += (float(tile_adv[t_idx + 2]) - float(tile_orig[t_idx + 2])) * w

    out = bytearray(width * height * 3)
    for p in range(width * height):
        w = acc_weight[p] if acc_weight[p] > 1e-8 else 1.0
        idx = p * 3
        for c in range(3):
            delta_c = int(round(acc_delta[idx + c] / w))
            delta_c = max(-eps_pixel, min(eps_pixel, delta_c))
            out[idx + c] = max(0, min(255, orig_rgb[idx + c] + delta_c))

    return out, tiles_count


def scale_perturbation_towards_original(
    orig_rgb: bytes | bytearray,
    adv_rgb: bytes | bytearray,
    scale: float,
) -> bytearray:
    """Reduziert die Störung um den Faktor `scale` (0.0 .. 1.0), um die SSIM-Untergrenze einzuhalten."""
    out = bytearray(len(orig_rgb))
    for i in range(len(orig_rgb)):
        diff = float(adv_rgb[i]) - float(orig_rgb[i])
        val = int(round(float(orig_rgb[i]) + diff * scale))
        out[i] = max(0, min(255, val))
    return out


# ---------------------------------------------------------------------------
# Sicherheit: HMAC-Signaturprüfung
# ---------------------------------------------------------------------------

def compute_hmac_signature(raw_body: bytes, secret: str) -> str:
    digest = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def verify_hmac_signature(raw_body: bytes, signature_header: Optional[str], secret: Optional[str]) -> bool:
    """
    Prüft die HMAC-SHA256-Signatur im Format `sha256=<hex>`.
    Ist ein Secret gesetzt, werden unsignierte oder falsch signierte Anfragen abgelehnt.
    """
    if not secret:
        return True
    if not signature_header or not isinstance(signature_header, str):
        return False
    normalized = signature_header.strip()
    expected = compute_hmac_signature(raw_body, secret)
    return hmac.compare_digest(normalized.lower(), expected.lower())


# ---------------------------------------------------------------------------
# Hauptfunktion für einen Scrambler-Job
# ---------------------------------------------------------------------------

@dataclass
class ScrambleConfig:
    min_ssim: float = float(os.environ.get("SCRAMBLER_MIN_SSIM", "0.97"))
    tile_size: int = int(os.environ.get("SCRAMBLER_TILE_SIZE", "512"))
    tile_overlap: int = int(os.environ.get("SCRAMBLER_TILE_OVERLAP", "32"))
    max_upload_bytes: int = int(os.environ.get("SCRAMBLER_MAX_UPLOAD_BYTES", str(25 * 1024 * 1024)))
    job_timeout_sec: float = float(os.environ.get("SCRAMBLER_JOB_TIMEOUT_SEC", "120"))
    hmac_secret: Optional[str] = os.environ.get("SCRAMBLER_HMAC_SECRET")


def process_scramble_job(
    payload: Dict[str, Any],
    raw_body: Optional[bytes] = None,
    signature_header: Optional[str] = None,
    config: Optional[ScrambleConfig] = None,
    encoders: Optional[Tuple[VisionEncoder, VisionEncoder]] = None,
) -> Dict[str, Any]:
    """
    Führt einen kompletten Scrambler-Job aus:
      1. HMAC-Signaturprüfung
      2. Größenlimit-Prüfung
      3. Gekachelte PGD-Optimierung gegen das Zielmodell
      4. Automatische Budget-Reduktion, falls SSIM < min_ssim (Standard 0.97)
      5. Echte Messung an Zielmodell + zweitem Transfer-Modell sowie SSIM & PSNR
      6. Sicheres Löschen der Bildpuffer nach Abschluss
    """
    cfg = config or ScrambleConfig()
    start_time = time.monotonic()
    deadline = start_time + cfg.job_timeout_sec

    if raw_body is not None and len(raw_body) > cfg.max_upload_bytes:
        raise ScramblerError(
            f"Upload überschreitet das Größenlimit von {cfg.max_upload_bytes} Bytes.",
            413,
        )

    if not cfg.hmac_secret and encoders is None:
        raise ScramblerError("Scrambler HMAC-Secret nicht konfiguriert.", 503)
    if cfg.hmac_secret:
        body_to_verify = raw_body if raw_body is not None else json.dumps(payload).encode("utf-8")
        if not verify_hmac_signature(body_to_verify, signature_header, cfg.hmac_secret):
            raise ScramblerError("Ungültige oder fehlende HMAC-Signatur.", 401)

    job_id = str(payload.get("jobId") or "unbekannt")
    asset_id = str(payload.get("assetId") or "unbekannt")
    strength = str(payload.get("strength") or "mittel").lower()
    if strength not in STRENGTH_LINFINITY_BUDGET:
        raise ScramblerError(f"Ungültige Stärke '{strength}'. Erlaubt: leicht, mittel, stark.", 400)

    image_b64 = payload.get("imageBase64")
    if not image_b64 or not isinstance(image_b64, str):
        raise ScramblerError("Feld 'imageBase64' fehlt.", 400)

    # Größenlimit auch auf Base64-Länge prüfen
    estimated_bytes = (len(image_b64) * 3) // 4
    if estimated_bytes > cfg.max_upload_bytes:
        raise ScramblerError(
            f"Bilddaten überschreiten das Größenlimit von {cfg.max_upload_bytes} Bytes.",
            413,
        )

    constraints = payload.get("constraints") or {}
    if not isinstance(constraints, dict):
        raise ScramblerError("constraints muss ein Objekt sein.")
    try:
        requested_ssim = float(constraints.get("minSsim", cfg.min_ssim))
    except (ValueError, TypeError) as exc:
        raise ScramblerError("Ungültige SSIM-Grenze.") from exc
    if not math.isfinite(requested_ssim) or not 0 < requested_ssim <= 1:
        raise ScramblerError("Ungültige SSIM-Grenze.")
    min_ssim = max(requested_ssim, cfg.min_ssim)

    logger.info("Starte Scrambler-Job jobId=%s assetId=%s strength=%s", job_id, asset_id, strength)

    image_bytes: Optional[bytes] = None
    orig_rgb: Optional[bytearray] = None
    adv_rgb: Optional[bytearray] = None

    try:
        try:
            image_bytes = base64.b64decode(image_b64, validate=True)
        except Exception as exc:
            raise ScramblerError("Ungültige Base64-Kodierung.", 400) from exc

        if len(image_bytes) > cfg.max_upload_bytes:
            raise ScramblerError(
                f"Dekodiertes Bild überschreitet das Größenlimit von {cfg.max_upload_bytes} Bytes.",
                413,
            )

        try:
            width, height, orig_rgb = decode_rgb_image(image_bytes)
        except ScramblerError:
            raise
        except Exception as exc:
            raise ScramblerError("Ungültiges Bild.", 400) from exc
        primary_enc, transfer_enc = encoders if encoders is not None else load_encoders()

        initial_eps = STRENGTH_LINFINITY_BUDGET[strength]
        steps = STRENGTH_PGD_STEPS[strength]

        adv_rgb, tiles_processed = perturb_image_tiled(
            width=width,
            height=height,
            orig_rgb=orig_rgb,
            encoder=primary_enc,
            eps_pixel=initial_eps,
            steps=steps,
            tile_size=cfg.tile_size,
            tile_overlap=cfg.tile_overlap,
            deadline=deadline,
        )

        psnr, ssim = compute_psnr_and_ssim(width, height, orig_rgb, adv_rgb)
        effective_eps = float(initial_eps)
        budget_reductions = 0

        # Falls SSIM unter den Mindestwert fällt, wird das Störungsbudget schrittweise reduziert
        scale = 1.0
        while ssim < min_ssim and budget_reductions < 12:
            if time.monotonic() > deadline:
                raise ScramblerError("Zeitlimit für Scrambler-Job überschritten.", 504)
            scale *= 0.72
            budget_reductions += 1
            effective_eps = round(initial_eps * scale, 3)
            if effective_eps < 0.25:
                adv_rgb = bytearray(orig_rgb)
                effective_eps = 0.0
                psnr, ssim = compute_psnr_and_ssim(width, height, orig_rgb, adv_rgb)
                break
            adv_rgb = scale_perturbation_towards_original(orig_rgb, adv_rgb, 0.72)
            psnr, ssim = compute_psnr_and_ssim(width, height, orig_rgb, adv_rgb)

        if ssim < min_ssim:
            raise ScramblerError("SSIM-Grenze konnte nicht eingehalten werden.", 422)
        # Echte Messungen am Zielmodell und am zweiten Transfer-Modell
        orig_emb_primary = primary_enc.encode_rgb(width, height, orig_rgb)
        adv_emb_primary = primary_enc.encode_rgb(width, height, adv_rgb)
        cos_before_primary = round(cosine_similarity(orig_emb_primary, orig_emb_primary), 5)
        cos_after_primary = round(cosine_similarity(orig_emb_primary, adv_emb_primary), 5)
        clip_cos_distance = round(1.0 - cos_after_primary, 5)

        orig_emb_transfer = transfer_enc.encode_rgb(width, height, orig_rgb)
        adv_emb_transfer = transfer_enc.encode_rgb(width, height, adv_rgb)
        cos_before_transfer = round(cosine_similarity(orig_emb_transfer, orig_emb_transfer), 5)
        cos_after_transfer = round(cosine_similarity(orig_emb_transfer, adv_emb_transfer), 5)
        transfer_cos_distance = round(1.0 - cos_after_transfer, 5)

        protected_png = encode_rgb_png(width, height, adv_rgb)
        protected_b64 = base64.b64encode(protected_png).decode("ascii")
        elapsed_ms = round((time.monotonic() - start_time) * 1000.0, 1)

        logger.info(
            "Scrambler-Job fertig jobId=%s ssim=%.4f psnr=%.2f cosAfter=%.4f transferCosAfter=%.4f ms=%.1f",
            job_id,
            ssim,
            psnr,
            cos_after_primary,
            cos_after_transfer,
            elapsed_ms,
        )

        return {
            "jobId": job_id,
            "assetId": asset_id,
            "strength": strength,
            "width": width,
            "height": height,
            "imageBase64": protected_b64,
            "protectedImageBase64": protected_b64,
            "measuredSsim": ssim,
            "metrics": {
                "ssim": ssim,
                "minSsimEnforced": min_ssim,
                "psnr": psnr,
                "cosineSimilarityBefore": cos_before_primary,
                "cosineSimilarityAfter": cos_after_primary,
                "clipCosineDistance": clip_cos_distance,
                "transferModel": transfer_enc.name,
                "transferCosineSimilarityBefore": cos_before_transfer,
                "transferCosineSimilarityAfter": cos_after_transfer,
                "siglipCosineDistance": transfer_cos_distance,
                "linfBudgetOriginal": initial_eps,
                "linfBudgetEffective": effective_eps,
                "budgetReductions": budget_reductions,
                "tilesProcessed": tiles_processed,
                "iterations": steps,
                "model": f"{primary_enc.name}+{transfer_enc.name}",
                "durationMs": elapsed_ms,
            },
        }
    finally:
        # Mutable CPU buffers are cleared; immutable copies/framework buffers are not guaranteed erased.
        if orig_rgb is not None:
            for i in range(len(orig_rgb)):
                orig_rgb[i] = 0
        if adv_rgb is not None:
            for i in range(len(adv_rgb)):
                adv_rgb[i] = 0
        image_bytes = None
        orig_rgb = None
        adv_rgb = None
        gc.collect()


# ---------------------------------------------------------------------------
# FastAPI-Anwendung (falls installiert)
# ---------------------------------------------------------------------------

try:
    from fastapi import FastAPI, Header, HTTPException, Request  # type: ignore
    from fastapi.responses import JSONResponse  # type: ignore

    app = FastAPI(
        title="Federführer Scrambler-Worker",
        version="1.0.0",
        description="Adversariale Bild-Schutzschicht (PGD gegen offene CLIP-Modelle mit SSIM-Garantie)",
    )

    @app.get("/health")
    async def health() -> Dict[str, Any]:
        return {
            "status": "ok",
            "model": os.environ.get("SCRAMBLER_MODEL_NAME", "ViT-B-32"),
            "transferModel": os.environ.get("SCRAMBLER_TRANSFER_MODEL", "ViT-B-16-SigLIP"),
            "minSsim": float(os.environ.get("SCRAMBLER_MIN_SSIM", "0.97")),
        }

    @app.post("/v1/scramble")
    async def scramble_endpoint(
        request: Request,
        x_federfuehrer_signature_256: Optional[str] = Header(default=None),
        x_scrambler_signature_256: Optional[str] = Header(default=None),
        authorization: Optional[str] = Header(default=None),
    ) -> JSONResponse:
        api_key = os.environ.get("SCRAMBLER_WORKER_API_KEY")
        if api_key and not hmac.compare_digest(authorization or "", f"Bearer {api_key}"):
            return JSONResponse(status_code=401, content={"detail": "Ungültiger API-Key."})
        chunks = bytearray()
        async for chunk in request.stream():
            chunks.extend(chunk)
            if len(chunks) > ScrambleConfig().max_upload_bytes:
                return JSONResponse(status_code=413, content={"detail": "Upload zu groß."})
        raw_body = bytes(chunks)
        sig = x_federfuehrer_signature_256 or x_scrambler_signature_256
        try:
            payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
            if not isinstance(payload, dict):
                raise ValueError("JSON object required")
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Ungültiges JSON.") from exc

        try:
            result = process_scramble_job(
                payload=payload,
                raw_body=raw_body,
                signature_header=sig,
            )
            return JSONResponse(status_code=200, content=result)
        except ScramblerError as exc:
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

except ImportError:
    app = None
