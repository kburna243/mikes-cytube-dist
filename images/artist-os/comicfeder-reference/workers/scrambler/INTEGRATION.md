# Python-Worker: geprüfte Integration

## Betrieb

Python 3.11 verwenden; die gelieferten Pins unterstützen das hier vorinstallierte Python 3.14 nicht. Venv, Modellgewichte und Download-Caches auf I: halten. CPU-Installation:

```powershell
uv venv --python 3.11 workers/scrambler/.venv
uv pip install --python workers/scrambler/.venv/Scripts/python.exe -r workers/scrambler/requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu --index-strategy unsafe-best-match
$env:SCRAMBLER_HMAC_SECRET="<gemeinsames-starkes-Secret-mit-dem-Backend>"
$env:HF_HOME="$PWD/.omc/huggingface"
$env:TORCH_HOME="$PWD/.omc/torch"
workers/scrambler/.venv/Scripts/python.exe -m uvicorn app:app --app-dir workers/scrambler --host 127.0.0.1 --port 8091
```

`POST /v1/scramble` entspricht dem Request/Response der Haupt-README. `SCRAMBLER_WORKER_API_KEY` prüft ausschließlich `Authorization: Bearer <key>`. `SCRAMBLER_HMAC_SECRET` ist verpflichtend für Produktionsjobs und prüft `X-Scrambler-Signature-256: sha256=<hex>` über die unveränderten JSON-Requestbytes. Beide Geheimnisse sind getrennt.

Die Produktion lädt echte vortrainierte OpenCLIP-Modelle; bei fehlenden Paketen/Gewichten wird HTTP 503 geliefert. Der gelieferte automatische Wechsel auf einen synthetischen Frequenzencoder wurde entfernt. Synthetische Encoder werden ausschließlich explizit in Offline-Unit-Tests injiziert und belegen keinerlei Schutzwirkung.

Ziel: `ViT-B-32 / laion2b_s34b_b79k`; Transfer: `ViT-B-16-SigLIP / webli`. Modellabhängige Größe/Normalisierung werden übernommen. PGD nutzt echte Autograd-Gradienten, einen zufälligen Start innerhalb des Budgets und Projektion. Der Zufallsstart allein ist keine Schutzschicht. SSIM wird am resultierenden RGB-Bild über 8×8-Luminanzfenster gemessen; Standardminimum 0.97 kann durch Requests nicht abgesenkt werden. Dies ist eine konkret definierte SSIM-Variante, keine Zusicherung identischer Werte anderer SSIM-Implementierungen.

Die optionale `encoders`-Injektion im Python-Funktionsaufruf ist nur für lokale Tests verfügbar; die HTTP-Route akzeptiert diese Einstellung niemals aus Requestdaten. Nur bei dieser expliziten lokalen Injektion darf die Testkonfiguration ohne HMAC arbeiten. Der echte CPU-Smoke-Lauf signiert dennoch seine Requestbytes.

## Grenzen

Das Zeitlimit wird kooperativ zwischen Iterationen geprüft; ein blockierter Modelldownload oder ein einzelner Framework-Aufruf lässt sich damit nicht hart abbrechen. Modelle werden derzeit je Job geladen. `/health` bestätigt nur den laufenden HTTP-Dienst, keine Modellbereitschaft. Tiling erhält Auflösung, garantiert aber weder globale adversariale Wirkung noch weniger als 4 GB Speicher. Mutable RGB-Puffer werden überschrieben; Python-/Framework-Kopien können nicht garantiert sicher gelöscht werden. Ohne getrennte Prozessisolation/Reverse-Proxy-Timeout nicht als öffentlich erreichbaren Produktionsdienst freigeben.

`smoke_cpu.py` ist ein expliziter echter CPU-Lauf mit 48×48-Testverlauf, beiden vortrainierten Modellen, OS-Peak-RAM und messwertbasiertem JSON. Ein einzelnes kleines Bild belegt keine allgemeine Robustheit oder Wirksamkeit.

## Messstand

Am 23.10.2026 tatsächlich ausgeführt: Python 3.11.15, torch 2.5.1+cpu, open_clip_torch 2.29.0, CPU mit zwei Torch-Threads, offline aus zuvor geladenen offiziellen Checkpoints. `pytest workers/scrambler -q -p no:cacheprovider`: **10 bestanden**, 1 AnyIO-Deprecation-Warnung, 1.39 s. Die erste Sandbox-Ausführung scheiterte an temporären Windows-Verzeichnisrechten; derselbe Testlauf mit freigegebenen Projekt-Verzeichnissen bestand.

Echter `smoke_cpu.py`-Lauf (48×48 RGB-Farbverlauf, Stärke leicht, 6 PGD-Iterationen, L∞-Budget 4/255):

| Messgröße | Gemessener Wert |
|---|---:|
| CLIP ViT-B-32 Kosinus vorher → nachher | 1.00000 → 0.55434 |
| SigLIP ViT-B-16 Transfer-Kosinus vorher → nachher | 1.00000 → 0.91605 |
| SSIM (definierte 8×8-Luminanzfenster) | 0.9886283363347741 |
| Erzwungene SSIM-Untergrenze | 0.97 |
| PSNR | 39.10981106381007 dB |
| Verarbeitung ohne Modellladen | 2.563 s |
| Gesamt inklusive lokalem Modellladen | 50.609 s |
| OS-Peak-Working-Set des Prozesses | 1,653,829,632 Bytes (ca. 1.540 GiB) |
| Kacheln / Budgetreduktionen | 1 / 0 |

Maschinenlesbare Rohwerte: `cpu-measurements.json`. Die Kosinus-Ausgangswerte sind Original-gegen-sich-selbst. Der PGD-Start ist stochastisch; Wiederholungen müssen nicht dieselben Werte liefern. Dies ist ein echter Funktionsnachweis mit zwei vortrainierten Encodern, kein Nachweis einer allgemeinen Schutzwirkung oder Plattform-Robustheit. Große Bilder und GPU-VRAM wurden nicht gemessen.

Checkpointquellen (offizielle OpenCLIP-v2.29-Registry): `laion/CLIP-ViT-B-32-laion2B-s34B-b79K` Revision `1a25a446712ba5ee05982a381eed697ef9b435cf`; `timm/ViT-B-16-SigLIP` Revision `41f575766f40e752fdd1383e9565b7f02388c1c4`. Primärquellen: https://github.com/mlfoundations/open_clip/blob/v2.29.0/src/open_clip/pretrained.py und https://github.com/mlfoundations/open_clip/blob/v2.29.0/src/open_clip/model.py .
