# MY CRAZY TRIP TO ISCHIA – Landingpage · Einstieg für Arena

## Auftrag

Eine laute, filmische Launch- und Präsentationsseite für **MY CRAZY TRIP TO ISCHIA – Napoli Zombie Apocalypse** bauen. Synthwave-Sonnenuntergang über dem Golf von Neapel trifft auf Comic-Zombie-Horror und Lightgun-Arcade. Kurzes Intro, riesiges Key-Logo, echte Motive aus dem Spiel, klare **JETZT SPIELEN**-Führung, normale Scroll-Bedienung.

## Reihenfolge

1. Diesen ausführlichen Auftrag vollständig lesen:
   https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia-v2/website-brief/ARENA-WEBSITE-PROMPT.md
2. Website-Assetliste holen (neues Key-Logo, Share-Bild, kuratierte Spielmotive mit Raw-URL, `localPath`, SHA-256 und Abschnitt-Vorschlag `section`):
   https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia-v2/website-brief/website-assets.json
3. Die dortigen `entries` herunterladen, SHA-256 prüfen und unter `localPath` ins Projekt legen. Keine ZIP-Datei nötig.
4. Bei Bedarf weitere Motive aus dem vollständigen Spiel-Manifest nachladen (147 Dateien, Level 1–8):
   https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia-v2/manifest.json
5. Website bauen, lokal prüfen, Ergebnis ehrlich melden.

## Design-Richtung

Ein Retro-Arcade-Plakat aus den 80ern, das in Neapel verrottet: Sonnenuntergangs-Verlauf Adria-Blau → Gold, Neon-Pink-Konturen, giftgrüner Schleim, der von Kanten tropft, Palmen-Silhouetten, Pixelkörnung. Das Key-Logo ist der Star. Textdichte niedrig, Humor trocken, Motion gezielt. Keine generische SaaS- oder Reise-Landingpage.

## Was schon vorhanden ist

- Neues Key-Logo (freigestellt) und fertiges Share-Bild in diesem Ordner.
- Spielgrafik Level 1–8: Hintergründe, Gegner-Posen, Bosse in Teilen, Story-Zwischenbilder, Cover 16:9 und 2:3, Intro-Video und vier Übergangsclips:
  https://github.com/kburna243/mikes-cytube-dist/tree/main/images/ischia-v2
- Inhalte je Level: `ischia-v2/LEVEL-TRICKS.md`, Gesamtkonzept: `ischia-v2/PLAN.md`.

## Was dieser Upload nicht behauptet

Hier liegen Website-Assets plus Auftrag. Die Website selbst ist noch zu bauen. Das Spiel ist in Arbeit (spielbare Fassung lokal, Level 1–2 durchgesehen); es liegt **kein** Spiel-Quellcode in diesem Ordner. Die Seite verlinkt das Spiel über eine konfigurierbare URL. Keine Bilder neu zeichnen, kein Feature als fertig behaupten.
