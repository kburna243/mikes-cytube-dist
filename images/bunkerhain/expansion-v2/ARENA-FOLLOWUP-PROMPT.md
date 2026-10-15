# ARENA-FOLGEPROMPT – SHOOTER erweitern, nicht das Laufspiel

## VERBINDLICHE AUSGANGSBASIS

Wir wollen ausdrücklich die SHOOTER-VERSION von BUNKERHAIN – Zombie Rave Apocalypse, also Version (3). NICHT die Lauf-/Dialogspiel-Version (2). Kein Spieler-Laufen mit A/D, kein Dialog-Adventure, kein Plattformspiel. Die Kamera/Inszenierung führt automatisch durch die Szenen; der Spieler zielt, schießt und lädt nach. Das funktionierende Shooter-Spielgefühl ist bereits sehr gut und soll erhalten bleiben.

Du bist eventuell ein neues Modell ohne Vorgeschichte. Lies zuerst START-HERE.md und ARCHITECTURE.md dieses Pakets. Im Ordner shooter-baseline/ liegt der funktionsfähige, reparierte Shooter als Source-Snapshot. Vergleiche dein aktuelles Projekt damit. Wenn bei dir die Laufspiel-Version oder ein leeres React-Template liegt, verwende den Shooter-Snapshot als Basis. Bestehende Quellen erweitern, keinen Shooter neu erfinden. Falls dein aktuelles Projekt bereits weiter ist, Unterschiede kurz prüfen und brauchbare Änderungen erhalten.

Wichtig: Die echte Baseline ist React + TypeScript + Canvas2D unter Vite. Sie nutzt weder Phaser noch Pixi. Jetzt keinen Engine-Wechsel vornehmen. Die Architektur-Doku trennt implementierten IST-Stand und gewünschte Erweiterung. Nicht behaupten, dass bisherige Lücken bereits funktionieren.

## GITHUB-DATEIEN STATT CHAT-ANHÄNGE ODER ZIP

Paketordner:
https://github.com/kburna243/mikes-cytube-dist/tree/main/images/bunkerhain/expansion-v2

Neue Bilder mit direkten PNG-Downloadlinks und Frame-Hinweisen:
https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/bunkerhain/expansion-v2/manifest.json

Originalbilder für Level 1:
https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/bunkerhain/manifest.json

Source-Snapshot und Architektur lassen sich über den Paketordner oder die GitHub-Contents-API einzeln lesen/herunterladen. Keine ZIP-Annahme. Auch der Snapshot-Dateibaum steht in START-HERE.md bzw. handoff-files.json.

Lade die tatsächlichen Bilddateien als Binärdateien herunter. HTML-Vorschauseiten sind keine PNGs. Originalbilder entsprechend dem alten Manifest nach public/assets/<kategorie>/ speichern. Neue Bilder entsprechend localPath im neuen Manifest ablegen. Die PNGs beim Build lokal mitliefern, keine GitHub-Abhängigkeit während des Spielens. Dass Bilder im Chat sichtbar sind, heißt nicht, dass sie als Dateien im Projekt liegen.

Alle gelieferten Bilder sind verbindliche Grafik. NICHT neu zeichnen, verbessern, durch SVGs/Emoji oder andere Figuren ersetzen. Vorhandene Alpha-Transparenz erhalten, keine automatische Freistellung auf bereits transparenten PNGs. Es gibt keine tatsächlichen animierten PNGs: Die neuen PNGs sind Sprite-Bögen mit mehreren Posen. Du implementierst die zeitliche Frameanimation im Code.

Fehlendes Asset klar melden und als graues Kästchen mit Namen kennzeichnen. Keine versteckten erfundenen Ersatzgrafiken. Bei nicht erreichbaren Downloadlinks den konkreten Fehler nennen.

## 1. ECHTE GESTEN FÜR ZOMBIES UND LEBENDE GÄSTE

Neue 2×2-Sprite-Bögen, Lesereihenfolge oben links, oben rechts, unten links, unten rechts:
- zombie-mesh-gestures: idle, step-reach, attack, hit.
- zombie-tracksuit-gestures: idle, step-reach, attack, hit.
- zombie-punk-gestures: idle, step-reach, attack, hit.
- zombie-dj-gestures: idle, rave, attack, hit.
- civilian-yellow-gestures und civilian-turquoise-gestures: idle, warning, duck, escape.

Verwende die tatsächlichen Frame-Rechtecke/Prüfhinweise aus dem Manifest. Raster und Pose-Reihenfolge sind Ausgangsdaten; vor Einbau jede Zelle visuell prüfen. Kein blindes Ausschneiden abgeschnittener Figuren. Die gemessenen Frame-Rechtecke sind verbindlicher als die schematische Rasterangabe: Einige Zellen sind unterschiedlich groß, weil die echten transparenten Zwischenräume nicht exakt in der Bildmitte liegen. Verwende pro Figur denselben Quellpixel-zu-Welt-Skalierungsfaktor über alle Frames; zeichne rect.w/rect.h mit diesem Faktor und versetze um den Frame-Anker. Nicht jedes Frame-Rechteck auf dieselbe Höhe strecken. Pro Frame gemeinsamer Anker/Fußpunkt, damit unterschiedliche Posen nicht springen oder pulsierend die Größe wechseln. Transparente Ränder nicht mit Hitboxen verwechseln. Rendering und Treffergeometrie müssen dieselbe Transformation verwenden.

Animationen zeitbasiert mit deltaTime, nicht ein Frame pro Render. Zombie-Annäherung zwischen idle und step/rave etwa 5–7 fps bzw. als kurze Gesten, attack gezielt vor Treffer, hit kurz bei Treffern. Nicht den Trefferframe ununterbrochen loopen. Figuren dürfen ergänzend wackeln/Squash haben, das ersetzt keine Frameanimation. Bei normalen Zombies mit einem Treffer Hitpose vor Konfetti-Tod kurz sichtbar halten; keine zusätzlichen Punkte für bereits sterbende Gegner.

Lebende Gäste bleiben Zivilisten mit gesunder Haut, keine Ziele: warnendes Winken, Ducken und Flucht beim Vorbeilaufen. Winken z.B. idle/warning pingpong, duck/escape gezielte Zustände. Keine Angriffsanimation für Zivilisten. Alle vier Zombies und beide Gäste in Level 1 animieren, vorhandenen Türsteher-Boss und seine zwei Originalposen erhalten.

Erweitere die vorhandene zentrale Registry src/game/assets.ts und die Frame-Metadaten passend. Benenne nicht ohne Grund das ganze Projekt um. Eine zusätzliche src/assets.ts darf re-exportieren, soll keine zweite Pfad-Wahrheit schaffen. Neue Sprite-Clip-Metadaten: Bild, Frame-Rechtecke, Dauer, Loop, Anker und Trefferzonen. Kein Asset-Laden im Renderloop.

## 2. NEUER FLUGGEGNER – TECHNO-ZOMBIEFLEDERMAUS

techno-bat-flight.png: vier Flügelschlagphasen auf 2×2-Bogen. Kleiner grüner untoter Rave-Flattermann mit pinken Kopfhörern. Loop etwa 8–10 fps; Flugbewegung separat von Flügelschlag.

Führe ihn spät in Level 1 vorsichtig ein und nutze ihn stärker in Level 2. Seitlicher/Bogenflug, kurzer erkennbarer Sturzflug-Telegraph, dann Angriff; kein unvorhersehbarer Sofortschaden. Gute Trefferfläche trotz kleiner Optik. Er muss in Wellenfortschritt, Aufräumen, Trefferreihenfolge und Neustart korrekt zählen; kein Wellen-Softlock, wenn nur Fluggegner übrig sind.

## 3. POWER-UPS UND ANDERE WAFFEN

powerups-weapons-atlas.png: sechs Icons, 3 Spalten × 2 Zeilen: health, ammo, shotgun, smg, bass-cannon, shield. Es sind Pickup-/HUD-Symbole, keine First-Person-Waffenansichten. Keine neue Waffenhand-Grafik erfinden; vorhandene Fadenkreuz-/Mündungsblitz-Inszenierung genügt.

Power-ups sind klar anders als Gegner und durch einen gezielten Schuss sammelbar. In einer Szene nie hinter einem Zivilisten automatisch durchschießen. Gezielt platzierte Drops statt Beute-Spam. Beginn mit wenigen garantierten Health-/Waffendrops in handgebauten Wellen; optional zusätzliche sparsame Drops.

Konkrete Regeln, zentral konfigurierbar:
- Standardpistole bleibt die bewährte Waffe mit 6 Schuss, R/Reloadbutton/rechter Maustaste zum Nachladen.
- Health: +1 Herz, Cap MAX_HEARTS=5; Startwert zunächst 3 wie Baseline, HUD muss 5 mögliche Herzen korrekt darstellen. Am Cap keine Überheilung.
- Ammo: füllt das aktuelle Magazin; bei temporärer Waffe ergänzt es deren begrenzten Vorrat bis zu ihrem Cap. Kein unbegrenzter Vorrat.
- Shotgun: 8 Schüsse, pro Auslösung ein kurzer Streukegel mit 5 logischen Pellets; einzelne Ziele pro Auslösung höchstens einmal punkten. Zivilisten im Kegel können getroffen werden und werden mit denselben klaren Gastregeln behandelt. Kein globaler Bildschirm-Kill.
- SMG: 36 Patronen, pro Klick ein kurzer Dreiersalven-Burst mit Schussabstand. Der Lightgun-Spieler muss keine Taste halten. Jede reale Kugel kostet Munition; Burst stoppt bei Pause, Tod oder Waffenwechsel. Getroffene/tote Figuren nicht mehrfach werten.
- Basskanone: 3 langsame, deutlich angekündigte Schallpulse, die in einer begrenzten Zielregion wirken und Handtaschenprojektile zerlegen. Lässt Zivilisten unversehrt; diesen Unterschied im HUD kurz erläutern. Kein Stroboskop.
- Shield: absorbiert den nächsten Schadenspunkt, maximal ein Schild gleichzeitig; danach weg. HUD zeigt aktiv/inaktiv.
- Temporäre Waffe ersetzt die vorherige Sonderwaffe statt unbegrenzten Stapelns; bei 0 Vorrat automatisch zurück zur Pistole. Waffe und verbleibende Munition im HUD eindeutig anzeigen.

Gästeschutz, Punkte, Kombos und Schaden dürfen durch Sonderwaffen nicht ausgehebelt werden. Damage/Score/Ammo getrennt behandeln. Existierende Reset-/Kombo-Probleme aus der Architektur-Doku vor dem Ausbau gezielt beheben, keine komplette Neuentwicklung.

## 4. LEVEL 2 – BOXHAGENER PLATZ, FRÜHER MORGEN

Nach Sieg über den Türsteher von Level 1 folgt ein kurzer Levelabschluss und dann „WEITER ZUM BOXI“. Level 1 nicht ersetzen oder überspringen. Für Entwicklung darf ein klar markierter Level-2-Testeinstieg existieren.

Szenario: Wir kommen aus der Bunkernacht in den frühen Morgen am Boxhagener Platz in Berlin-Friedrichshain. Der Wochenmarkt wird gerade aufgebaut, Planen werden aufgespannt, Kisten und Handkarren stehen herum. Kaltes Morgenblau und erstes pfirsichfarbenes/goldenes Sonnenlicht, nasse Pflastersteine, Herbstlaub, dezente Neonreste. Komische Halloween-Apokalypse, kein realistisches Blut. Die fiktive Szene orientiert sich am Platz, echte Menschen/Marken/Marktbetreiber werden nicht dargestellt.

Drei gelieferte Hintergründe und feste Stationen:
1. level2-01-boxi-arrival.png – Ankunft am Platz, Kisten und Lieferwagen. Markt-Zombies einführen, lebende heimkehrende Gäste und Passanten schützen.
2. level2-02-market-setup.png – Gasse zwischen den halbfertigen Obst-/Gemüseständen. Marktleute sind schon Zombies; Angriffe aus klaren Lücken zwischen Ständen, Techno-Fledermäuse fliegen darüber. Gezielt Health und Sonderwaffe anbieten.
3. level2-03-granny-square.png – offene Fläche am Grünplatz als Finale mit der fiesen Zombie-Oma.

market-vendor-gestures.png bietet den neuen Marktverkäufer-Zombie mit vier Posen. Für lebende Passanten die beiden gelieferten menschlichen Gestenbögen verwenden; keine neuen Passanten erfinden. Zombies und lebende Menschen klar unterscheidbar halten. Keine Figuren fest in die Hintergründe malen. Szene bleibt ein Railshooter mit automatisch geführter Inszenierung; keine frei laufende Spielfigur, kein Laufspiel, keine prozeduralen Level.

## 5. MINI-BOSS – HANDTASCHEN-OMA

granny-handbag-attack.png: 2×2-Folge idle → windup → release → recovery. Release-Pose enthält keine Handtasche in der Hand; das Geschoss kommt separat aus handbag-projectile-spin.png mit vier Ansichten/Taumelphasen. Die Ansichten sind keine mathematisch exakten 90-Grad-Drehungen; den Sprite zusätzlich im Code rotieren, statt perfekte Rotationswinkel aus dem Bildnamen abzuleiten.

Angriff: deutliches Ausholen von mindestens 0,7 Sekunden, dann fliegt eine Handtasche in einem lesbaren Bogen Richtung Vordergrund; der Spieler kann sie rechtzeitig abschießen. Sie wächst mit der Tiefe passend zur Perspektive. Genau ein Schaden, wenn sie die Trefferlinie erreicht; nach Abschuss/Schaden entfernen. Trefferbox und sichtbare Tasche müssen übereinstimmen. Kein versteckter Timer verursacht Schaden unabhängig vom sichtbaren Geschoss.

Oma hat eigene Lebensleiste und ein kurzes Erholungs-/Verwundbarkeitsfenster nach dem Wurf. Schwierigkeit fair steigern, keine unlesbaren Schauer. Keine Schläge gegen lebende alte Menschen: Diese Figur ist eindeutig grün/untot und comichaft. Kurze Berliner Sprechblasen per Code, z.B. „Früher war mehr Hirn im Angebot!“ oder „Die Tasche bleibt bei mir!“ Nach Sieg Levelabschluss mit Gesamtpunkten und Highscore.

## QUALITÄT UND TECHNIK

- Bestehendes gutes Shooter-Gefühl, Artstyle und Level 1 erhalten. Neue Bilder lokal integrieren; keine Engine-Migration.
- Ladeschutz aus Baseline erhalten: alle Fehler sichtbar mit konkretem Dateinamen, Wiederholen und Timeout. Fehlende Datei darf niemals wieder zu endlosem Ladebalken führen. Neue Level-Assets dürfen Level 1 nicht unnötig blockieren; pro Level laden/vorladen und Fortschritt sichtbar halten.
- Zeitsysteme, Spawn-/Burst-/Projektil-/Animationstimer bei Pause und Neustart konsistent zurücksetzen. Keine zurückgebliebenen DOM-Listener, Timeout-Angriffe oder fortlaufenden Audios aus dem vorigen Run.
- Maus, Touch und Lightgun: Zielen/Klick wie bisher; R, rechter Mausklick und sichtbarer Touch-Reloadbutton. Offscreen-Reload nur in tatsächlich anklickbarer Randzone innerhalb der Webseite, kein Zugriff außerhalb des Browserfensters behaupten. Menü-/HUD-Klicks sind keine Schüsse.
- Kurze Pause mit Fortsetzen/Neustart/Levelmenü ergänzen. Kritische Timer in der Engine-Spielzeit führen.
- Strobo standardmäßig AUS, Lichtempfindlichkeitshinweis, aktivierbare Option falls überhaupt nötig; höchstens 3 Blitze pro Sekunde. Auch vorhandenes Neon-Flicker prüfen. Reduzierte Bewegung anbieten.
- Web Audio weiterverwenden, eigene kurze Markt-/Flügel-/Taschen-Sounds synthetisch ergänzen; Audio erst nach Nutzeraktion, Lautstärke und Mute.
- Keine neuen CDN-Abhängigkeiten. Externe Font-Imports entfernen oder Schriften lokal mitliefern. Offline/PWA erst als fertig melden, wenn tatsächlich umgesetzt und geprüft.
- 60 fps anstreben, im Renderloop keine Bilddownloads, keine massiven Partikelmengen oder React-Stateupdates pro Mob/Frame.

## UMSETZUNGSREIHENFOLGE UND ABNAHME

1. Shooter-Basis identifizieren, Originalbilder herunterladen und Level-1-Start prüfen.
2. Gestenbögen und Fledermaus funktionierend integrieren; Level 1 bleibt spielbar.
3. Health, Waffen und Schild samt HUD und klaren Regeln.
4. Level 2 mit drei festen Stationen, Markt-Zombies, Passanten und Oma-Geschossen.
5. Pause, Neustart, Mobile/Lightgun-Nachladen, Audio und Laden absichern; dann Feinschliff.

Extrahiere kleine reine Funktionen für Animationszeit, Heilung/Schaden, Waffen-/Munitionsregeln und Projektillifecycle und ergänze sinnvolle Vitest-Tests. Kein Total-Refactor. Scripts dev, build, test, check; check führt Tests, TypeScript-Prüfung und Build aus. Vorhandene Baseline hat bisher nur dev/build/preview: Tests also wirklich anlegen statt deren Existenz vorauszusetzen.

Prüfe mindestens: unterschiedliche Framezeiten erzeugen gleiche Animationsphase; Pausen frieren alles ein; Health-Cap; Sondermunition und Rückfall; Zivilistenschutz; ein Projektil verursacht höchstens einmal Schaden; abgeschossene Tasche verursacht keinen Schaden; Fledermäuse blockieren keinen Wellenabschluss; Restart setzt Score/Kills/Kombo/Waffen/Health/Zeit zurück. Browserdurchlauf Level 1 → Boss → Level 2 → Oma → Abschluss und Neustart. Fehlende Asset-Datei absichtlich simulieren, sichtbare Fehlermeldung und Retry prüfen.

Wenn derselbe Schritt nach zwei Lösungsversuchen blockiert: stoppen und konkret melden. Nicht endlos herumprobieren und keine Prüfungen erfinden.

Lieferung: spielbare Shooter-Erweiterung mit Level 1 und 2, kurze Steuerung und neue Waffenregeln, tatsächliche Ausgabe von npm run check, verwendete Asset-Liste mit Frame-/Clip-Zuordnung, etwaige Platzhalter und verbleibende Einschränkungen. Nicht nur ein Mockup oder eine Beschreibung liefern. Es bleibt ausdrücklich die SHOOTER-VERSION.
