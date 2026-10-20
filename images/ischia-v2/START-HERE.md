# START HERE – MY CRAZY TRIP TO ISCHIA · Galerie-Assets v2

Shooting Gallery auf Schienen (Beast Busters × Operation Wolf × Zombie Raid), Fake-3D aus 2D-Ebenen, Nachfolger von BUNKERHAIN.

1. `ARENA-PROMPT.md` = Auftrag.
2. `manifest.json` = alle Dateien mit Raw-URL, `localPath`, Level, Art (`kind`), Maße, SHA-256, Raster (`grid`) und pro Zelle gemessene `bounds`/`pivot`.
3. `LEVEL-TRICKS.md` = Inhalte und Fake-3D-Tricks pro Level, Dialoge der Zwischenkarten.
4. `PLAN.md` = Gesamtkonzept, Items, Regeln.
5. `docs/assets-level-N.md` = Beschreibung jeder Datei je Level.

## Arten (`kind`)

| kind | Inhalt |
|---|---|
| `background` | deckende Hintergrundplatte einer Szene (hinterste Ebene) |
| `prop` | freigestellte Kulissenteile, Mittel-/Vordergrundebenen, Deckungen, Licht-/Effektebenen, Fahrzeuge, Wurfobjekte |
| `character` | Gegner/Zivilisten/Helfer: `…-posen` (3×2: gehen A/B, lehnt links/rechts heraus, Angriff, Treffer) und `…-sprung` (Nahaufnahme auf die Kamera) |
| `boss-part` | Bosse in Teilen: Körper (Normal/Phase 2 nebeneinander), Arme/Waffen, Kopf (2×2 Schadensstufen), Sonderteile (Tentakel, Anker, Maschine) |
| `story` | vollflächige Zwischenbilder für Story-Karten zwischen den Leveln |
| `cover` / `logo` | Titelbilder (16:9 und 2:3) und SVG-Logo – Logo über das Cover legen |
| `texture` | deckende Texturen (Straße L3) |
| `cutscene` | Intro-Video (liegt im Paket v1, URL im Manifest) |

## Grenzen (ehrlich)

Raster sind Layoutabsichten, keine fertigen Atlanten – viele Posen berühren Zellränder (`touchesCellEdge`), deshalb `bounds`/`pivot` nutzen und bei Bedarf visuell nachjustieren. Native Größen variieren (oft 1254×1254). Straßentextur nicht pixelgenau nahtlos.

## Herkunft und Rechte

Grafik erzeugt mit GPT-Bildgenerierung (Level 1–8) und Alibaba Bailian (Intro, Korrekturen), Stilvorlage BUNKERHAIN, Architekturvorlagen eigene Reisefotos. Fiktive Airline „Burna Air“, fiktive Fähre, Uniformen und Vereinsfarben; „El Diez“ ist eine erfundene Figur. Keine echten Personen, Marken oder Logos. Comic-Gewalt ohne Blut.
