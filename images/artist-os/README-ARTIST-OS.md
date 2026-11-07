# Artist OS · Google AI Studio Starter-Paket (DJ Noizy Neighbor + Comicfeder Security)

**Stand:** 07.11.2026 · **Basis:** `noizy-web 1.6.2` (Next.js 16, React 19, Drizzle/Postgres) + `comicfeder` (Watermarking, Anti-LLM, Scrambler, Encrypted Connectors)

## Was steckt in diesem ZIP?

Dieses Paket (unter 45 MB, strikt < 100 MB für Google AI Studio) enthält **alles**, um die bestehende **DJ Noizy Neighbor** Plattform nach dem Konzept (`docs/KONZEPT-ARTIST-OS.md`) und unserem **Answer 42 / D&B Hausstandard** zum modularen **Artist Operating System (Artist OS)** weiterzuentwickeln:

| Pfad im ZIP | Inhalt & Zweck |
|---|---|
| **`src/`, `public/`, `package.json`, `Dockerfile`** | Der komplette, produktive Code der **DJ Noizy Neighbor** Web-App (`1.6.2`): 3D Direct-Drive Turntable (`TT-33`), 3D Drum-Machine (`DR-16`), 10-Track Soundtrack *Detektiv Funk Schnüffler*, Shop, Bookings, Admin, **Marken-Werkstatt** (`src/components/werkstatt/`) und **Content-Schleuder** (`src/components/schleuder/`). |
| **`comicfeder-reference/`** | Die originalen, vollständig getesteten Schutz- und Infrastruktur-Module aus **Comicfeder**:<br>• `lib/protect/invisibleWatermark.ts` (8×8 DCT + 5× Redundanz + HMAC-SHA256)<br>• `lib/protect/visibleWatermark.ts` (Sichtbares Wasserzeichen)<br>• `lib/protect/metadata.ts` (64-Bit pHash + IPTC/XMP `Data Mining: Prohibited`)<br>• `lib/protect/scrambler.ts` + `workers/scrambler/app.py` (HMAC-signierter PGD-Scrambler gegen Vision-Modelle)<br>• `lib/llm.ts` + `lib/aiRoutes.ts` (OmniRoute Fail-Closed Client + strikter Bild-Blocker `assertNoImageContent`)<br>• `lib/publish/crypto.ts` + `connectors.ts` (AES-256-GCM Connector-Tresor, HMAC-Webhooks, ZIP-Pakete)<br>• `lib/assets/magicBytes.ts` + `lib/auth.ts` + `lib/asr.ts` |
| **`docs/ARCHITEKTUR-ARTIST-OS.md`** | **Technische Hauptspezifikation:** Code-Wiederverwendungs-Matrix (`Noizy` × `Comicfeder`), Hausstandard-Regeln, Architektur der **6 Nutzerwelten** und Spezifikation der **4-stufigen Audio-Schutz-Pipeline**. |
| **`docs/prompts/AISTUDIO-PROMPT-CHAIN.md`** | **Die fertige 6-Sprint-Prompt-Kette für Google AI Studio** (inkl. System-Instruction und Copy-Paste-Prompts für Sprint 1 bis Sprint 6). |
| **`docs/KONZEPT-ARTIST-OS.md`** | Das Fachkonzept („Artist Command Center“ mit den Modulen A bis F, Rollen, KPIs und Golden Path). |
| **`docs/BRAND.md` & `brand-kit-tokens/`** | Verbindliche Markenregeln für **DJ Noizy Neighbor** (Schreibweise immer **ohne u**, Farb-Tokens, Archivo & Space Mono, Print-/Plattencover-Ästhetik). |

---

## Schnellstart in Google AI Studio

1. **ZIP hochladen / Projekt importieren:** Lade `artist-os-aistudio-bundle.zip` in Google AI Studio hoch.
2. **System Instruction setzen:** Öffne [`docs/prompts/AISTUDIO-PROMPT-CHAIN.md`](docs/prompts/AISTUDIO-PROMPT-CHAIN.md) und kopiere **Prompt 0 (System Instruction)** in das System-Prompt-Feld.
3. **Sprints nacheinander ausführen:**
   - **Sprint 1:** Fundament, DB-Schema für alle 6 Nutzerwelten, Multi-Role Auth, Audio-Magic-Bytes & Anti-LLM Media-Guard (`assertNoMediaContent` blockiert Bilder UND Audio an Sprachmodelle).
   - **Sprint 2:** 4-stufige Audio- & Bild-Schutz-Pipeline (Unsichtbares 1D-DCT Spread-Spectrum Audio-Watermark mit 22-Byte HMAC-SHA256 Payload, Hörbares Producer-Tagging, TDM-Opt-Out Metadaten + Spektraler 64-Bit `aHash`, Audio-Scrambler-Schnittstelle + „Ist das mein Track?“-Verifier).
   - **Sprint 3:** Producer & Beat-Lab Vault (`/studio/vault`) + externe **Music Supervisor Pitch World** (`/vault/share/[token]`).
   - **Sprint 4:** B2B CRM, 12-Stufen Deal-Pipeline, Split-Sheet-Rechner, Muster-Vertragsgenerator & **Client Scoring Portal** (`/portal/[projectToken]`).
   - **Sprint 5:** Multi-Artist Brand-Kit (EPK & Sync-One-Sheets), 30-Tage Campaign Engine mit OmniRoute-Text-KI, Release Hub (DistroKid-Companion, Smart-Links) & Analytics Cockpit.
   - **Sprint 6:** Unified Artist Command Center (`/studio`), interaktiver **6-Nutzerwelten-Umschalter** & End-to-End Golden-Path-Tests.
