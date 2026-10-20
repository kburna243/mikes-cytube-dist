# ARENA-PROMPT – MY CRAZY TRIP TO ISCHIA (Galerie-Fassung)

Kopiere alles ab der Linie in Arena.

---

Du baust das Browser-Spiel **MY CRAZY TRIP TO ISCHIA – Napoli Zombie Apocalypse**, den Nachfolger meines Railshooters BUNKERHAIN. Es ist eine **Shooting Gallery auf Schienen** im Stil von Beast Busters, Operation Wolf, Lethal Enforcers und Zombie Raid: Fried **fährt bzw. geht automatisch** durch jede Szene, die Kamera hält an Schießständen, Gegner springen aus Deckungen, Kulissen ziehen in mehreren Tiefen vorbei. Der Spieler zielt, schießt und lädt nach. Kein freies Laufen.

Die **komplette Grafik für alle 8 Level** ist fertig und liegt als Binärdateien auf GitHub. Deine Aufgabe ist das Spiel. **Grafik nicht neu zeichnen, nicht durch SVG/Emoji/Platzhalter ersetzen.**

## Zuerst lesen (Raw-Links funktionieren direkt)

- Asset-Manifest (jede Datei mit Download-Link, Level, Art, Maße, SHA-256 und **pro Bildzelle gemessene Motivgrenze `bounds` und Fußpunkt `pivot`**): https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia-v2/manifest.json
- Asset-Beschreibungen pro Level (welche Datei wofür, Raster, Hinweise): `docs/assets-level-1.md` … `docs/assets-level-8.md`, `docs/assets-gemeinsam.md` im Ordner https://github.com/kburna243/mikes-cytube-dist/tree/main/images/ischia-v2/docs
- Spielplan, Story, Level-Abfolge, Items: https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia-v2/PLAN.md
- Tricks und Inhalte pro Level: https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia-v2/LEVEL-TRICKS.md
- Vorgänger BUNKERHAIN als Vorbild für Spielgefühl, Treffer-Feedback, Synth-Audio und Ladefehler-Handling: https://github.com/kburna243/mikes-cytube-dist/tree/main/images/bunkerhain/current-shooter

**Auftrag jetzt: Meilenstein 1 = Level 1 „Ankunft Neapel“ richtig gut spielbar, mit Intro, als installierbare PWA.** Erst wenn Level 1 überzeugt, Level 2–8 nacheinander – der Asset-Lader und die Level-Daten müssen von Anfang an für alle 8 Level ausgelegt sein.

## Technik (verbindlich)

- Vite + React + TypeScript für Menü/HUD, **eigene Canvas2D-Engine** für das Spiel (kein Phaser/Pixi/Three). Logische Auflösung 1672×941 (16:9), Letterbox. **Relative Pfade** (`base: "./"`), das Spiel wird unter einem Unterpfad ausgeliefert.
- Alle Dateien aus dem Manifest als echte Binärdateien nach `localPath` laden (Skript `npm run assets`, SHA-256 prüfen) und beim Build lokal mitliefern. Keine GitHub-Abhängigkeit zur Laufzeit, keine CDNs, Webfonts nur lokal (`@fontsource`).
- **Level sind Daten:** `src/data/levels/level1.json` … `level8.json` (Schiene, Szenen, Ebenen mit Tiefe, Kulissen-Spuren, Deckungen, Wellen, Boss, Zwischenkarte). Die Engine kennt keine Level-Namen.
- **Sprites:** Raster `grid` und Zellen `cells` aus dem Manifest. Viele Posen ragen über die Zellgrenze (`touchesCellEdge`) → mit `bounds` ausschneiden, an `pivot` (Fußpunkt) ausrichten, **ein Maßstab pro Figur** über alle Posen. Rendering und Trefferzone nutzen dieselbe Transformation.
- Kleine Module (< ~400 Zeilen), reine Logik getrennt, Vitest-Tests, `npm run check` = Tests + `tsc --noEmit` + Build.

## Fake-3D-Tricks (alle umsetzen; pro Level welche siehe LEVEL-TRICKS.md)

1. **Ebenen-Parallax:** `background` hinten, transparente Mittel-/Vordergrundebenen (`…-mittel`, `…-vorne`) mit eigener Tiefe.
2. **Korridorfahrt:** Kulissenstücke (Glaswände, Deckenlampen, Laternen, Container, Felsringe …) laufen aus dem Fluchtpunkt (Bildmitte, ~45 % Höhe) auf die Kamera zu, skaliert mit 1/z, links/rechts versetzt, verschwinden am Rand.
3. **Zoom-Through** zwischen Szenen: in den Fluchtpunkt zoomen, nächste Szene aufblenden.
4. **Deckung & Pop-up:** Gegner lehnen mit den Posen „lehnt links/rechts heraus“ hinter Deckungen (`…-deckung`) hervor, greifen an, ducken weg.
5. **Tiefen-Spuren** fern/mittel/nah, nach z sortiert.
6. **Sprung auf die Kamera:** `…-sprung` wächst bildfüllend heran – rechtzeitig treffen oder Schaden.
7. **Wurfgeschosse** (`gemeinsam/wurfobjekte-…`) fliegen im Bogen auf die Kamera, sind abschießbar, schaden genau einmal.
8. **Zerstörbare Kulisse** (heil/kaputt-Paare, z. B. `l1c-zerbrechlich`) mit Bonus.
9. **Treffer-Gefühl:** `fx-bogen` (Mündungsfeuer, Funken, Konfetti, Schleim auf der Linse, Einschussloch im Vordergrund), Screenshake, Hit-Pause.
10. **Fahrzeug-Level 3:** `l3-strasse` als Pseudo-Mode-7-Boden (Kachelnaht prüfen), `l3-motorhaube` als wackelndes Overlay, Straßenrand-Kulissen rauschen vorbei, Vespa/Ape von vorn in 3 Größen + Crash.
11. **Bosse aus Teilen** (`boss-…-koerper/-arm/-kopf`, Polpo-Tentakel, Burna-Maschine): Teile einzeln animiert (Arm schwingt, Kopf wechselt Schadensstufe), Trefferzonen pro Teil, Phase 2.
12. **Licht-/Effektebenen:** Suchscheinwerfer (L2), schwankende Kamera + Gischt + Wellen (L5), Laternenlicht (L6), wachsende Burg (L7), Fackellicht + grüner Wirbel (L8).

## Level 1 – Ankunft Neapel (Meilenstein 1)

Szenen in dieser Reihenfolge (Dateien im Manifest, `level: "L1"`): **Fluggastbrücke** (`l1a-…`: Korridorfahrt mit Glaswänden und Deckenlampen, Kofferdeckung) → **Grenzkontrolle** (`l1b-…`: Mittel- und Vordergrundebene, Schalter-Deckung) → **Gepäckband** (`l1c-…`: zerbrechliche Objekte, Sub-Boss) → **Vorplatz** (`l1d-…`: Taxis als Deckung, Boss **Zoll-Kommandant** aus `boss-zoll-koerper/-arm/-kopf`, Kopf in 4 Schadensstufen). Gegner: `flughafen-zombie`, `nonna-zombie`, `polizia-zombie`; Zivilisten `tourist`, `touristin` (nicht treffen!); Helfer `fraticello`. Flugzeug, Treppe, Gepäckwagen und Terminalfront aus `l1-korrektur/props-burna-air` als Kulissenteile für den Einstieg (Kabine → Tür → Treppe → Vorfeld). Fiktive Airline „Burna Air“ – keine echten Marken.

## Spielregeln

Pistole 6 Schuss. Nachladen: Rechtsklick, R, Touch-Knopf **und Schuss neben die Spielfläche** (Lightgun-Standard). Sekundärwaffe **Glücks-Chili** = Granate (Mitteltaste/Leertaste/Touch). Fraticello läuft durchs Bild, Treffer = Drop: Zingara +1 Herz (max 5), Melloncello 10 s Dauerfeuer, Limoncello Schild, Chinotto Munition voll + 3 s Zeitlupe, Waffen (Shotgun 8, MP 36 mit 3er-Salve, Vesuv-Werfer 20). Touristen treffen: −1 Herz und Sonderwaffe weg; getroffen werden: Sonderwaffe weg. Start 3 Herzen. Drei Ampullen (L3, L5, L8) für das wahre Ende. Lightgun-Modus in den Einstellungen (Mauszeiger aus, Fadenkreuz optional, Kalibrier-Testbild).

## Zwischensequenzen

- **Intro** `cutscenes/intro-prologo-720p.mp4` (Handy) bzw. `intro-prologo.mp4` (Desktop) vor dem ersten Start, Poster `intro-prologo-poster.jpg`, Überspringen per Tipp/Klick/Esc, Ton erst nach Nutzeraktion.
- **Zwischen den Leveln:** die `kind: "story"`-Bilder (`…-zwischenbild-…`, `l8-ende`) als Story-Karten mit langsamem Zoom und Untertiteln (Dialoge in LEVEL-TRICKS.md). Datenformat so, dass jede Karte später durch ein MP4 ersetzt werden kann (`"video": null` → Bild, sonst Video).

## Titel, Cover

Cover-Bilder (`kind: "cover"`) nur als Hintergrund; der Titel kommt als **`logo-ischia.svg`** darüber (im Coverbild selbst liest sich der Schriftzug wie „1SCHIA“).

## PWA, Handy, HUD

- `vite-plugin-pwa`: `display: fullscreen`, Querformat, Icons aus dem Cover, Precache (das 18-MB-1080p-Intro ausnehmen), offline spielbar. Overlay „Bitte drehen“ im Hochformat. Wake Lock, Pause bei `visibilitychange`.
- **iPhone:** Vollbild nur als Homescreen-App. `navigator.standalone` bzw. `display-mode: fullscreen|standalone` erkennen → dann **keinen** Vollbild-Fehler zeigen. In Safari stattdessen kurzer Tipp „Teilen → Zum Home-Bildschirm“, nach ~6 s ausblenden.
- **HUD darf keine Ziele verdecken:** Auf 844×390 deckt eine obere Knopfleiste ~14 % der Höhe ab. Spawn-, Flug- und Sprungbahnen unterhalb halten, mit Test absichern.

## Prüfung – so, dass sie nicht hängen bleibt

- Automatische Browserprüfung **kurz halten**: Seite laden, Level 1 per Test-Einstieg (`?level=1&skipIntro=1`) starten, je Szene ein Screenshot, Konsole ohne Fehler. **Keine endlosen Klick-Durchläufe.** Wenn das Werkzeug zweimal hängt: abbrechen, ehrlich melden, mit Unit-Tests und Build weitermachen.
- Debug-Schalter `?debug=1` zeigt Trefferzonen, Fußpunkte und Szenen-Nummer.

## Lieferung

Spielbares Level 1 mit allen Level-1-Tricks, Intro, PWA; echte Ausgabe von `npm run check`; Screenshots je Szene (Desktop und 844×390); Liste der verwendeten Assets und bekannten Grenzen. Nichts behaupten, was nicht geprüft ist. Danach Level 2–8 in der Reihenfolge aus PLAN.md, je Level ein eigener Durchgang.
