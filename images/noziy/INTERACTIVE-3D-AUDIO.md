# INTERACTIVE 3D & AUDIO SPECIFICATION – DJ NOIZY NEIGHBOUR

Dieses Dokument beschreibt die technische Umsetzung der interaktiven 3D- und Web-Audio-Features (Three.js + Web Audio API + Iso-Glow).

---

## 1. Übersicht der 3D-Erlebnisse

Die Webseite bietet zwei voll interaktive 3D-Instrumente, die direkt im Browser ohne externe Plugins gerendert werden:
1. **Technics SL-1210 Vinyl Turntable (Plattenspieler)** – Scratching, Pitching, Tonarm-Physik.
2. **Akai MPC 3000 Beat Sampler** – 16 hintergrundbeleuchtete Pads, Sample-Triggering, Lowpass-Filter-Regler und Iso-Glow.

---

## 2. Der 3D-Plattenspieler (Technics SL-1210 Style)

### 2.1 Modell-Aufbau (Three.js Procedural / Primitives)
- **Gehäuse:** Abgerundeter Quader (`BoxGeometry`) in Anthrazit/Charcoal metallic (`roughness: 0.4`, `metalness: 0.6`).
- **Plattenteller (Platter):** Zylinder mit gezacktem Rand (Stroboskop-Punkte für 33/45 RPM).
- **Vinyl-Schallplatte:**
  - Flacher Zylinder mit Rillen-Bump-Map (`assets/ui/ui-grooves-texture.webp`).
  - Mittel-Label (Run-out Groove) mit orangefarbenem Sunburst-Artwork (`assets/branding/logo-transparent.webp`).
- **Tonarm:**
  - Drehbare Basis mit Antiskating-Gewicht.
  - S-förmiges Metallrohr mit Ortofon Concorde Tonabnehmer & roter Nadelbeleuchtung.
- **Bedienelemente:**
  - Großer Start/Stop-Button (drückbar).
  - 33 / 45 RPM Taster mit roter LED.
  - Pitch-Fader (+/− 8%) mit Schieber (`PlaneGeometry` mit Markierungsstrichen).

### 2.2 Interaktionen & Physik
1. **Vinyl Scratching:**
   - Ein Klick/Touch auf die rotierende Platte stoppt die Standard-Drehung und koppelt die Winkelgeschwindigkeit direkt an die Maus-/Fingerbewegung.
   - Bei schneller Bewegung vor/zurück wird der Audioschnipsel via Web Audio API manipuliert (`playbackRate = deltaX * factor`).
2. **Tonarm-Automatik:**
   - Klick auf `Start/Stop`: Der Tonarm schwenkt sanft auf die Einlaufrille der Platte (`gsap` oder Drehwinkel-Interpolation), die Platte beschleunigt auf 33 ⅓ RPM.
   - Klick auf `Stop`: Platte bremst mit sanftem Trägheits-Auslauf ab, Tonarm hebt ab und kehrt in die Halterung zurück.
3. **Pitch-Fader:**
   - Ziehen des Schiebers verändert die Rotationsgeschwindigkeit der 3D-Platte und synchron die Tonhöhe/Geschwindigkeit des abgespielten Tracks (`playbackRate: 0.92 ... 1.08`).

---

## 3. Die 3D-MPC-Beatstation (Akai MPC 3000 Style)

### 3.1 Modell-Aufbau
- **Gehäuse:** Klassisches 80s/90s Keilgehäuse (`BoxGeometry` mit schrägem Bedienfeld) in mattem Vintage-Cream (`#F6EAD9`) mit dunkelgrauer Beschriftung.
- **16 Drum-Pads (4×4 Matrix):**
  - Dicke Gummipads (`BoxGeometry` mit abgerundeten Ecken).
  - Material: `MeshStandardMaterial` mit `emissive`-Eigenschaft.
- **Display:** Retro-LCD-Display mit bernsteinfarbener oder mintgrüner Hintergrundbeleuchtung, zeigt aktuelles BPM (z. B. `BPM: 94.0`), Bank (`BANK A: FUNK STEMS`) und VU-Spitzen.
- **Drehregler (Knobs):**
  - Großer Data-Wheel-Encoder.
  - Filter Cutoff Knob (drehbar per Mausrad oder Drag).
  - Volume / Gain Poti.

### 3.2 Iso-Glow & Beleuchtungs-Engine
- **Iso-Glow Effekt:**
  - Jedes Pad besitzt eine darunterliegende Punktlichtquelle (`PointLight`) oder nutzt einen Mesh-Shader mit dynamischem `emissiveIntensity`.
  - Im Ruhezustand glimmt das Pad sanft in dezentem Orange (`#E85C0D`, Intensität 0.2).
  - Beim Anschlagen flammt das Pad explosionsartig in hellem Sunburst-Gelb (`#F6B436`, Intensität 2.5) auf und fadet innerhalb von 180 ms exponentiell ab.
- **CRT / Studio Ambience:**
  - Eine warme, bernsteinfarbene Studio-Lichtquelle von links oben erzeugt weiche Schatten auf den Reglern.
  - Optionaler Scanline-Shader über dem LCD-Display.

### 3.3 Pad-Belegung & Sound-Bänke
Die 16 Pads sind über drei Bänke umschaltbar:
- **Bank A – Funk & Drum Kit:**
  - Pad 1–4: Kick Drum, Snare Crack, Hi-Hat Closed, Hi-Hat Open
  - Pad 5–8: Tom High, Tom Low, Clap, Shaker Groove
  - Pad 9–12: Funk Bass Stab 1, Funk Bass Stab 2, Rhodes Chord, Wah-Guitar Lick
  - Pad 13–16: Vinyl Scratch Down, Vinyl Scratch Up, Vocal "Yeah!", Berlin Horn Hit
- **Bank B – Noizy Track Stems (Aus den beiliegenden 3 Tracks):**
  - Pad 1–4: *Berlin Funk Groove* Loop 1, Loop 2, Bassline, Horn Break
  - Pad 5–8: *Kater Night Session* Drums, Synth Arp, Vocal Chops, Dub Delay Hit
  - Pad 9–12: *Neighbourhood Lo-Fi* Drum Break, Piano Chords, Vinyl Noise, Sub Bass
  - Pad 13–16: 15s-Sample-Loops (`sample-loop-32.mp3`, `sample-loop-37.mp3`, `sample-loop-43.mp3`)
- **Tastatur-Steuerung:**
  - Reihe 4: `1`, `2`, `3`, `4`
  - Reihe 3: `Q`, `W`, `E`, `R`
  - Reihe 2: `A`, `S`, `D`, `F`
  - Reihe 1: `Z`, `X`, `C`, `V`

---

## 4. Web Audio API Signal-Routing

```text
[AudioBufferSource / HTMLMediaElement]
             │
             ▼
     [BiquadFilterNode]  <── Gesteuert durch den MPC Cutoff-Drehregler (20 Hz - 20 kHz)
             │
             ▼
        [GainNode]       <── Master-Lautstärke & Mute
             │
             ├──────────────────────────┐
             ▼                          ▼
     [AnalyserNode]           [audioContext.destination]
             │                      (Lautsprecher)
             ▼
     VU-Meter & 3D-Glow
     Frequenz-Visualisierung
```

### 4.1 Autoplay & AudioContext-Richtlinie
- Der `AudioContext` wird beim ersten Klick oder Tippen des Nutzers (z. B. Klick auf den Header, `[Play Beats]`, oder Anschlagen eines MPC-Pads) nahtlos mit `audioContext.resume()` aktiviert.
- Kein stummer Fehler, kein Browser-Blocking.

---

## 5. Performance & Mobile Optimierung

- **Three.js Instanced / Low-Poly:** Die Geometrien sind performant modelliert (< 3.000 Vertices pro Instrument), sodass sie auch auf mobilen Endgeräten mit 60 FPS laufen.
- **Pixel-Ratio-Begrenzung:** `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.
- **Visibility-Pause:** Wenn der Browser-Tab in den Hintergrund wechselt (`document.hidden`), wird die Three.js Render-Loop gestoppt, um CPU/Akku zu schonen.
- **Graceful Fallback:** Falls WebGL auf einem älteren Gerät deaktiviert ist, schaltet die Komponente automatisch auf eine stilisierte 2D-CSS/Canvas-Ansicht des MPCs mit voller Sound-Funktionalität um.
