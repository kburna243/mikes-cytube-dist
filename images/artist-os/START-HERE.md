# Artist OS – DJ Noizy Neighbor · Google AI Studio Paket

Willkommen im offiziellen Entwicklungs-Paket zur Weiterentwicklung der **DJ Noizy Neighbor** Web-Applikation (`1.6.2`) zum modularen **Artist Operating System (Artist OS)** nach dem Answer 42 / D&B Hausstandard (`federfuehrer` / `comicfeder`).

Dieses Verzeichnis auf GitHub ermöglicht es, das gesamte Projekt direkt in **Google AI Studio** (oder anderen LLM-Agenten) ohne Entpackungs-Schwierigkeiten (*"AI Studio mag kein ZIP"*) zu nutzen.

---

## 📂 Paket-Struktur & Schnellzugriff

| Datei / Ordner | Beschreibung & Zweck |
|---|---|
| **[`AISTUDIO-PROMPT-CHAIN.md`](AISTUDIO-PROMPT-CHAIN.md)** | **Der Master-Prompt-Leitfaden für Google AI Studio:** Prompt 0 (System Instruction) + Sprints 1–6 (Schritt-für-Schritt Ausführung). |
| **[`ARCHITEKTUR-ARTIST-OS.md`](ARCHITEKTUR-ARTIST-OS.md)** | Vollständige Architektur-Spezifikation: 6 Module (A–F), 6 Nutzerwelten (RBAC), 4-Schichten Audio-Protection-Engine & Wiederverwendungs-Matrix. |
| **[`README-ARTIST-OS.md`](README-ARTIST-OS.md)** | Kurzanleitung & Komponenten-Übersicht des Bundles. |
| **[`START-HERE.md`](START-HERE.md)** | Diese Start-Übersicht mit allen Raw-URLs. |
| **`src/`** | Produktive Codebasis der DJ Noizy Neighbor App (`1.6.2`): Iso-Glow TT-33 Turntable, DR-16 Drum Machine, Marken-Werkstatt (`components/werkstatt/`), Content-Schleuder (`components/schleuder/`), Admin-Bereich & FFmpeg-Pipeline. |
| **`comicfeder-reference/`** | Wiederverwendbare Schutz- & Infrastruktur-Module aus `comicfeder`: DCT-Wasserzeichen (`invisibleWatermark.ts`), sichtbare Overlays, IPTC/XMP-Metadaten (`metadata.ts`), Adversarial AI-Scrambler (`scrambler.ts` + Python Worker), Anti-LLM-Guards (`llm.ts`, `aiRoutes.ts`), Auth, DB & ASR. |
| **`docs/`** | Enthält zusätzlich `KONZEPT-ARTIST-OS.md` (1.265 Zeilen Original-Konzept), `BRAND.md` & `PROPOSAL-REFERENZPROJEKT.md`. |
| **`brand-kit-tokens/`** | Design-Tokens, Farbschemata (`#FF6B00`, `#00E5FF`, `#101014`) und Typografie. |
| **`public/`** | Alle Web-Assets: Audio-Tracks, Gems-Videos, Merch-Fotos, Logos & Texturen. |
| **`deploy/` & Configs** | `Dockerfile`, `package.json`, `tsconfig.json`, `next.config.ts`, `drizzle.config.json`, `.env.example`. |

---

## 🎯 Wichtigste Online Raw-URLs für Google AI Studio

- **Repository-Ordner:**  
  `https://github.com/kburna243/mikes-cytube-dist/tree/main/images/artist-os`
- **Master Prompt Chain:**  
  `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/artist-os/AISTUDIO-PROMPT-CHAIN.md`
- **Architektur & Schutz-Engine:**  
  `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/artist-os/ARCHITEKTUR-ARTIST-OS.md`
- **Original-Konzept:**  
  `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/artist-os/docs/KONZEPT-ARTIST-OS.md`
- **Brand Guide:**  
  `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/artist-os/docs/BRAND.md`

---

## 💡 Anleitung für Google AI Studio

1. **System Instruction einrichten:**  
   Kopiere **Prompt 0** aus `AISTUDIO-PROMPT-CHAIN.md` in das Feld *System Instructions* in Google AI Studio.
2. **Sprints sequentiell abarbeiten:**  
   - **Sprint 1:** Fundament, 6 Nutzerwelten (RBAC) & Modul C (Track- & Ideen-Hub mit Waveform-Player)
   - **Sprint 2:** Audio- & Visual-Protection-Engine (`src/lib/protect/*`) + Forensik-Verify
   - **Sprint 3:** Modul D (Release-Command-Center) & Golden Path (Track zu Release)
   - **Sprint 4:** Modul A (Marken-Werkstatt) + Modul B (Content-Schleuder) + Modul E (Asset-Hub)
   - **Sprint 5:** Modul F (EPK-, Booking- & Share-Center mit personalisierten Token-Links)
   - **Sprint 6:** Hardening, Security-Gates (`tools/security.sh`), Vitest & Docker-Build
