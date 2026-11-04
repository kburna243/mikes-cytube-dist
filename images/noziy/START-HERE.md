# START HERE – DJ NOIZY NEIGHBOUR (noziy) · Web-Asset-Paket v1.0

Willkommen im offiziellen Asset- und Entwicklungs-Paket für die High-End Artist-Webseite von **DJ Noizy Neighbour** (Rare Funk · Soul · Beats · Hip Hop · Lo-Fi).

Dieses Paket wurde nach dem bewährten **Arena-Standard** (analog zum `ischia-v2`-Referenzmodell) aufbereitet: alle Rohdateien wurden bereinigt, semantisch benannt, in moderne Webformate konvertiert (WebP, MP3 192k, WebM Opus), UI- und Merch-Komponenten freigestellt und in einem maschinenlesbaren `manifest.json` katalogisiert.

---

## 📂 Paket-Struktur

```text
C:\Users\Fried\Downloads\noziy\
├── ARENA-PROMPT.md             <-- DER MASTER-PROMPT (Kopieren & in Arena / Coding-Agent einfügen)
├── START-HERE.md               <-- Diese Übersicht & Schnellstartanleitung
├── PLAN.md                     <-- Gesamtarchitektur, Seitenstruktur, Komponenten & Design-System
├── INTERACTIVE-3D-AUDIO.md     <-- Detail-Spezifikation für 3D-Turntable & 3D-MPC-Beatmaker (Three.js + Web Audio)
├── manifest.json               <-- Maschinenlesbares Asset-Manifest mit Maßen, Hashes, Kategorien & Rollen
├── assets/
│   ├── branding/               <-- Offizielles Logo (transparent), Brandboard & Retro Asset Sheet
│   ├── photos/                 <-- 9 authentische Presse- & Lifestyle-Fotos (JPG + WebP)
│   ├── audio/                  <-- 3 Original-Tracks (MP3 + WebM) + 3 Stem-Sample-Loops für MPC
│   ├── merch/                  <-- 5 freigestellte Merch-Produkte für den Shop (Cap, Tee, Jacket, Vinyl, Tag)
│   └── ui/                     <-- Hero-Banner, Texturen, Icons, Divider, Badges & Patterns
└── raw/                        <-- Originale Quelldateien (nicht-destruktiv archiviert)
```

---

## 🎯 Die 4 Kern-Dokumente (Online erreichbar)

- **Repository:** https://github.com/kburna243/mikes-cytube-dist/tree/main/images/noziy
- **Manifest:** https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noziy/manifest.json
- **Plan:** https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noziy/PLAN.md
- **3D & Audio:** https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noziy/INTERACTIVE-3D-AUDIO.md

1. **`ARENA-PROMPT.md`**: Der verbindliche Ausführungsauftrag für den Web-Builder / Coding-Agenten. Enthält alle Regeln, Tech-Stack-Vorgaben, Meilensteine und Datenmodelle.
2. **`manifest.json`**: Jede Datei mit Raw-Download-URL, Kategorie, Bildabmessungen, Dateigröße, SHA-256 Hash und zugewiesener Platzierung auf der Webseite.
3. **`PLAN.md`**: Vollständiges Konzept für alle 6 Seiten (`/`, `/about`, `/discography`, `/shop`, `/bookings`, `/socials`), Design-Tokens (Charcoal `#111111`, Vinyl Orange `#E85C0D`, Sunburst `#F6B436`, Cream `#F6EAD9`, Olive `#4B5B3B`) und UX-Flow.
4. **`INTERACTIVE-3D-AUDIO.md`**: Blueprint für die interaktive 3D-Experience mit Three.js (Plattenspieler mit Scratch-Physik + MPC 3000 Beat-Pads mit Web Audio API Trigger & Iso-Glow).

---

## 💡 Schnellstart: So baust du die Seite

1. Öffne **`ARENA-PROMPT.md`**.
2. Kopiere den gesamten Inhalt ab der Trennlinie.
3. Füge ihn in deinen Coding-Agenten (WebDev Arena, Claude Code, Cursor, Gemini CLI) ein.
4. Der Agent liest `manifest.json`, bindet die optimierten Assets aus `assets/` direkt ein und baut die Seite schlüsselfertig.
