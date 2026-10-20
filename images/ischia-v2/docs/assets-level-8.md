# Level 8 – Castello und Showdown
Reine Grafiklieferung. Keine spielbaren Levels oder Engine-Änderungen.

## Hintergrundplatten
- l8a-hintergrund.png: aufsteigender Felstunnel; Fotovorlage IMG_5193.
- l8b-hintergrund.png: enger Mauergang; Fotovorlage IMG_5194. Der verworfene Entwurf mit eingebranntem Wirbel ist nicht im Lieferpaket.
- l8c-hintergrund.png: Terrasse; Fotovorlage IMG_5198.
- l8d-hintergrund.png: freie Gipfelarena ohne Maschine oder Wirbel; Fotovorlage IMG_5198.

## Freigestellte Bauteile
l8-kulissen.png: beabsichtigtes 4×2-Raster, zeilenweise Felsring / Türbogen / Fackel / intakter Tank / defekter Tank / Maschinenkern / Gitter / Treppenstück.
l8-fackellicht.png: separater Flammen-/Licht-Layer.
l8-wirbel.png: separater grüner Wirbel zum Drehen und Skalieren.
l8-ampulle.png: dritte Quest-Ampulle.

## Gegner und Bosse
suora-zombie-posen.png: 3×2, Gehen A/B, links/rechts lehnen, Buchwurf, Treffer. suora-zombie-sprung.png: Kamerasprung.
Gefängnis-Nonne: boss-suora-koerper.png (zwei Spalten Normal/Phase 2), boss-suora-arm.png (Buchwurfarm/Rosenkranzarm), boss-suora-kopf.png (2×2 neutral/Angriff/Treffer/besiegt).
Mr. Burna: boss-burna-koerper.png (Normal/Phase 2), boss-burna-arm.png (zwei Flaschenarme), boss-burna-kopf.png (2×2 neutral/Angriff/Treffer/besiegt).
boss-burna-tentakel.png: zwei getrennte Mutationsarme für Phase 2.
boss-burna-maschine.png: freigestellte Maschine mit leerem Andockplatz für Burna in Phase 3.
Elite-Mix verwendet vorhandene Soldaten, Hafenarbeiter, Ultras und Gang-Zombies aus Level 2–6.

## Schlussbild
l8-ende.png: Fried am Strand mit Zingara und Limoncello, rotes Wunder, grün leuchtendes Handy. Voll komponiertes Zwischen-/Schlussbild, kein beweglicher Spielhintergrund.

## Einbauhinweise
Hintergrund hinten, Ring-/Bogenstücke davor, Gegner/Bossteile getrennt, Licht und Wirbel als eigene Layer. Bewegungen und Trefferzonen implementiert der Spieleentwickler.
Alle PNG bleiben in ihrer nativen Erzeugungsgröße. Tatsächliche Größen/Alpha und beabsichtigte Raster stehen in ../ASSET-METADATEN-LEVEL-2-8.json. Einzelkonturen können Zellgrenzen überschreiten; Bildausschnitte und Hals-/Schulter-Pivots vor dem Rigging von Hand abstimmen. Kein perfekt ausgerichtetes Sprite-Rig zugesichert.
PROMPTS.json enthält Originalaufrufe und gezielte Korrekturen, letzter Aufruf je Dateiname ist die gelieferte Fassung.


