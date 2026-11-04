# ARENA-PROMPT – DJ NOIZY NEIGHBOUR (Official Artist Experience)

Kopiere alles ab der Linie in Arena, Claude Code, Cursor oder deinen bevorzugten AI-Entwickler.

---

Du baust die offizielle, responsive High-End-Webseite für **DJ Noizy Neighbour**, einen Berliner DJ und Musikproduzenten an der Schnittstelle von **Rare Funk, Soul, Beats, Hip Hop und Lo-Fi**.

Das Projekt ist keine bloße Landingpage, sondern eine vollständige, interaktive Multi-Page-Web-Applikation mit persistentem Audio-Player, 3D-Instrumenten (Three.js Plattenspieler & MPC-Sampler), Merch-Shop, Tour-Kalender, Booking-Portal und Social-Hub.

Alle Assets (Logo, optimierte Fotos, Audio-Tracks, Merch-Bilder, UI-Elemente und Texturen) sind **bereits fertig aufbereitet** und liegen lokal im Verzeichnis `assets/` bzw. sind im maschinenlesbaren `manifest.json` mit Hashes, Abmessungen und Rollen dokumentiert. **Keine Platzhalter-Grafiken generieren, sondern die beiliegenden echten Assets einbinden!**

---

## 1. Zuerst lesen & SSoT-Referenzen (Raw-Links funktionieren direkt)

- **Asset-Manifest (jede Datei mit direktem Download-Link, Maße, SHA-256 und Platzierung):**  
  `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noziy/manifest.json`
- **Architektur & Seitenplan:**  
  `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noziy/PLAN.md`
- **3D- & Audio-Blueprint (Three.js Plattenspieler & MPC-Sampler):**  
  `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noziy/INTERACTIVE-3D-AUDIO.md`
- **GitHub Repository Übersicht:**  
  `https://github.com/kburna243/mikes-cytube-dist/tree/main/images/noziy`

---

## 2. Verbindlicher Tech-Stack

- **Core:** Vite + React (v18 oder v19) + TypeScript (strikter Modus).
- **Styling:** Tailwind CSS (oder CSS Modules mit Design Tokens).
- **Icons:** `lucide-react`.
- **3D & Animation:** Three.js (`three` / `@types/three` oder `@react-three/fiber` + `@react-three/drei`), GSAP oder Framer Motion für weiche UI-Tweens.
- **Audio-Engine:** Native Web Audio API + HTML5 Audio.
- **Build & Quality:** Keine TypeScript-Fehler (`tsc --noEmit`), saubere relative Pfade (`base: "./"`), offline-fähig und mobil responsiv (getestet für 390px iPhone bis 4K Desktop).

---

## 3. Design-System & Brand Tokens

### 3.1 Farbwerte (aus Markenboard & Retro-Asset-Sheet)
```css
:root {
  --color-charcoal: #111111;     /* Tiefer Asphalt- & Vinyl-Hintergrund */
  --color-vinyl-orange: #E85C0D; /* Primäre Akzentfarbe, Knöpfe, Play-Buttons */
  --color-sunburst: #F6B436;     /* Warmer 70s Gelbton, Badges, Frequenz-Peaks */
  --color-cream: #F6EAD9;        /* Textfarbe, Sticker-Bordüren, MPC-Gehäuse */
  --color-olive: #4B5B3B;        /* Erdiger 70s Ton, Sekundärbuttons, Tags */
}
```

### 3.2 Typografie & Stilmittel
- **Display-Headlines:** *Cooper Black* (oder Webfont-Alternativen wie *Recoleta*, *ChunkFive*, *Fraunces 900*). Verleiht der Seite den warmen, bauchigen Funk- & Soul-Charakter.
- **Fließtext & UI:** *Montserrat* oder *Space Grotesk* (klar, modern, hochgradig lesbar).
- **Tech / Metadata:** *Space Mono* (für BPM, Spielzeiten, Tech-Rider).
- **Stil-Details:**
  - Sticker-Look mit 2px bis 4px cremefarbenen Umrandungen und harten Vintage-Schatten.
  - Subtile Körnung (Grain) und optional zuschaltbare Retro-Scanlines.
  - Trennelemente: Berliner Skyline (`assets/ui/divider-berlin-skyline.webp`) und Tonarm-Nadel (`assets/ui/divider-tonearm-needle.webp`).

---

## 4. Multi-Page Architektur & Unterseiten

Die Applikation implementiert 6 vollständige Routen (z. B. via `react-router-dom` oder In-App Navigation) mit flüssigen Übergängen:

### 4.1 `/` – Home / Landing
- **Hero-Section:**
  - Zentral platziertes transparentes Sticker-Logo (`assets/branding/logo-transparent.webp`).
  - Hinterlegtes Sonnenuntergangs-Banner mit Berliner Fernsehturm (`assets/ui/hero-skyline-banner.webp`).
  - Slogan: *"Rare Funk · Soul · Beats · Hip Hop · Lo-Fi"*.
  - CTAs: `[Play Beats ►]` (startet den persistenten Player) & `[Booking Anfragen →]` (Route nach `/bookings`).
- **Interactive 3D Teaser:**
  - 3D-Plattenspieler (Scratchable Vinyl mit Maus/Touch) und Direktlink zur Discography.
- **Featured Release Card:**
  - Präsentation der *Neighbour Grooves LP* mit Vinyl-Spinning-Animation, Trackliste und Kaufen-Button.
- **Tour-Ticker:**
  - Die nächsten anstehenden Termine mit Schnellzugriff auf Tickets.
- **Merch Drop & VIP Crate Club:**
  - Produktvorschau und Newsletter-Eingabe im Vintage-Kassettendeck-Design.

### 4.2 `/about` – About Me & Studio Story
- **Künstler-Biografie:**
  - Von den Berliner Plattenläden in Kreuzberg und Mitte bis zu internationalen Club-Nächten.
  - Das Manifest: Crate-Digging als Lebenseinstellung, analoges Sampling, Wärme von Bandmaschinen und Vinyl.
- **Foto-Reportage (Echte Bild-Assets eingebunden):**
  - Crate-Digging im Record Store (`assets/photos/photo-01-cratedigging-record-store.webp`)
  - Studio MPC Beatmaking (`assets/photos/photo-02-studio-mpc-beatmaking.webp`)
  - Live DJ Set hinter den Turnies (`assets/photos/photo-03-live-dj-set-turntables.webp`)
  - Berliner Nachtspaziergang am U-Bahnhof (`assets/photos/photo-04-berlin-night-record-bag.webp`)
  - Backstage Greenroom Vibes (`assets/photos/photo-05-...`, `photo-06-...`)
- **Equipment & Gear-Rig:**
  - Detailliertes Gear-Grid mit Spezifikationen (2× Technics 1210 MK2, Akai MPC 3000, Roland Space Echo RE-201, Condesa Rotary Mixer).

### 4.3 `/discography` – Musik, Beats & Playlists
- **Persistenter Audio-Player (am unteren Bildschirmrand):**
  - Läuft nahtlos über alle Seiten hinweg weiter, ohne Unterbrechung.
  - Retro HiFi-Bar mit Play/Pause, Skip, Waveform-Scrubber, Zeitanzeige, Lautstärke und zuckendem VU-Meter.
- **Original-Tracks (im Paket enthalten):**
  1. *Track 01: Berlin Funk Groove (Original Mix)* – 94 BPM, F-Moll, 3:23 Min (`assets/audio/track-01-berlin-funk-groove.mp3`)
  2. *Track 02: Kater Night Session (Dub Edit)* – 105 BPM, D-Moll, 3:21 Min (`assets/audio/track-02-kater-night-session.mp3`)
  3. *Track 03: Neighbourhood Lo-Fi Beats* – 88 BPM, A-Moll, 3:26 Min (`assets/audio/track-03-neighbourhood-lofi-beats.mp3`)
- **Interaktives 3D MPC Remix & Beat Lab:**
  - Vollwertige 3D-MPC-Station: Spiele 16 hintergrundbeleuchtete Pads per Tastatur (1-4, Q-R, A-F, Z-V) oder Mausklick/Touch.
  - Triggere Funk-Drums, Basslines und die mitgelieferten Loops (`assets/audio/sample-loop-*.mp3`).
  - Drehbarer Lowpass-Filter-Regler (Cutoff-Poti moduliert den Web Audio BiquadFilter in Echtzeit).
- **Externe Playlists & Streaming:**
  - YouTube-Playlist-Embed (stilvoll eingefasst im Retro-Monitor-Rahmen).
  - SoundCloud-Embed (Dark Charcoal / Orange Widget).
  - Spotify- und Apple Music-Links.

### 4.4 `/shop` – Merch & Vinyl Store
- **Produkt-Katalog (mit echten freigestellten Assets):**
  1. **Noizy Berlin Snapback Cap** (€34.00) – `assets/merch/merch-snapback-cap.webp`
  2. **Vintage Ringer T-Shirt** (€38.00) – `assets/merch/merch-ringer-tee.webp`
  3. **Limited Edition Denim Trucker Jacket** (€120.00) – `assets/merch/merch-denim-jacket.webp`
  4. **Neighbour Grooves LP (12" Vinyl)** (€28.00) – `assets/merch/merch-vinyl-lp.webp`
  5. **Authentic Crate-Digger Hangtag & Sticker Set** (€5.00) – `assets/merch/merch-hangtag.webp`
- **Shop-Interaktion:**
  - Größen-Auswahl (S, M, L, XL), Mengenauswahl.
  - Slide-Over Warenkorb-Drawer (Cart) mit Gesamtsumme, Streichpreisen und Checkout-Modal (Simulation).

### 4.5 `/bookings` – Tour Dates & Booking-Agentur
- **Tour- & Gig-Kalender:**
  - Tabellarische Liste bestätigter Club-Nächte (z. B. Kater Blau, Watergate, SO36, Gretchen, Fusion Festival).
  - Statusanzeigen (`CONFIRMED`, `SOLD OUT`, `TICKETS`).
- **Booking-Anfrage-Formular:**
  - Validierte Formularfelder: Veranstalter / Venue, Datum, Stadt/Land, Event-Typ, Budget, Sound-Anforderungen.
- **Download-Bereich für Booker:**
  - Technical Rider & Stage Plot (direkt lesbar oder als PDF-Download bereitgestellt).
  - Hospitality Rider (Catering, Hotel & Reise-Vorgaben).

### 4.6 `/socials` – Social Hub & Kontakt
- **Social Media Grid:**
  - Direkte Verlinkungen mit Brand-Icons für Instagram, TikTok, YouTube, SoundCloud, Spotify, Resident Advisor.
- **Presse- & Management-Kontakt:**
  - E-Mail-Adressen für Presse, Booking und allgemeine Fan-Post.
  - Pressepaket-Download (EPK) mit hochauflösenden Pressefotos und Logo-Vektoren.

---

## 5. Technische Highlights: 3D & Web Audio (Three.js)

### 5.1 3D-Technics-Plattenspieler
- Prozedural modellierter Plattenspieler in Three.js (Gehäuse, drehender Plattenteller, Rillen-Bumpmap, Tonarm).
- **Scratch-Physik:** Platten-Drag mit Maus oder Touch bremst oder beschleunigt das Audio via `AudioBufferSourceNode.playbackRate`.
- **Tonarm-Automatik:** Start/Stop schwenkt den Tonarm physikalisch weich auf die Einlaufrille.
- **Pitch-Fader:** Schieberegler verändert BPM und Audio-Tonhöhe im Bereich von ±8%.

### 5.2 3D-Akai-MPC-Sampler mit Iso-Glow
- 16 Pads in 4×4 Anordnung mit dynamischem `emissiveIntensity`-Shader (Iso-Glow-Effekt).
- Beim Pad-Anschlag leuchtet das Pad explosionsartig in Sunburst-Gelb (`#F6B436`) auf und glimmt sanft in Vinyl-Orange (`#E85C0D`) nach.
- Sound-Bänke umschaltbar: Bank A (Drum Kit & Hits), Bank B (Track Chops & Loops), Bank C (Vinyl Scratches & FX).
- Filter-Knob: Maus-Drag oder Rad dreht den Poti und steuert einen Web Audio `BiquadFilterNode` (Lowpass 20 Hz – 20.000 Hz).

---

## 6. Lieferkriterien & Meilensteine

1. **Vollständige Multi-Page-Applikation:** Alle 6 Routen (`/`, `/about`, `/discography`, `/shop`, `/bookings`, `/socials`) sind funktionsfähig und verlinkt.
2. **Reale Asset-Integration:** Keine Platzhalter-Bilder verwenden; alle bereitgestellten Dateien aus `assets/` (Branding, Fotos, Audio, Merch, UI) sind eingebunden.
3. **Persistenter Sound:** Die Audio-Wiedergabe bricht beim Navigieren zwischen den Seiten nicht ab.
4. **Fehlerfreiheit:** `tsc --noEmit` läuft ohne Fehler durch; saubere Konsolenausgabe ohne Warnungen oder 404-Asset-Fehler.
5. **Responsivität:** Perfekte Bedienbarkeit auf Touch-Geräten (iPhone/Android) sowie Desktop.
