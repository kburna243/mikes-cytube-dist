# Handoff · DJ Noizy Neighbor · für die nächste Claude-Session

**Stand:** 07.11.2026, morgens · **Letzter Commit:** `781c8f8` auf `main` · **Live:** noizy-web **1.6.2**

Lies zuerst diese Datei, dann [PROPOSAL-REFERENZPROJEKT.md](PROPOSAL-REFERENZPROJEKT.md) für das Gesamtbild und die Lehren.

## 1. Wo liegt was

| Was | Wo |
|---|---|
| Projektordner (zugleich Git-Repo) | `I:\claude-system\data\projects\dj noizy neighbour branding` |
| Remote | Forgejo `forgejo-servermitte:fried/noizy-brand-suite.git` (Web: http://100.79.153.116:3000/fried/noizy-brand-suite). Was ins Repo darf, regelt die Whitelist in `.gitignore` |
| Website-Code | `dj-noizy-neighbour-web-application_musterb/` (Next.js 16, Drizzle/Postgres). Deploy-Doku: `deploy/README.md` |
| Turntable Landing Page | `src/components/three/Turntable.tsx` (Iso-Glow TT-33 3D Direct Drive), `src/components/three/Turntable2D.tsx` (Iso-Glow 2D), Landing Hero `src/components/three/VinylHero.tsx` |
| Beat Lab & Drum Machine | `src/components/three/MPC3D.tsx` (Iso-Glow DR-16 3D), `src/components/three/MPC2D.tsx` (Iso-Glow 2D), `src/components/disco/DiscoClient.tsx` |
| Werkstatt / Schleuder in der Seite | `src/components/werkstatt/`, `src/components/schleuder/`. Diese Fassungen sind maßgeblich |
| Game & Soundtrack | `src/components/game/GameSoundtrack.tsx`, `src/views/GameView.tsx`, `src/views/MusicView.tsx` |
| Arena-Muster (nur Referenz) | `dj-noizy-branding-workshop/` (Werkstatt A/B), `dj-campaign-management-system/` (Schleuder A/B, nicht im Repo) |
| Brandkit für Arena (öffentlich) | `brandkit-werkstatt/`, Kopie auf GitHub `kburna243/mikes-cytube-dist/images/noizy-werkstatt-v1` |
| Brand-Kit aus den GPT-Sheets | `brand-kit/` (`Brand-Guide.html`), Skripte `asset-sheets/cut_sheets.py` und `build_kit.py`, Rohsheets `asset-sheets/eingang/` |
| Video-Verpackung | `video-packaging/` (HyperFrames 0.9.13). **Zuerst die dortige `CLAUDE.md` lesen.** Texte, Clip und Look in `config.json`, danach `node generate.mjs` |
| Reel | `video-packaging/portrait/noizy-reel-intro.mp4` (mit Gemini-Intro), `noizy-reel.mp4` (mit Sting). Renders sind nicht im Repo |
| Video-Rohmaterial | `videos/` (Gemini-Clips, Noizys Original `0821-01_1755748920406.mp4`), `videos/clips/` (Schnitte), `neue assets/` (WhatsApp-Kopien). Nicht im Repo |
| Projektdoku | `praesentation/doku.html` → `node scripts/render.cjs <playwright-pfad>`. Playwright liegt in `I:/claude-system/data/projects/detective funk schnüffler/detective-funk-schnüffler_-rare-groove-hustle/node_modules/playwright` |
| Content-Vorlage (alt) | `CONTENT-VORLAGE.md`. Abgelöst durch den Fragebogen im Admin |

## 2. Betrieb

- **Server:** servermitte, `/volume1/docker/noizy/` mit `docker-compose.yml` und `.env` (Passwörter, nicht im Repo, nie ausgeben). Container `noizy-web`, `noizy-db`, Volume `noizy_noizy_uploads`.
- **Deploy:** im Website-Ordner bauen, dann übertragen. Danach Backup der Compose-Datei anlegen, Tag umstellen und `docker-compose up -d`. Die Übertragung dauert über 10 Minuten, deshalb im Hintergrund laufen lassen:
  ```bash
  MSYS_NO_PATHCONV=1 docker build --build-arg BASE_PATH=/noizy -t noizy-web:<v> .
  ```
  ```bash
  docker save noizy-web:<v> | ssh servermitte /usr/local/bin/docker load
  ```
  `MSYS_NO_PATHCONV=1` ist in Git Bash Pflicht, sonst wird BASE_PATH zu einem Windows-Pfad.
- **Lokal entwickeln:** Docker Desktop starten, `docker start noizy-dev-db` (Port 55432), dann Preview `musterb` aus `.claude/launch.json` (Port 3217). Dev-Zugang in `.env.development.local`. Login per Skript, das Passwort aus der Datei liest und nicht ausgibt, siehe `praesentation/scripts/shoot-features.cjs`.
- **Gesperrt durch die Sicherheitsregeln:** direkte Schreibzugriffe auf die Produktions-DB und das Auslesen von Passwörtern. Produktionsdaten ändert Martin über den Admin.
- **Achtung Laufwerk C:** nur rund 1 GB frei. Docker legt seine Daten in `AppData\Local\Docker\wsl\disk\docker_data.vhdx` (37 GB) ab und ist zweimal stehen geblieben. npm-Cache für HyperFrames auf I setzen: `npm_config_cache=I:\claude-system\data\projects\.npm-cache`.

## 3. Live-Stand 1.6.2

- **Iso-Glow TT-33 Direct Drive Turntable auf der Landingpage (`/noizy/`):**
  - Vollständiger Umbau von `Turntable.tsx` und `Turntable2D.tsx` nach dem Vorbild des `TT-33 Direct Drive` aus dem `iso-glow`-Skill.
  - Dunkles Studio-Chassis mit 1px Haarlinien, 4 Standfüßen und 4 echten Kreuzschlitz-Schrauben auf der Bodenplatte.
  - Stroboskop-Ticks auf dem Tellerrand (Strobe-Muster) mit leuchtender roter Strobe-Pilotenlampe.
  - Präzise Tonarm-Kinematik:
    - Hebt vom Arm-Rest ab (`armLift`), schwenkt über die Einlaufrille (`armAngle`).
    - Senkt sich auf das Vinyl ab und trackt während der Wiedergabe gleichmäßig nach innen.
    - Automatischer Tonarm-Return bei Run-Out oder Stop zurück auf die Ruhestütze.
    - Cue-Funktion (Taste `C` oder Klick auf Tonarm/Cue-Bereich).
    - Subtile LED-Nadelleuchte (`stylusGlow`) an der Abtastspitze.
  - Noizy Records Berlin Vinyl-Label (512x512 Canvas-Grafik mit Orange-Akzent, Side A, 33⅓ RPM, "BACK ON 16 PADS").
  - Konzentrische Rillenringe auf dem Vinyl.
  - Beleuchteter START/STOP-Taster, 33 / 45 RPM Taster und Pitch-Slider (±8%) mit Rillenskala.
  - Volle Erhaltung von Scratch-Physik (Mausziehen/Drag), Pitch-Steuerung und Web-Audio-Anbindung.
  - 2D-Fallback im passenden Iso-Glow Look.
- **Iso-Glow DR-16 Drum Machine im Beat Lab live (`/noizy/discography`):**
  - Vollständiger Umbau von `MPC3D.tsx` und `MPC2D.tsx` nach den Design- und Funktionsprinzipien des `iso-glow`-Skills.
  - Dunkles Studio-Hardware-Chassis, 1px Haarlinien & Kanten-Creases, Bodenplatte mit 4 echten Kreuzschlitz-Schrauben.
  - Hintergrundbeleuchtetes Amber-LCD-Display mit Scanlines, Status-Anzeige (`112 BPM ▶ 01/16`), Pad-Info und **16 Step-Indikator-Kästchen** mit wanderndem Cursor.
  - 16 Glowing Pads mit Selection-Ring im Noizy-Vinyl-Orange (`#e85c0d`), mechanischer Sink-Animation und Emissive-Flash.
  - Integrierter 16-Step-Sequencer (112 BPM) mit Lauf-LEDs über den Step-Tastern, Live-Programmierung per Klick, Space für Play/Stop.
  - 16 Web-Audio-Synthesizer-Stimmen plus Weiterleitung auf Noizys Stems und Loops.
- **Original Soundtrack „Rare Groove Hustle“ integriert (aus 1.6.0):**
  - Unter `/spiel` (`src/views/GameView.tsx`) mit der Komponente `GameSoundtrack.tsx`: Interaktives Cover-Flip (Front & Back), Trackliste (10 Original-Tracks über Seite A & B), Audio-Preview für das Titelthema („Thema für den Funk Schnüffler“) und direkte Links zum Spiel sowie zur offiziellen Soundtrack-Landingpage.
  - Unter `/discography` (`src/views/MusicView.tsx`): Feature-Spotlight für den Original-Soundtrack als Album-Release neben *Back on 16 pads*.
  - Homepage-Teaser (`GameTeaser` in `src/components/home/HomeSections.tsx`): Badge „NEU: 10-Track Original Soundtrack“, aktualisierter Teaser-Text und Schnellzugriff auf den Soundtrack.
- **Live-DB-Prüfung und Synchronisation:**
  - Martins Änderungen in der Live-DB wurden ausgelesen und bestätigt: In `gems` Gem 4 `Woman!!` (Monica Lassen & The Sounds) und Gem 5 `あのままだよ` (Kenji Sawada).
  - Datenbank `noizy-db` und das Uploads-Volume blieben unangetastet.

## 4. Offen

**Martin (über den Admin):**
- [ ] Fragebogen „Inhalte prüfen“ durchgehen. Pflichtfelder: Newsletter ja/nein, Player-Tracks, Termine echt, Shop ja/nein, Mails, Instagram, Kurz-Bio, Impressum-Reste.
- [x] Gem-Namen in der Live-DB korrigiert: „Woman!!“ (Monica Lassen & The Sounds) und „あのままだよ“ (Kenji Sawada) gepflegt und synchronisiert.
- [ ] Echte Termine eintragen, die Beispieltermine löschen.
- [ ] Stadtteil bestätigen: Auf der Seite steht Friedrichshain, seine Adresse liegt in Zehlendorf.
- [ ] Originalvideos in voller Qualität schicken (als „Datei“, nicht über die Galerie), Hochformat wenn möglich, vor allem die Plattenteller-Clips.
- [ ] Bestätigen, dass die Tonspur im Reel sein eigener Beat ist.

**Technik:**
- [ ] SEO-Commit ausrollen, sobald Martin die Fakten im Fragebogen bestätigt hat. `llms.txt` und `schemaOrg.ts` sind schon auf die belegten Fakten korrigiert.
- [ ] Brand-Kit in Seite und Werkstatt einbauen: Icons, Texturen, Overlays, Hintergründe (`brand-kit/`).
- [ ] Logo-Ebenen am Kontrolllogo ausrichten und daraus den animierten 6-Sekunden-Logoaufbau in HyperFrames bauen. Ersetzt den Gemini-Logoaufbau mit seiner harten Kante im Hochformat.
- [ ] Restliche Bausteine der Video-Verpackung laut `video-packaging/CLAUDE-HANDOFF.md`: Titelkarte mit Folge, Endkarte, transparente Overlays. Den Sting hat Fried noch nicht abgenommen.
- [ ] Logo-Sting und Reel-Vorlage in Werkstatt und Schleuder anbieten (Download, Anhang an Release-Posts).
- [ ] SVG-Vektoren für Logo und Icons, bisher gibt es nur PNG.
- [ ] Gemini-Hintergründe in 9:16 nachziehen. „Licht 16:9“ neu erzeugen, es ist fleckig und morpht.
- [ ] `LEGAL.hosting` in `src/lib/data.ts` ist noch ein Platzhalter (Server-Betreiber), dazu die Log-Aufbewahrung in der Datenschutzerklärung.
- [ ] Demo-Tracks im Player sind KI-Platzhalter. Ersetzen, sobald Martin Audio schickt.
- [ ] Shop: Entscheidung abwarten. Wenn er verkauft, braucht es AGB und Widerruf.
- [ ] Alte Images auf servermitte aufräumen (1.0.0 bis 1.2.0), nur nach Freigabe.
- [ ] Docker-Speicher nach D verlegen (macht Fried in Docker Desktop).

**Strategisch:**
- [ ] Content-Schleuder als markenneutrales Modul für Answer 42 und als Kunden-Service herauslösen. Stufe 2: Posten über Postiz.
- [ ] Video-Verpackung als Proof of Concept für die Nordstern-Strategie weiterführen.

## 5. Regeln, die hier gelten

- Destruktive Aktionen (löschen, Dienste stoppen, Config überschreiben) nur nach Freigabe pro Item.
- Schreibweise immer **NEIGHBOR**, nie „Neighbour“, auch in generierten Bildern und Texten.
- Keine Fakten erfinden. Was Martin nicht bestätigt hat, kommt in den Fragebogen, nicht auf die Seite.
- Vor einem Deploy Backup der Compose-Datei auf dem Server (`docker-compose.yml.bak-vor-<version>`), danach live prüfen.
- Commits enden mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
