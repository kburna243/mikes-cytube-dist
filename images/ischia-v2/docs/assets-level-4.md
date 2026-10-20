# Level 4 – Molo Beverello / Capitano

Alle 16 PNGs sind eigenständige Spielgrafiken. Die drei Hintergrundplatten und das Zwischenbild sind deckende RGB-Bilder. Die übrigen 12 Dateien enthalten RGBA-Transparenz; getrennte Cutouts und Spritesheets direkt im Spiel zuschneiden. Die tatsächliche Rastergröße stammt aus dem PNG-IHDR; Raster- und Pivot-Ausrichtung sind nicht pixelgenau garantiert.

| Datei | Inhalt / Raster | Tatsächliche Größe |
|---|---|---:|
| l4a-hintergrund.png | Molo-Hafen, leere Ankunftszone | 1536×1024 |
| l4b-hintergrund.png | Containerkai, tiefer Abschnitt | 1536×1024 |
| l4c-hintergrund.png | Fähr-Wartehalle | 1536×1024 |
| l4-kulissen.png | 3×2: geschlossener/offener Container, Ticketstand, Kiste, Möwe, Absperrung | 1536×1024 |
| l4-kranhaken.png | Kette mit Haken, Hochformat | 1024×1536 |
| boss-capitano-anker.png | Separater vollständiger Anker mit Kette (Zusatz zum fehlenden Anker im Arm-Cutout) | 1024×1536 |
| hafenarbeiter-zombie-posen.png | 3×2 Posen | 1536×1024 |
| hafenarbeiter-zombie-sprung.png | Ein Sprungpose | 1254×1254 |
| business-zombie-posen.png | 3×2 Posen | 1536×1024 |
| business-zombie-sprung.png | Ein Sprungpose | 1254×1254 |
| faehrcrew-zombie-posen.png | 3×2 Posen | 1536×1024 |
| faehrcrew-zombie-sprung.png | Ein Sprungpose | 1254×1254 |
| boss-capitano-koerper.png | Normal/Phase 2, zwei Spalten | 1536×1024 |
| boss-capitano-arm.png | Arm mit kurzem Kettenstück; ergänzend boss-capitano-anker.png nutzen | 1024×1536 |
| boss-capitano-kopf.png | 2×2 Zustände | 1254×1254 |
| l4-zwischenbild-burna.png | Abfahrende fiktive Fähre mit Burna-Hologramm | 1536×1024 |

Die generierten Posen und Boss-Teile folgen den vereinbarten Rasterabsichten, können aber einzelne Zellgrenzen überschreiten. Füße, Hals-/Schulteranschlüsse und Anker-Pivots vor dem Rigging prüfen. PROMPTS.json enthält die Aufrufe, Referenzpfade und Quellpfade der finalen Bilder; der l4a-Aufruf ist aus der erhaltenen Prompt-Zusammenfassung rekonstruiert, weil der ursprüngliche Call-Eintrag nicht mehr verfügbar war.

Keine zusätzlichen Nonna- oder Touristen-Sheets erstellt; dafür vorhandene Level-1-Grafiken wiederverwenden.

