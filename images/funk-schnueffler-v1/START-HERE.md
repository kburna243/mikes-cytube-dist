# Detektiv Funk Schnüffler – Asset- und Landingpage-Paket v1

Stand: 4. November 2026. Spiel-Quellstand: `6493a04ab2abba95ed21e6a670509d895f7892f5`.

Dieses Paket enthält echte Spielgrafiken, optimierte Website-Varianten, Bildmetadaten und einen fertigen Auftrag für eine eigenständige interaktive Landingpage. Die Landingpage selbst ist noch zu bauen. Der Spiel-Quellcode ist nicht Teil dieses Pakets.

## Einstieg

1. `website-brief/ARENA-WEBSITE-PROMPT.md` ist der vollständige Bauauftrag. Zusammen mit diesem Paket an das umsetzende Werkzeug übergeben.
2. `website-brief/website-assets.json` ist die kuratierte Auswahl für die Website. Die tatsächlichen Dateien liegen bereits im Paket. `manifest.json` beschreibt den vollständigen Bestand.
3. `design.md` hält den bestätigten Stil fest. `EXPERIENCE-DIRECTION.md` beschreibt die Interaktionen und Übergänge. `PLAN.md` erklärt das Spiel und seinen tatsächlichen Entwicklungsstand.
4. `gallery.html` zeigt den Asset-Bestand. Für HTTP-Vorschau im Paketordner `python -m http.server 8080` ausführen und `http://localhost:8080/gallery.html` öffnen.
5. `node scripts/verify-package.mjs` prüft den Bestand. Hinweise zur Erzeugung und zu Sprite-Fußpunkten stehen in `docs/ASSET-GUIDE.md`.

## Aufbau

- `assets/`: Bilder für Kulissen, Karte, Figuren, Logo, Sprites und gegebenenfalls Audiovorschauen.
- `standbilder/`: tatsächliche Spielaufnahmen; fertige Seitengestaltung darf daraus nicht vorgetäuscht werden.
- `cutscenes/`: Originalintro, ausdrücklich noch kein final korrigierter Trailer.
- `docs/`: technische Asset-Hinweise.
- `website-brief/`: Website-Auftrag, kuratierte Auswahl und technische Quellen.
- `scripts/`: reproduzierbare Aufbereitung und Prüfung.
- `social/`: fertiges Share-Bild 1200×630; Layoutquelle unter `website-brief/social-card.html`.

## Veröffentlichung

Das Paket ist auf GitHub veröffentlicht:
- **Repository:** https://github.com/kburna243/mikes-cytube-dist/tree/main/images/funk-schnueffler-v1
- **Manifest (Raw):** https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/funk-schnueffler-v1/manifest.json
- **Website-Assets (Kuratierte Auswahl):** https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/funk-schnueffler-v1/website-brief/website-assets.json
- **Bauauftrag (Arena-Prompt):** https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/funk-schnueffler-v1/website-brief/ARENA-WEBSITE-PROMPT.md

Der bestätigte Spielcommit liegt lokal vor. Das Spielrepository hat aktuell keinen konfigurierten Git-Remote; es wurde nicht gepusht. Eine öffentliche Spiel-URL muss der späteren Landingpage über Konfiguration übergeben werden.

## Material und Credits

Hauptfigur: DJ noziy neigbour aka Detektiv Funk Schnüffler, nach der vorhandenen Comicfigur. Originalmusik: derselbe Künstler, unter anderem das Album „Back on 16 pads“. Die Grafiken verbinden vorhandene Spielgrafik mit neu erzeugter Bildkunst. Credits aus dem Spiel und aus den Asset-Metadaten erhalten. Aus diesem Paket keine allgemeine Stock-Lizenz oder Rechte an beliebigen weiteren Musikstücken ableiten.

Die namensgebende Detektivrolle ist ein Künstlername. Das Spiel erzählt von Platten, Funk, Soul, Produktion und Berliner Clubnächten, nicht von einer Kriminalermittlung.
