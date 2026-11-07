import type { Format, TemplateId } from "./types";

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function withPrintResolution(blob: Blob): Promise<Blob> {
  const source = new Uint8Array(await blob.arrayBuffer());
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4);
  view.setUint32(8, Math.round(150 / 0.0254));
  view.setUint32(12, Math.round(150 / 0.0254));
  chunk[16] = 1;
  view.setUint32(17, crc32(chunk.subarray(4, 17)));
  const parts: BlobPart[] = [source.slice(0, 33), chunk];
  const sourceView = new DataView(source.buffer);
  let cursor = 33;
  // Replace the native 96-dpi metadata without changing a single image pixel.
  while (cursor + 12 <= source.length) {
    const length = sourceView.getUint32(cursor) + 12;
    const name = String.fromCharCode(...source.subarray(cursor + 4, cursor + 8));
    if (name !== "pHYs") parts.push(source.slice(cursor, cursor + length));
    cursor += length;
  }
  return new Blob(parts, { type: "image/png" });
}

export async function canvasToBlob(canvas: HTMLCanvasElement, format: Format): Promise<Blob> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Das PNG konnte nicht erstellt werden.")), "image/png");
    } catch {
      reject(new Error("Das Bild konnte nicht exportiert werden. Bitte eine Datei aus der Bibliothek oder vom Gerät wählen."));
    }
  });
  return format.id === "flyer" ? withPrintResolution(blob) : blob;
}

export function exportFilename(template: TemplateId, format: Format): string {
  const today = new Date();
  const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  return `noizy_${template}_${format.id}_${date}.png`;
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}