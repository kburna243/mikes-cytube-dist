# MY CRAZY TRIP TO ISCHIA — Asset-Run

Stand: 20. Oktober 2026. Erstellt mit dem eingebauten Imagegen-Werkzeug; die Logos bestehen aus echten SVG-Vektorpfaden ohne externe Schriften oder eingebettete Rasterbilder.

## Inhalt
- 29 neue Spielgrafiken: vier Hintergrundebenen, freigestellte Kulissen und Deckungen, zerstörbare Objekte, drei Boss-Teile, sechs Figurenbögen, drei Zombie-Nahangriffe und ein Effektbogen.
- Zwei Cover: `cover-16x9.png` und `cover-2x3.png`.
- Zwei transparente SVG-Logos: `logo-ischia.svg` und `logo-ischia-compact.svg`. Vorschau: `logo-preview.html`.
- `bereits-erzeugt/`: bisherige Comic-Szenen, Materialatlas, Kabine/Vorfeld/Terminal-Platten, transparente Flugzeug-/Treppen-/Gepäck-Cutouts, Treppenansicht sowie der Bunkerhain-Charakteratlas mit Frame-Daten.
- `PROMPTS.json`, `ASSET-METADATEN.json` und `MANIFEST.json`: Prompts, tatsächlich gemessene Maße/Alpha-Daten und Dateiverzeichnis mit Prüfsummen.

Der Mönch trägt in allen sechs Posen und auf beiden Covern eine hochgezogene Kapuze. Sein Gesicht bleibt vollständig im schwarzen Schatten, ohne erkennbare Gesichtszüge. Diese Vorgabe ersetzt die alte Referenz mit sichtbarem Gesicht.

## Maße und Einbau
Die Cover entsprechen den im Auftrag genannten Pixelmaßen: quer 1536×1024, hochkant 1024×1536. Der Dateiname `cover-16x9.png` wurde aus dem Auftrag übernommen; 1536×1024 ist tatsächlich 3:2, nicht 16:9.

Alle vier Hintergrundebenen sind deckend, sämtliche 25 übrigen neuen Spiel-PNGs besitzen echte transparente Pixel. Einige einzelne Freisteller/Nahansichten wurden nativ in 1254×1254 statt 1024×1024 erzeugt. Die Originalauflösung wurde beibehalten; jedes tatsächliche Maß steht in den Metadaten.

Die Figurenbögen sind hochwertige Rohgrafiken, keine bereits eingerichteten Animationen. Einige Silhouetten ragen über die gedachten 512×512-Zellgrenzen. Vor dem Einbau bitte individuelle Frame-Rechtecke und gemeinsame Fußpunkte festlegen; nicht ungeprüft alle Bögen starr in gleich große Zellen schneiden. Die Metadaten markieren berührte Zellränder. Zellbasierte Alpha-Bounds sind Diagnosewerte, keine Garantie für endgültige Animations-Pivots.

Die Szenen orientieren sich am gemeinsamen Fluchtpunkt etwa auf halber Breite und 45 Prozent Höhe. Für pixelgenaue Zoom-Through-Übergänge die Anker in der Galerie-Engine passend ausrichten. Der Renderstil verbindet detaillierte Comic-Schattierung mit Pixelkonturen und Dithering; er ist nicht in jeder Datei ein streng einheitliches Low-Resolution-Pixelraster.

## Prüfung und Umfang
Dateivollständigkeit, Bilddekodierung, tatsächliche Transparenz, Cover-Schreibweise, Mönchsgesicht und SVG-Struktur wurden separat geprüft. Boss-Körper, Arm und Köpfe sind getrennte Grafiken; Effekte enthalten keine eingebrannten Figuren. Frühere Bilder bleiben zusätzlich erhalten und sind nach Verwendung getrennt abgelegt.

Dieser Lauf erstellt das Asset-Paket. Die neuen Bilder wurden noch nicht in die laufende Spiel-Engine eingebaut. Die vorhandene Spielfassung und Originalreferenzen bleiben unverändert.
