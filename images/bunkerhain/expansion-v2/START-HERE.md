# START HERE – BUNKERHAIN SHOOTER weiterentwickeln

**Verbindlich: SHOOTER-Version 3. Nicht das Lauf-/Dialogspiel der Version 2.**

Dieses Paket liefert neue Grafik und einen ausführlichen Fortsetzungsauftrag. Die neue Erweiterung ist noch nicht implementiert. Der Ordner `shooter-baseline/` enthält den funktionierenden bisherigen Shooter mit repariertem Asset-Laden. Keine Engine neu schreiben: die Basis ist React/TypeScript + Canvas2D, kein Phaser.

## Für Arena / das nächste Modell

1. `ARENA-FOLLOWUP-PROMPT.md` vollständig lesen und als Auftrag verwenden.
2. `ARCHITECTURE.md` lesen: implementierter Stand, bekannte Lücken und konkrete Erweiterungspunkte.
3. Aktuelles Projekt gegen `shooter-baseline/` prüfen. Falls Laufspiel oder leeres Template: Shooter-Basis übernehmen. Bereits vorhandene weitere Änderungen nicht blind überschreiben.
4. `handoff-files.json` listet alle Text-/Source-Dateien dieses Pakets mit direkten Raw-URLs und SHA256. Kein ZIP nötig. Den Source-Snapshot in den Projektroot übernehmen, nicht als verschachtelte zweite App verwenden.
5. Acht Original-PNGs aus dem alten Manifest nach `public/assets/<kategorie>/` herunterladen:
   https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/bunkerhain/manifest.json
6. Neue PNGs aus `manifest.json` nach den dort angegebenen `localPath` herunterladen. Der Pfad beginnt mit `public/assets/expansion/`. Im Browser werden daraus `/assets/expansion/...`-URLs.
7. Bilder müssen echte lokale Binärdateien sein, keine Chat-Vorschau und keine GitHub-HTML-Seite. Mit `npm ci` und `npm run dev -- --host 0.0.0.0` starten; Arena-spezifischen Port verwenden. Lokal reicht 127.0.0.1.
8. Im nächsten Schritt Animationen/Fluggegner, dann Power-ups, dann Level 2 integrieren. Tatsächliche Checks und Browserprüfung liefern.

## Neue Grafik

- Vier bestehende Zombie-Archetypen mit je vier Gesten/Action-Posen.
- Zwei lebende Gäste mit je vier Warn-/Duck-/Fluchtposen.
- Techno-Zombiefledermaus mit vier Flügelschlagphasen.
- Marktverkäufer-Zombie mit vier Posen.
- Handtaschen-Oma mit vier Angriffsphasen plus separater Handtaschen-Projektilbogen.
- Drei Hintergründe für den frühen Morgen und Wochenmarktaufbau am Boxhagener Platz.
- Pickup-Bogen mit Health, Ammo, Shotgun, SMG, Basskanone und Schild.

Die PNG-Sprite-Bögen sind statische Mehrbildgrafiken. Erst zeitbasierter Framewechsel im Spiel animiert sie. Manifest-Metadaten benennen Pose-Reihenfolge, Zellen und transparente Motivgrenzen. Die expliziten Frame-Rechtecke sind aus tatsächlichen transparenten Zwischenräumen gemessen; Zellen sind nicht zwingend gleich groß. Ein einheitlicher Quellpixel-Maßstab pro Figur verhindert Größenwechsel zwischen Posen. Pivot-/Hitbox-Hinweise sind Integrationshilfen, keine getesteten Gameplay-Hitboxen. Unterschiedliche Knie-/Armposen nicht durch wechselndes Auto-Fit verziehen.

## Status / Qualität

Originalgrafik und Baseline bleiben erhalten. Kein vollständiger Durchlauf der neuen Levels ist behauptet: Der Implementierungsauftrag liegt im Folgeprompt. Baseline war lokal mit Build, TypeScript und Browserstart geprüft; kein vollständiger Level-1-Durchlauf. Architektur nennt verbleibende Baseline-Fehler ausdrücklich.

Die Hintergrundmotive sind eine künstlerische Spielinterpretation des Boxhagener Platzes, keine maßstabsgetreue Rekonstruktion. Als Ortsreferenz dienen die Grünfläche/Umgebung und der Wochenmarkt, bestätigt durch:
- https://www.visitberlin.de/de/plansche-boxhagener-platz
- https://www.berlin.de/ba-friedrichshain-kreuzberg/aktuelles/bezirksticker/2025/120-jahre-markt-am-boxhagener-platz-ein-ort-im-wandel-der-zeit-1596803.php

Keine echten Personen, Standbetreiber, Marken oder fremden Sprites. Nur Comic-Gewalt mit Konfetti/Glitzer/Pixelbrocken. Keine vertraulichen Inhalte in ein öffentliches Asset-Repository übernehmen.
