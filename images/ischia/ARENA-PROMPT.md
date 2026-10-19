# ARENA-PROMPT – MY CRAZY TRIP TO ISCHIA · Meilenstein 1

Kopiere alles ab hier in Arena.

---

Du baust ein neues Browser-Spiel: **MY CRAZY TRIP TO ISCHIA – Napoli Zombie Apocalypse**, den Nachfolger des Railshooters BUNKERHAIN. Es ist ein **Lightgun-/Railshooter im Stil von Beast Busters (SNK 1989) und Zombie Raid (Sammy 1995)**: Die Kamera fährt automatisch durch die Szenen und hält an Kampfstationen; der Spieler zielt, schießt und lädt nach. Keine frei laufende Spielfigur, kein Plattformer, kein Dialog-Adventure.

Du bist eventuell ein neues Modell ohne Vorgeschichte. Lies zuerst diese Dateien im Paketordner (Raw-Links funktionieren direkt):

- START-HERE: https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia/START-HERE.md
- Spielplan (Konzept, alle 8 Level, Kataloge, Meilensteine): https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia/PLAN.md
- Asset-Manifest mit direkten Download-Links, Maßen, Frame-Rechtecken und Pivots: https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia/manifest.json
- Intro-Storyboard: https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia/STORYBOARD-INTRO.md

**Dein Auftrag ist ausschließlich Meilenstein 1 aus PLAN.md §6: Level 1 „Ankunft Neapel“ spielbar, als installierbare PWA mit echtem Vollbild.** Level 2–8 nicht anfangen.

Das Manifest enthält bereits die Grafik für **alle 8 Level** (Hintergründe mit `label` „L2 …“ bis „L8 …“, weitere Gegner, Fahrzeuge, Bosse). Für M1 nur die Level-1-Hintergründe (`l1-*`) und die Bögen laden, die Level 1 braucht (staff-zombie, nonna-zombie, polizia-zombie, tourist-woman, tourist-man, monk, baggage-boss, customs-boss, projectiles, items, weapons). Den Asset-Lader aber so bauen, dass er pro Level die Liste aus `level<N>.json` lädt – dann sind Level 2–8 später nur Daten.

## Technische Basis (verbindlich)

- Neues Projekt: Vite + React 19 + TypeScript + Tailwind 4 für Menü/HUD, **eigene Canvas2D-Engine** für das Spiel (kein Phaser, kein Pixi, kein Three.js). Logische Auflösung 1672×941 (16:9), Letterbox-Skalierung, Pointer-Events → Weltkoordinaten.
- Saubere Struktur statt Monolith (siehe PLAN.md §3.1): `src/core` (loop mit festem Zeitschritt, input, camera), `src/render` (stage, sprite, fx), `src/game` (level-runner, wave, mob, boss, pickups, projectiles), `src/pure` (reine, getestete Logik), `src/data/levels/level1.json`, `src/shell` (React). **Level sind Daten, nicht Code.** Keine Datei über ~400 Zeilen.
- Aus BUNKERHAIN übernehmen und anpassen (nicht blind kopieren), weil getestet: `src/game/pure/weapons.ts`, `projectile.ts`, `animation.ts` und die dazugehörigen Vitest-Tests:
  https://github.com/kburna243/mikes-cytube-dist/tree/main/images/bunkerhain/current-shooter
  Dort auch ansehen, wie Spritesheets mit `rect`/`bounds`/`pivot` gezeichnet werden, wie Web-Audio-Sounds synthetisiert werden und wie Ladefehler sichtbar gemacht werden. Das Gefühl dieses Shooters (Treffer-Feedback, Screen-Shake, Konfetti statt Blut, Sprechblasen) ist der Maßstab.
- Scripts: `dev`, `build`, `test`, `check` (= Tests + `tsc --noEmit` + Build).

## Assets

- Alle Dateien aus `manifest.json` als **echte Binärdateien** nach `public/assets/<localPath>` herunterladen (nicht die GitHub-HTML-Seite). Beim Build lokal mitliefern, zur Laufzeit keine GitHub-Abhängigkeit.
- Gelieferte Grafik ist verbindlich: nicht neu zeichnen, nicht durch SVG/Emoji ersetzen. Alpha-Transparenz der Sprite-Bögen ist bereits vorhanden – nicht erneut freistellen.
- Sprite-Bögen sind statische Mehrposen-Bilder. Animation = zeitbasierter Framewechsel im Code (deltaTime). Pro Figur **ein** Quellpixel-zu-Welt-Maßstab über alle Posen, Zeichnen relativ zum `pivot` (Fußpunkt) – Posen dürfen nicht springen oder pulsieren. Rendering und Hitbox nutzen dieselbe Transformation.
- `notes` im Manifest beachten (z. B. Nonna: Fleischbällchen ist nur in `idle` sichtbar, das Geschoss erscheint erst bei `release` als separates Projektil).
- Fehlt eine Datei: sichtbares graues Kästchen mit Dateinamen + Fehlermeldung mit Retry, nie endloser Ladebalken.
- Webfonts nur lokal (`@fontsource/*`), **kein Google-CDN, keine Fremd-CDNs** (DSGVO).

## Fake-3D (PLAN.md §3.2)

- Kamera hat Fahrstrecke `z` und Schwenk `x`. Zwischen den Stationen fährt sie: aktueller Hintergrund wird zum Fluchtpunkt hin hochskaliert (Zoom-Through, leichte Kopfbewegung), der nächste Hintergrund blendet ein. Stationen = die 5 Level-1-Hintergründe.
- Gegner haben Weltposition (x, z); Bildschirmgröße ∝ 1/(z − kameraZ), nach z sortiert zeichnen. Sie kommen aus der Tiefe auf die Kamera zu, Werfer bleiben stehen und werfen.
- Gegnerprojektile fliegen im Bogen auf den Spieler zu, wachsen mit der Nähe, sind **abschießbar** (Punkte) und verursachen genau einmal Schaden, wenn sie ankommen.

## Level 1 – Ankunft Neapel (level1.json)

| Station | Hintergrund | Inhalt |
|---|---|---|
| 1 | l1-01-jetbridge | Tutorial-Welle: 3–4 Flughafenpersonal-Zombies, der Mönch läuft einmal durchs Bild |
| 2 | l1-02-passport | Polizia-Zombies + erste Nonna (wirft Labor-Fleischbällchen), Touristen kreuzen (nicht schießen!) |
| 3 | l1-03-baggage | **Sub-Boss Gepäck-Koloss**: wirft Koffer (abschießbar), eigene Lebensleiste, Verwundbarkeitsfenster nach dem Wurf |
| 4 | l1-04-exit | gemischte Welle, Mönch droppt Shotgun |
| 5 | l1-05-forecourt | **Boss Zoll-Kommandant** in 2 Phasen (Phase 2 ab 50 % HP: mutiert, schneller, Stempel-Schockwelle zum Abschießen) |

Danach Levelabschluss mit Punkten, Treffsicherheit, gefundenen Ampullen und „WEITER NACH NAPOLI“ (Platzhalter für Level 2).

## Regeln (zentral konfigurierbar, mit Vitest abgedeckt)

- Pistole 6 Schuss. Nachladen: Rechtsklick, Taste R, Touch-Button **und Schuss außerhalb der Spielfläche** (Lightgun-Standard, Randzone innerhalb des Canvas).
- Sekundärwaffe **Glücks-Chili** = Granate mit Flächenschaden: mittlere Maustaste / Leertaste / Touch-Button.
- Mönch läuft durchs Bild; Treffer = Drop (aus `items`/`weapons`). Drops werden per Schuss eingesammelt.
- Items: Zingara +1 Herz (max 5), Melloncello 10 s Dauerfeuer, Limoncello Schild (1 Treffer), Chinotto Munition voll + 3 s Zeitlupe, Glücks-Chili +1 Granate, Ampulle = Sammelobjekt (3 pro Spiel, wahres Ende später).
- Waffen: Shotgun (8 Schuss, Streukegel 5 Pellets), MP (36 Schuss, 3er-Salve pro Klick – Lightgun-Spieler muss nichts halten), Vesuv-Werfer (kurzer Flammenkegel, 20 Ladungen). Temporäre Waffe fällt bei 0 auf die Pistole zurück.
- **Zombie-Raid-Regel:** Wird der Spieler getroffen, verliert er die Sonderwaffe. Touristen treffen kostet 1 Herz und die Sonderwaffe.
- Start 3 Herzen. Game Over → Weiter (Punkte halbiert) oder Neustart.

## PWA und Vollbild (PLAN.md §3.3) – gehört zur Abnahme

- `vite-plugin-pwa`: Manifest (`display: fullscreen`, Fallback `standalone`, `orientation: landscape`, Icons 192/512 + maskable aus dem Titelbild), Service Worker mit Precache aller Assets → offline spielbar.
- Android/Chrome: beim Tap auf „Start“ `requestFullscreen()` + `screen.orientation.lock('landscape')` (Fehler still abfangen).
- iOS Safari kann Elemente nicht ins Vollbild schalten: Hinweis-Screen „Teilen → Zum Home-Bildschirm“, `apple-mobile-web-app-capable`, `viewport-fit=cover`, Safe-Area-Ränder fürs HUD.
- Hochformat: Overlay „Bitte Gerät drehen“. Wake Lock während des Spiels, Pause bei `visibilitychange`.
- **Lightgun-Modus** in den Einstellungen: Mauszeiger aus, Fadenkreuz optional, Offscreen-Reload an, Kalibrier-Testbild (4 Ecken + Mitte). Steuerung über Maus-Emulation (Wiimote/Gunmote, Sinden).

## Intro-Video

`cutscenes/intro-prologo-720p.mp4` (Handy, im Offline-Cache) bzw. `intro-prologo.mp4` (1080p, Desktop) vor dem ersten Start abspielen, Poster `intro-prologo-poster.jpg`: Vollbild-`<video>` mit Überspringen-Button (Tap/Klick/Esc), Ton erst nach Nutzeraktion. Danach Titelbild → Spiel. Über das Menü erneut abspielbar.

## Qualität

- 60 fps anstreben; im Renderloop keine Bilddownloads und keine React-State-Updates pro Gegner.
- Pause friert alles ein (Timer in Spielzeit, nicht `setTimeout`). Neustart setzt alles zurück, keine verwaisten Listener/Audios.
- Strobo standardmäßig aus, reduzierte Bewegung anbieten.
- Tests mindestens für: Animationsphase unabhängig von Framezeit, Pause, Herz-Cap, Waffen-Rückfall, Waffenverlust bei Treffer, Touristen-Strafe, Projektil schadet höchstens einmal, abgeschossenes Projektil schadet nie, Boss-Phasenwechsel bei 50 %, Neustart-Reset.

## Abnahme und Lieferung

1. `npm run check` grün – echte Ausgabe zeigen.
2. Browserdurchlauf Level 1 von Station 1 bis Boss-Sieg, mit Screenshots je Station.
3. PWA-Installierbarkeit (Lighthouse/DevTools „Installable“) und Offline-Start geprüft.
4. Fehlende Datei absichtlich simuliert → sichtbarer Fehler mit Retry.
5. Liste: verwendete Assets mit Frame-/Clip-Zuordnung, Platzhalter, bekannte Einschränkungen.

Nicht behaupten, was nicht geprüft ist. Wenn derselbe Schritt nach zwei Versuchen blockiert: stoppen und konkret melden.
