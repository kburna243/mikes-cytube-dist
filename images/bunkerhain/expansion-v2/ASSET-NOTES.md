# Asset notes – geprüftes Erweiterungspaket

14 neue PNG-Dateien: drei Hintergründe und elf Bögen mit echtem Alpha-Kanal. Zehn Bögen enthalten je vier Posen/Ansichten; der Pickup-Bogen enthält sechs Gegenstände. Alle Dateien liegen einzeln unter 15 MB. Es gibt kein erforderliches ZIP.

Alle ausgewählten Motive wurden visuell geprüft. Zusätzlich wurden PNG-Dekodierung, tatsächliche Maße, Dateigrößen, SHA256, transparente Pixel sowie nichtleere Frame-Rechtecke geprüft. Die Rechtecke wurden aus tatsächlich transparenten Zwischenräumen abgeleitet. Bei Alpha >16 berührt kein Motiv seine Frame-Grenze. Drei Figurenbögen wurden für bessere Abstände in einem zweiten Bilddurchgang überarbeitet; es wurden keine neuen Grafiken per Code nachgezeichnet.

## Wichtig für Animation

Die vier Posen sind Zustände/Gesten, keine lange durchgezeichnete 24-fps-Animation. Verwende die benannten Clips, gezielte Zustandswechsel und ergänzende Bewegungen im Code. Auch lebende Gäste winken/ducken/fliehen, sie sind keine Angreifer.

Die Rasterangabe 2×2 bzw. 3×2 beschreibt die Lesereihenfolge, nicht zwingend mathematisch gleich große Zellen. `manifest.json` enthält die tatsächlichen `rect`-Werte. Durch variable Zellgrößen darf die Figur NICHT pro Frame auf dieselbe Renderhöhe gestreckt werden: Ein Quellpixel-zu-Welt-Maßstab pro Figur, plus framebezogener Pivot. Die vorgeschlagenen Pivots und Clip-Zeiten sind ein Startpunkt; sie sind noch keine im Spiel erprobten Trefferzonen. Für Fledermäuse Kopf/Rumpf als stabilen Anker prüfen; Flügelgröße darf die Trefferzone nicht unlesbar aufblasen.

Handtaschenbilder zeigen Vorder-/Seiten-/Kopfstand-Ansichten und keinen exakt in 90-Grad-Schritten gedrehten Gegenstand. Für den fliegenden Wurf zusätzlich im Code rotieren. Die Oma hat im Release-Frame leere Hände; nur dann das separate Geschoss erzeugen.

Hintergründe sind figurenfrei, mit freien Combat-Zonen und künstlerisch interpretiertem Boxhagener-Platz-/Wochenmarkt-Motiv bei Morgendämmerung. Keine maßstabsgetreue Ortsrekonstruktion. Vorhandene acht Level-1-Bilder bleiben unverändert im alten Ordner.

Die neue Erweiterung ist als Grafik-/Implementierungspaket geliefert, noch nicht im Shooter implementiert. Kein vollständiger Leveldurchlauf, keine Waffenbalance und kein fertig getestetes Animationssystem behauptet.

## Dateiliste und Maße

| Datei | Maße | Bytes | Alpha | Posen/Icons |
| --- | --- | ---: | --- | ---: |
| assets/animations/zombie-mesh-gestures.png | 1254 × 1254 | 1398470 | True | 4 |
| assets/animations/zombie-tracksuit-gestures.png | 1254 × 1254 | 1763809 | True | 4 |
| assets/animations/zombie-punk-gestures.png | 1254 × 1254 | 1068910 | True | 4 |
| assets/animations/zombie-dj-gestures.png | 1254 × 1254 | 1424537 | True | 4 |
| assets/animations/civilian-yellow-gestures.png | 1254 × 1254 | 1238357 | True | 4 |
| assets/animations/civilian-turquoise-gestures.png | 1254 × 1254 | 1148506 | True | 4 |
| assets/animations/techno-bat-flight.png | 1254 × 1254 | 1220717 | True | 4 |
| assets/animations/granny-handbag-attack.png | 1254 × 1254 | 1851161 | True | 4 |
| assets/animations/market-vendor-gestures.png | 1254 × 1254 | 1831043 | True | 4 |
| assets/backgrounds/level2-01-boxi-arrival.png | 1672 × 941 | 3580879 | False | 0 |
| assets/backgrounds/level2-02-market-setup.png | 1672 × 941 | 3320486 | False | 0 |
| assets/backgrounds/level2-03-granny-square.png | 1672 × 941 | 3488671 | False | 0 |
| assets/pickups/powerups-weapons-atlas.png | 1536 × 1024 | 2051337 | True | 6 |
| assets/projectiles/handbag-projectile-spin.png | 1254 × 1254 | 1600669 | True | 4 |
