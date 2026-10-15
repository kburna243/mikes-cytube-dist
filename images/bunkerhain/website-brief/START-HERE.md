# BUNKERHAIN Website – Einstieg für Arena

## Auftrag

Eine hochwertige Game-Start- und Präsentationsseite im BUNKERHAIN-Stil bauen und den vorhandenen aktuellen Shooter darin tatsächlich spielbar einbinden. Filmisches kurzes Intro, animierte Typografie und Charakter-Spotlights, aber zuverlässige Navigation und normale Scroll-Bedienung.

## Reihenfolge

1. Diesen ausführlichen Auftrag vollständig lesen:
   https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/bunkerhain/website-brief/ARENA-WEBSITE-PROMPT.md
2. Aktuelle Version A samt Source, Tests und allen 22 Bildern holen:
   https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/bunkerhain/current-shooter/project-files.json
3. Die dortigen `files` herunterladen und anhand `localPath` direkt in den Projektroot ablegen. Keine ZIP-Datei nötig. Keine zweite verschachtelte App und keine Wiederverwendung der alten Laufspiel-Version.
4. `npm ci`, dann den echten `npm run check` ausführen und den Shooter-Start prüfen. Aktuell war dieser Check mit 20 Tests, TypeScript und Build erfolgreich; kein vollständiger menschlicher Durchlauf ist bestätigt.
5. Website um den bestehenden Shooter bauen. In der eigenen Arena-Kopie darf und soll der React-Einstieg auf Landingpage/GameShell aufgeteilt werden. Keine neue Game-Engine schreiben. GitHub bleibt die Referenz, lokale Projektassets werden mit ausgeliefert.

## Design-Richtung

Eine eigenständige Arcade-Premiere für Menschen, die Berliner Clubkultur, schräge Comic-Horror-Spiele und direkte Lightgun-Action mögen. Visuelle Intensität hoch, Motion gezielt und dosiert, Textdichte niedrig. Beton und Pixel-Comic, Neon-Pink und Giftgrün, riesige Clubposter-Typografie und echte Motive aus dem Spiel. Keine generische Unternehmens- oder SaaS-Landingpage.

## Was schon vorhanden ist

Level 1 im Bunker, Level 2 am frühmorgendlichen Boxhagener Platz, animierbare Figuren, Fledermäuse, Handtaschen-Oma und Geschosse, Waffen und Power-ups. Aktueller Stand:
https://github.com/kburna243/mikes-cytube-dist/tree/main/images/bunkerhain/current-shooter

Die vollständigen Animations-Metadaten liegen weiterhin unter:
https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/bunkerhain/expansion-v2/manifest.json

## Was dieser Upload nicht behauptet

Hier liegt ein gesicherter Shooter plus Website-Auftrag. Die neue Launch-Website ist noch von Arena zu implementieren. Keine Bilder, keine Spielregeln und keine vorhandenen Tests stillschweigend ersetzen. Die alte `expansion-v2/shooter-baseline/` ist veraltet und nicht die Grundlage für diese Website.
