# PLAN – DJ NOIZY NEIGHBOUR (noziy) · Website & Experience Blueprint

Dieses Dokument definiert das vollständige Architektur-, Design- und Inhalts-Konzept für die Web-Präsenz von **DJ Noizy Neighbour**.

---

## 1. Brand Identity & Design System

### 1.1 Brand Concept & Vibe
> *"A crate-digging DJ & Producer bridging the worlds of rare Funk & Soul, Hip Hop and Lo-Fi. Authentic, urban and timeless."*
> **Keywords:** RARE FUNK • SOUL • BEATS • HIP HOP • LO-FI • CRATE-DIGGING • BERLIN UNDERGROUND

Die Ästhetik verbindet die analoge Wärme von 70s-Vinyl-Covern und Vintage-Web-Sheets mit der rohen Berliner Clubkultur (Kreuzberg/Friedrichshain, Kater Blau, U-Bahn, Flightcases, Spätkauf-Neons) und modernster 3D/Web-Audio-Technologie.

### 1.2 Farbpalette (SSoT aus Asset-Sheet & Brandboard)
- **Charcoal (`#111111`)**: Tiefer Vinyl- & Asphalt-Hintergrund, Kontrastanker.
- **Vinyl Orange (`#E85C0D`)**: Signal- und Akzentfarbe (Primary Buttons, Active States, Logo-Sunburst, Knöpfe).
- **Sunburst (`#F6B436`)**: Warmer Vintage-Gelbton (Highlights, Badges, Sterne, Waveform-Peaks).
- **Cream (`#F6EAD9`)**: Sanfter, unaufdringlicher Hintergrundton für Cards, Sticker-Bordüren und Texte.
- **Olive (`#4B5B3B`)**: Erdiger 70s-Vintage-Ton für Badges, Sekundär-Buttons und Tag-Elemente.

### 1.3 Typografie
- **Display / Headings**: *Cooper Black* (oder Webfont-Alternativen wie *Recoleta*, *ChunkFive*, *Fraunces 900*). Verleiht der Seite den ikonischen, bauchigen Funk- & Soul-Charakter.
- **Body & UI**: *Montserrat* oder *Space Grotesk* (präzise, moderne Lesbarkeit, clean).
- **Technical & Metadata**: *Space Mono* / *JetBrains Mono* (für BPM, Trackzeiten, Rider-Specs, 3D-HUD).

---

## 2. Seitenstruktur & Routing (Multi-Page Experience)

Die Webseite ist keine einfache One-Page-Landingpage, sondern eine vollwertige Multi-Page-Applikation mit persistentem Audio-Player und nahtlosen Seitenübergängen:

### 🏠 2.1 `/` – Home / Landing
- **Hero-Bereich:**
  - Großes transparentes Logo (`assets/branding/logo-transparent.webp`) mit leichtem Parallax-Hover.
  - Hinterlegtes Berlin-Skyline-Banner mit Fernsehturm (`assets/ui/hero-skyline-banner.webp`).
  - Subhead: *"Rare Funk · Soul · Beats · Hip Hop · Lo-Fi"*.
  - Call-to-Actions: `[Play Beats ►]` (startet den persistenten Player) & `[Book DJ Noizy →]` (führt zu `/bookings`).
- **Interactive 3D Teaser:**
  - Kompakter Einblick in den 3D-Plattenspieler (Scratchable Vinyl) mit Umschalter zur 3D-MPC-Beatstation.
- **Featured Release:**
  - Cover-Artwork: *Neighbour Grooves LP* mit Spin-Effekt und direktem Track-Stream.
- **Live Dates Teaser:**
  - Die nächsten 3 anstehenden Shows mit `[Tickets]` & `[RSVP]`.
- **Merch Drop Preview:**
  - Karussell der aktuellen Kollektion (Snapback, Ringer Tee, Vinyl).
- **Newsletter / VIP Crate Club:**
  - Retro-Eingabefeld im Vintage-Kassettendeck-Stil für exklusive Mixtapes & Secret Gigs.

---

### 🎙️ 2.2 `/about` – About Me & Studio Bio
- **Bio Storytelling:**
  - Ursprung: Von den Plattenläden in Berlin-Mitte und Kreuzberg über versteckte Keller-Sessions bis zu Festival-Stages.
  - Crate-Digging-Philosophie: Die Kunst des Samplings, analoge Wärme, Vinyl-Only-Sets vs. Hybrid-Live-MPC-Performances.
- **Foto-Reportage (Echte Bild-Assets):**
  - Crate-Digging im Record Store (`photo-01-cratedigging-record-store.webp`)
  - Studio MPC Beatmaking (`photo-02-studio-mpc-beatmaking.webp`)
  - Berlin Nightwalk am U-Bahnhof (`photo-04-berlin-night-record-bag.webp`)
  - Greenroom Talk & Backstage Moods (`photo-05-...`, `photo-06-...`)
- **Gear & Studio Hardware (Equipment Grid):**
  - *Turntables:* 2× Technics SL-1210 MK2 + Ortofon Concorde Club
  - *Sampler:* Akai MPC 3000 & MPC Live II
  - *Mixer:* Condesa Lucia Rotary Mixer / Pioneer DJM-900NXS2
  - *Tape & FX:* Roland Space Echo RE-201, Strymon Deco

---

### 🎧 2.3 `/discography` – Musik, Beats & Playlists
- **Persistent Player Integration:**
  - Sticky Retro Audio Bar am unteren Bildschirmrand mit Play/Pause, Track-Scrubber, Lautstärke, Track-Info und VU-Meter.
- **Original Tracks (Im Paket enthalten):**
  1. *Track 01: Berlin Funk Groove (Original Mix)* – 94 BPM, F-Moll (Dauer: 3:23)
  2. *Track 02: Kater Night Session (Dub Edit)* – 105 BPM, D-Moll (Dauer: 3:21)
  3. *Track 03: Neighbourhood Lo-Fi Beats* – 88 BPM, A-Moll (Dauer: 3:26)
- **Interaktiver 3D MPC Remix & Beat Lab:**
  - Voller 3D-MPC-Sampler im Großformat: Spiele Drum-Loops, Loops aus den Tracks und Trigger per Keyboard/Touch ab.
- **Streaming & Externe Playlists:**
  - Vorbereitetes YouTube-Playlist-Embed (Custom Frame mit Retro-TV-Rahmen).
  - Vorbereitetes SoundCloud-Playlist-Widget (im dunklen Charcoal/Orange Theme).
  - Spotify Artist Link & Pre-Save Badges.

---

### 👕 2.4 `/shop` – Merch & Vinyl Store
- **Produktkatalog (Mit echten freigestellten Assets):**
  1. **Noizy Berlin Snapback Cap** – €34.00 (`merch-snapback-cap.webp`)
     - Schwarze Wollmischung, gestickter Fernsehturm-Sonnenuntergang-Patch.
  2. **Vintage Ringer T-Shirt** – €38.00 (`merch-ringer-tee.webp`)
     - Creme-Farben, abgesetzter olivgrüner Kragen, weicher Vintage-Siebdruck.
  3. **Limited Edition Denim Trucker Jacket** – €120.00 (`merch-denim-jacket.webp`)
     - Gewaschener schwarzer Denim, großflächiger Rückenstick.
  4. **Neighbour Grooves LP (12" Vinyl)** – €28.00 (`merch-vinyl-lp.webp`)
     - 180g Audiophile Vinyl, Gatefold-Cover, inklusive Download-Code.
  5. **Authentic Crate-Digger Hangtag & Sticker Set** – €5.00 (`merch-hangtag.webp`)
     - Sammler-Tag aus Pappe mit 5 wetterfesten Outdoor-Vinyl-Stickern.
- **E-Commerce Features:**
  - Größenwähler (S, M, L, XL), Quantity-Stepper, Slide-Over Cart Drawer (Warenkorb), Checkout-Simulation mit Gutscheincode-Feld (`NOIZY10`).

---

### 📅 2.5 `/bookings` – Tour Dates & Booking-Agentur
- **Tour- & Gig-Kalender:**
  - Tabelle anstehender & vergangener Club-Nächte (Kater Blau / Berlin, Watergate / Berlin, SO36 / Kreuzberg, Gretchen / Berlin, Fusion Festival).
  - Statusanzeigen: `CONFIRMED`, `SOLD OUT`, `TICKETS AVAILABLE`.
- **Interaktives Booking-Anfrage-Formular:**
  - Felder: Veranstalter / Club, Datum, Stadt/Location, Event-Typ (Club Night, Festival, Corporate, Vinyl-Only Session), Budget-Range, Nachricht.
- **Rider & Tech Specs (Download-Bereich):**
  - *Technical Rider:* Detaillierte Auflistung des Bühnen-Setups, Monitoring-Anforderungen und Signalwege.
  - *Hospitality Rider:* Getränke, Verpflegung und Reisekonditionen.

---

### 🌐 2.6 `/socials` – Social Hub & Kontakt
- **Social Media Cards:**
  - Instagram (`@djnoizyneighbour`), TikTok, YouTube, SoundCloud, Spotify, Resident Advisor.
- **Direktkontakt:**
  - Management / Booking E-Mail (z. B. `booking@noizyneighbour.com`), Presse-Anfragen (`press@noizyneighbour.com`).
- **Presse-Kit (EPK Download):**
  - 1-Klick Download aller hochauflösenden Presse-Fotos und Logo-Vektoren.

---

## 3. UI-Komponenten & Detail-Liebe (Retro Web Tricks)

1. **Sticky Retro Audio Bar:**
   - Schwebt dezent am unteren Rand, anlehnt an 80er-HiFi-Receiver (VU-Meter mit Zeigerausschlag oder LED-Balken, Track-Name mit Marquee-Laufschrift).
2. **Vinyl Needle Divider:**
   - Zwischen Abschnitten trennt die freigestellte Tonarm-Nadel (`assets/ui/divider-tonearm-needle.webp`) oder die Berliner Skyline (`assets/ui/divider-berlin-skyline.webp`).
3. **Sticker & Badges:**
   - Interaktive, rotierbare Sticker (`NEW`, `LIVE`, `EP`, `ALBUM`, `EVENT`) mit leichtem Schattenwurf.
4. **CRT & Grain Schalter:**
   - Optionaler Toggle im Footer für dezenten Vintage-Scanline- & Film-Grain-Effekt (CSS-basiert, GPU-optimiert).
