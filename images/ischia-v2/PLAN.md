# MY CRAZY TRIP TO ISCHIA – Spielplan (Nachfolger von BUNKERHAIN)

Stand: 19.10.2026 · Rail-/Lightgun-Shooter · Fake-3D aus 2D · Bunkerhain-Look · PWA mit echtem Vollbild

---

## 0. Ausgangslage (geprüft)

**Bunkerhain** (neuester Stand: `Downloads\bunkerhain-website-and-shooter-integration`)
- React 19 + TypeScript + Vite 7 + Tailwind 4, eigene **Canvas2D-Engine** (`src/game/engine.ts`, ~2100 Zeilen, eine Klasse).
- Logische Auflösung 1672×941 (16:9), skaliert mit Letterbox, Pointer-Events → `toWorld()`.
- Fake-3D heute: Gegner laufen von Horizont (Scale 0.38) zur Kamera (Scale 1.05), lineare Interpolation. **Die Kamera fährt nicht** – pro Welle ein statisches Hintergrundbild mit Crossfade.
- Gut und übernehmbar: Spritesheets mit Pivot/Bounds (`expansion-frames.json`), reine Logikmodule (`pure/weapons.ts`, `pure/projectile.ts`, `pure/animation.ts`) mit 30 Vitest-Tests, abschießbare Projektile (Oma-Handtasche), Zivilisten-Strafe, Waffen-Pickups (Shotgun, SMG, Basskanone, Schild), Nachladen per Rechtsklick/Randzone/`R`, Synth-Audio (Web Audio), Screen-Shake, Pause, reduzierte Bewegung, lokale Fonts (`@fontsource/anton`, DSGVO-sauber).
- **Fehlt:** PWA-Manifest, Service Worker, Offline, iOS-Vollbild (iPhone kennt kein `requestFullscreen` für Elemente → nur als installierte PWA im Standalone-Modus), Orientierungshinweis, Kamerafahrt, 2-Spieler, Lightgun-Modus.
- Die PNG-Assets liegen nicht lokal im Ordner, sondern auf `kburna243/mikes-cytube-dist/images/bunkerhain` (laut README).

**Neues Projekt** (`Downloads\my crazy trip to ischia`): bisher nur Frieds eigene Fotos als Referenz – `flughafen neapel` (11 Fotos + 1 Video), `castelleo` (34), `ischia bei nacht` (14), `station` = Stadion (18 + 1 Video), `hafen molo beverello` (leer). Das sind die Vorlagen für die Hintergründe. Noch kein Code.

**Konsequenz:** Kein Weiterflicken von `engine.ts`. Neues, sauberes Projekt; Bunkerhains reine Module, Sheet-Format, Audio und Shell-Ideen werden *kopiert und modularisiert*, nicht der Monolith.

---

## 1. Was wir von den Vorbildern übernehmen

| Vorbild | Merkmal | Übernahme |
|---|---|---|
| **Beast Busters** (SNK 1989) | 3 Spieler gleichzeitig, montierte Uzi + Extraknopf für Granaten/Raketen; 7 Abschnitte, je Sub-Boss + Endboss, **Bosse mit zwei Formen**; Pickups: Raketen, Granaten, Rüstung, Health, Munition; Kamera fährt durch die Stadt, Fahrzeugpassagen | Dauerfeuer-Hauptwaffe + **Sekundärknopf** (Granate = „Glücks-Chili“); Sub-Boss + Endboss pro Level; Bosse mit 2 Phasen; Kamerafahrt mit Stopps; Hummer-Fahrten als Fahrzeug-Level |
| **Zombie Raid** (Sammy 1995) | 2 Spieler, Pump-Shotgun, **Nachladen durch Pumpen / Schuss neben den Bildschirm**; Start mit Pistole, Pickups Shotgun/MG/Feuergewehr; **Treffer oder Zivilisten-Abschuss kostet die Power-up-Waffe**, Zivilisten kosten Leben; 5 Stages mit Boss; Sammelobjekte (3 Kristalle) für das echte Finale | Offscreen-Reload (Lightgun-Standard); Waffe verlieren bei Treffer; Zivilisten-Strafe (gibt es schon); **3 Sammelobjekte für das wahre Ende** (siehe §5: die drei Ampullen des San-Gennaro-Bluts) |

Quellen: [Zombie Raid – Wikipedia](https://en.wikipedia.org/wiki/Zombie_Raid), [GamingHell](https://gaminghell.co.uk/ShortsZombieRaid.html), [Beast Busters – Wikipedia](https://en.wikipedia.org/wiki/Beast_Busters), [Giant Bomb](https://www.giantbomb.com/games/3030-24019/).
Offen: Kamera- und Wellendetails per Longplay-Video nachprüfen (nicht aus der Erinnerung bauen).

---

## 2. Spielkonzept

**Story:** Fried will Urlaub in Italien machen. Evil Mad Mr. Burna hat nicht vergessen, dass Fried ihm letztes Halloween (= Bunkerhain) verdorben hat. Er hat das Blutwunder von **San Gennaro** manipuliert – statt sich zu verflüssigen, verwandelt es Neapel in Zombies. Burna versteckt sich auf Ischia.

**Kernschleife:** Kamera fährt → stoppt an einem „Halt“ → Welle kommt (laufen auf die Kamera zu, werfen Projektile) → Halt geräumt → weiterfahren. Pro Level 3–5 Halte, Sub-Boss in der Mitte, Endboss am Schluss.

**Kernregeln**
- Zielen + Schießen (Maus, Touch, Lightgun = alles Pointer). Sekundärwaffe (Chili-Granate) über zweiten Knopf / Rechtsklick / Touch-Button.
- Nachladen: Schuss außerhalb der Spielfläche (Lightgun), Rechtsklick/`R`, Touch: Wischen nach unten oder Button.
- Gegnerprojektile sind abschießbar (Punkte), treffen sonst nach Ablauf.
- Zivilisten/Touristen: nicht treffen (Herz weg + Sonderwaffe weg).
- Mönch: läuft durchs Bild; Treffer → Drop (Waffe/Goodie). Ihn zu treffen ist erwünscht.
- 1–2 Spieler (2. Spieler = zweites Fadenkreuz, zweite Wiimote/Maus). 3 Spieler wie Beast Busters erst später.

---

## 3. Technik

### 3.1 Projektstruktur (neu, sauber)
```
src/
  core/      loop.ts (fester Timestep), input.ts (Pointer → Spieler), camera.ts, rng.ts
  render/    stage.ts (Layer-Parallax), sprite.ts (Sheets, Pivot), fx.ts (Partikel, Decals, Shake)
  game/      level-runner.ts (Rail-Skript abspielen), wave.ts, mob.ts, boss.ts, pickups.ts, projectiles.ts
  pure/      weapons.ts, projectile.ts, animation.ts  ← aus Bunkerhain übernommen
  data/      levels/*.json (Rail + Halte + Wellen), enemies.json, items.json
  shell/     React: Menü, HUD-Overlay, Einstellungen, Installationshinweis
public/      manifest.webmanifest, icons, assets/
```
Regel: **Level sind Daten, nicht Code.** Ein Level = JSON mit Kamerapfad, Halten, Wellen, Boss. Engine-Code kennt keine Level-Namen.

### 3.2 Fake-3D aus 2D
- **Kamera-Rail:** Kamera hat `z` (Fahrtstrecke) und `x`-Schwenk. Jeder Abschnitt besteht aus 3–5 **Parallax-Ebenen** (Himmel, Fernkulisse, Mittelgrund, Vordergrund-Requisiten). Ebene mit Tiefe `d` bewegt sich um `1/d` – das ergibt die Fahrt.
- **Vorwärtsfahrt:** Ebenen werden beim Fahren um das Fluchtpunktzentrum **hochskaliert** (Zoom-Through), nächster Abschnitt wird darunter eingeblendet. Billig, wirkt wie Beast Busters.
- **Gegner im Raum:** Weltposition (x, z); Bildschirmgröße = `f / (z − kameraZ)`; Sortierung nach z. Ersetzt die heutige Scale-Lerp-Logik, bleibt aber kompatibel mit den Sheets.
- **Fahrzeug-Level (Hummer):** Kamera fährt dauerhaft, Straßenebene als vertikal gescrollte Textur mit Perspektive (Mode-7-light via gestapelte Streifen), Gegner tauchen von vorn/seitlich auf, Motorhaube als Vordergrund-Sprite.
- Canvas2D bleibt (reicht, läuft überall). Kein Three.js nötig.

### 3.3 PWA & Vollbild
- `vite-plugin-pwa` (Workbox): Manifest mit `"display": "fullscreen"`, Fallback `standalone`, `"orientation": "landscape"`, Icons 192/512 + maskable, Precache aller Assets → offline spielbar.
- Android/Chrome: `requestFullscreen()` + `screen.orientation.lock('landscape')` beim ersten Tap auf „Start“.
- iOS: Vollbild **nur** als installierte PWA (Teilen → „Zum Home-Bildschirm“). Eigener Hinweis-Screen bei iOS-Safari im Browser-Tab. `apple-mobile-web-app-capable`, `viewport-fit=cover`, Safe-Area-Ränder fürs HUD.
- Hochformat: Overlay „Bitte drehen“.
- Wake Lock während des Spiels; Pause bei `visibilitychange` (gibt es schon).
- Hosting: statisch auf servermitte via Caddy (wie andere Slugs) – HTTPS ist Pflicht für Service Worker.

### 3.4 Steuerung
| Gerät | Zielen | Schuss | Nachladen | Sekundär |
|---|---|---|---|---|
| Maus | Cursor | links | rechts / `R` | Mittelklick / Leertaste |
| Touch | Tipp-Position (Fadenkreuz springt) | Tipp | Wisch nach unten / Button | Button rechts unten |
| Wiimote/Lightgun (Gunmote, Sinden u. Ä. = Maus) | Cursor | Abzug | **Schuss außerhalb des Bilds** | B-Taste → Rechtsklick |
| 2. Spieler | Pointer-ID / zweite Maus via Raw-Input-Bridge nötig | | | |

Lightgun-Modus in den Einstellungen: Cursor ausblenden, Fadenkreuz optional, Offscreen-Reload an, Kalibrier-Testbild (4 Ecken + Mitte). Bekannte Fallen aus dem Skill `retro-gaming-ops` beachten (Steam Input, DolphinBar-IR).

### 3.5 Regeln aus Frieds Umgebung
- Webfonts nur lokal (`@fontsource/*`), kein Google-CDN.
- Kein Asset von Fremd-CDNs zur Laufzeit.

---

## 4. Level für Level

| # | Level | Typ | Gegner | Sub-Boss | Endboss | Foto-Vorlage |
|---|---|---|---|---|---|---|
| 1 | **Ankunft Neapel** – vom Flugzeug durch die Ankunftshalle | zu Fuß | Flughafenpersonal, Polizia, Zombie-Nonna, Touristen (nicht schießen) | Gepäckband-Chef (Koffer-Projektile) | Zoll-Zombie-Kommandant | `flughafen neapel` |
| 2 | **NATO-Basis** – mit dem coolen Italiener **Tonino** den Hummer klauen | zu Fuß, Ende Einsteigen | Carabinieri, Wachposten, Business-Typen | Wachturm-Scharfschütze | Sergente (Drill-Sergeant-Zombie) | **frei erfunden** – keine echten Fotos von Militäranlagen (siehe §5.4) |
| 3 | **Durch Neapel zum Maradona-Stadion** (komische Signale) | Hummer-Fahrt | Prolls im Trainingsanzug, Vespa-Zombies, Pizzabäcker (Pizzen), Carabinieri | Ape-Dreirad-Kolonne | **„El Diez“ + Ultras** (Parodie, kein echter Name/kein echtes Bild) – Phase 1 schießt Bälle, Phase 2 „göttliche Hand“ | `station` (= Stadion) |
| 4 | **Hafen befreien** (Molo Beverello) | Hummer → zu Fuß | Hafenarbeiter, Fährcrew, Business-Typen | Kranführer | Hafenkapitän-Zombie | `hafen molo beverello` (leer – Fotos nachliefern) |
| 5 | **Fähre nach Ischia** | Schiff, schwankende Kamera | Fährcrew, Nonnas, Touristen | Bordbar-Barista | Seeungeheuer „Polpo“ | Bootsbilder des Fähranbieters als Vorlage (siehe §5.4) |
| 6 | **Ischia Porto → Ischia Ponte** | zu Fuß, Nacht | alle Typen gemischt | Limoncello-Verkäufer | Vespa-Gang-Chef | `ischia bei nacht` |
| 7 | **Pontile → Castello Aragonese** (Brücke) | zu Fuß, langer Steg | Wellen von beiden Seiten | – | Brückenwächter (Ritter-Zombie) | `castelleo` |
| 8 | **Durchs Castello zum Showdown** | zu Fuß, Innenräume | Elite-Mix | Gefängnis-Nonne | **Evil Mad Mr. Burna** (2–3 Phasen; wahres Ende nur mit 3 Ampullen) | `castelleo` |

---

## 5. Kataloge

### 5.1 Gegner
| Gegner | Verhalten | Projektil |
|---|---|---|
| Carabinieri | Deckung, schießt gezielt | Gefälschte Parmesan-Dosen |
| Polizia | rennt zu, Schlagstock nah | Strafzettel-Wirbel |
| Zombie-Nonna | langsam, zäh (3 Treffer) | Lab-Fleischbällchen („Ersatzfleisch“) |
| Business-Typ (gestylt) | schnell, zickzack | „Espresso“ aus Kapselmaschine (US-Style) |
| Proll im Trainingsanzug | in Gruppen, springt | Fake-Designer-Sonnenbrillen |
| Pizzabäcker | wirft im Bogen | Pizza Hawaii / Ananas-Pizza |
| Flughafenpersonal | Gepäckwagen-Rammer | Koffer |
| Fährcrew | auf Deck, Seile | Rettungsringe |
| Touristen (Zivilisten) | nicht schießen | – |

Projektilthemen: amerikanisierte italienische Produkte (Fettuccine Alfredo, Pepperoni-Pizza, Spaghetti mit Ketchup), Labor-Ersatzfleisch, Fälschungen („Parmesao“, „Prosecco“ aus der Dose).

### 5.2 Mönch-Drops
| Item | Wirkung |
|---|---|
| Glücks-Chili (Cornicello-Form) | Granate / Sekundärwaffe |
| Zingara (Ischia-Sandwich) | +1 Herz |
| Melloncello | Dauerfeuer 10 s |
| Limoncello | Schild (1 Treffer) |
| Chinotto | Munition voll + Zeitlupe 3 s |
| Waffen | Shotgun, Maschinenpistole, „Vesuv-Werfer“ (Flamme) |
| Ampulle San Gennaro (3×, versteckt in Lvl 3/5/7) | Schlüssel zum wahren Ende |

### 5.3 Assets (pro Level)
- Hintergrund: 3–5 Parallax-Ebenen × 3–5 Halte, im Bunkerhain-Stil, aus Frieds Fotos abgeleitet.
- Gegner-Sheets: walk / attack / throw / hit / die (Format wie `expansion-frames.json`: rect, bounds, pivot, clips).
- Boss-Sheets je 2 Phasen; Projektil-Sheets (4 Frames Spin); Item-Icons; Mönch-Sheet; Fried + Italiener (Zwischensequenz-Portraits); Hummer-Motorhaube.
- Audio: Synth-Ansatz aus Bunkerhain weiter nutzen, italienische Motive (Tarantella-Takt).

---

### 5.4 Bildvorlagen und Vorsicht
- **NATO-Basis (Level 2):** bewusst **ohne** echte Fotos und ohne Recherche der realen Anlage am Flughafen Capodichino – Militärgelände zu dokumentieren kann Ärger machen. Komplett erfunden: generischer Zaun, Hangar, Wachturm, Schlagbaum, Fahrzeughalle, ein Hummer. Kein echtes Wappen, keine echte Kennung.
- **Stadion (Level 3):** Ordner `station`. Das reale Stadion nur als Silhouette/Stimmung, Name im Spiel verfremden (z. B. „Stadio Diego“), Boss „Maradona“ als Parodie (eigener Look, kein Foto-Abklatsch).
- **Fähre (Level 5):** Die Schnellboote vom Molo Beverello nach Ischia Porto fährt u. a. **Alilauro** (auch SNAV, Caremar; Porta di Massa = Autofähren Caremar/Medmar). Annahme: Fried meint Alilauro, weil Ankunft Ischia Porto = Start von Level 6. Bootsbilder von der Anbieter-Webseite nur als **Referenz** (Form, Decks, Fenster, Reling) in `referenz/faehre/` ablegen, nicht ins Spiel kopieren und **nicht ins Repo/Deploy**. Im Spiel eigene Lackierung und Fantasiename (z. B. „Aliscafo Burna“), kein echtes Logo.
- Grundsatz: Fotos sind Vorlage für die Bunkerhain-Stil-Neuzeichnung, nie selbst Spielgrafik (Urheberrecht, Markenrecht, Personen im Bild).

Quellen Fähre: [TraghettiUp](https://www.traghettiup.com/blog/en/where-should-you-take-the-ferry-to-ischia), [ClickFerry Napoli Beverello](https://www.clickferry.com/en/port/Naples-Beverello), [Italy Review](https://www.italyreview.com/naples-to-ischia-ferry-times.html)

## 6. Meilensteine

### M1 – Spielbares Level 1, Abschnitt „Ankunftshalle“ (das ist der erste Schritt)
**Ziel:** Ein Durchlauf von 2–3 Minuten auf Handy und PC, installierbar, mit echtem Vollbild.
1. Neues Vite+React+TS-Projekt in diesem Ordner (`game/`), `pure/*` + Tests aus Bunkerhain kopieren, Tests grün.
2. `core/loop`, `core/input` (Pointer, Offscreen-Reload), `render/stage` mit 3 Parallax-Ebenen und Kamera-Rail aus JSON.
3. Ein Level-JSON: 3 Halte (Gate → Gepäckband → Ausgang), je 1 Welle, dazwischen Kamerafahrt.
4. 2 Gegnertypen (Flughafenpersonal, Zombie-Nonna mit Fleischbällchen) + Touristen; abschießbare Projektile.
5. Mönch mit 2 Drops (Zingara, Chili-Granate), Pistole + Shotgun.
6. Sub-Boss light (Gepäckband-Chef, 1 Phase).
7. PWA: Manifest, Service Worker, Icons, iOS-Hinweis, Landscape-Overlay, Fullscreen/Orientation-Lock auf Android.
8. **Platzhalter-Grafik erlaubt** (vorhandene Bunkerhain-Sheets umgefärbt), echte Art kommt in M2.

**Fertig, wenn:** `npm run check` grün · auf Android installiert und im Vollbild durchgespielt · auf iPhone als Home-Bildschirm-App ohne Browserleiste · mit Wiimote/Gunmote am PC durchgespielt inkl. Offscreen-Reload · ein Mensch hat den Durchlauf bestätigt (nicht nur Tests).

### M2 – Look
Art-Pipeline: Fotos → Bunkerhain-Stil-Ebenen; Gegner-Sheets für Level 1–2; HUD im Bunkerhain-Design.

### M3 – Level 1 + 2 komplett
Beide Bosse mit 2 Phasen, Story-Zwischenbild (Italiener), Highscore lokal.

### M4 – Fahrzeug-Technik
Hummer-Fahrt, Level 3 inkl. Maradona-Boss.

### M5 – Level 4–5
Hafen, Fähre (schwankende Kamera).

### M6 – Level 6–8
Ischia, Castello, Burna-Showdown, Ampullen + wahres Ende.

### M7 – 2 Spieler + Feinschliff
Zwei Fadenkreuze, Lightgun-Kalibrierung, Balancing, Deploy auf servermitte.

---

## 6a. Asset-Stand (19.10.2026)

Generiert mit Alibaba Bailian (`bl`, wan2.7-image / wan3.0-video), Stilvorlage = Bunkerhain-Grafik, Werkzeuge und Skripte in `_gen/`. Veröffentlicht unter `kburna243/mikes-cytube-dist/images/ischia/` (manifest.json, ARENA-PROMPT.md, START-HERE.md).

- Level 1–8: Hintergründe (Level 1: 5, Level 2–8: je 3–4), Gegner-, Zivilisten-, Fahrzeug- und Boss-Sprite-Bögen mit Alpha und vermessenen Frames, Projektile, Items, Waffen, Hummer-Motorhaube.
- Titelbild, Charakterbögen (Fried, Mr. Burna, Fraticello, Tonino).
- Intro „Prologo“ als Video (9 Einstellungen + Titelkarte, englische Dialoge aus der Modell-Tonspur).
- **Videos ja, aber nur für Zwischensequenzen.** Spielgrafik bleibt Sprite-basiert (Trefferflächen, Leistung auf dem Handy).
- Sprachsynthese/Spracherkennung/Omni sind im Bailian-Token-Plan nicht freigeschaltet; Dialoge kommen deshalb aus der Tonspur von wan3.0-video, geprüft mit lokalem faster-whisper.

## 7. Offene Punkte
- `hafen molo beverello` ist leer → Fotos für Level 4 nachliefern.
- Fähranbieter bestätigen (Annahme: Alilauro) und Referenzbilder ablegen (siehe §5.4).
- Zwischensequenzen Level 1→2 … 8→Ende (Tonino-Begegnung, Stadion-Signale, Finale) noch nicht produziert; Muster wie Intro.
- 9:16-Schnitt des Intros für Reels/TikTok und italienische Fassung (Stimmen) für den Viral-Test.
- Echte Ähnlichkeit von Fried im Spiel: braucht ein Foto von ihm als Vorlage.
- Mönch erinnert an Padre Pio – für Italien bewusst entscheiden (Charme vs. Ärger).
- Bunkerhain-PNGs von GitHub holen, falls sie als Platzhalter in M1 dienen sollen.
- Figuren echter Personen (Maradona) als Parodie anlegen, Namen/Look verfremden.
