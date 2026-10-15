# BUNKERHAIN – aktueller Shooter (Version A)

Dies ist der aktuelle vollständige Source-Stand inklusive der 22 lokal eingebundenen PNGs. Shooter weiterentwickeln, kein Lauf-/Dialogspiel. Version B aus dem zweiten Download war bytegleich mit A.

## Starten

Node-Anforderung laut Vite-Lockfile: ^20.19.0 oder >=22.12.0; zuletzt mit Node 24.19.0 geprüft.

1. Dateien aus `project-files.json` entsprechend `localPath` in ein leeres Projektverzeichnis herunterladen. Manifest selbst ist ausgenommen, alle übrigen Snapshot-Dateien sind mit direkter Raw-URL, Größe und SHA256 gelistet. Keine ZIP-Annahme.
2. `npm ci`
3. `npm run dev -- --host 0.0.0.0` (Arena-Port passend konfigurieren; lokal genügt 127.0.0.1)
4. `npm run check`

`public/assets/` enthält alle acht Originalbilder plus vierzehn Erweiterungsbilder unter `public/assets/expansion/`. Im Browser werden diese lokal unter `/assets/...` geladen. GitHub ist Übergabequelle, keine Laufzeit-Abhängigkeit.

## Funktionsstand

React + TypeScript für Menü/HUD, eigene Canvas2D-Engine für den Railshooter, synthetische Web-Audio-Musik und Sounds. Level 1 im Bunker und Level 2 am Boxhagener Platz; Gesten-Spritebögen, Fledermäuse, Markt-Zombies, Oma mit separaten Handtaschen-Projektilen, Health, Ammo, Shotgun, SMG, Basskanone und Schild sind im Spielcode eingebunden. Pause, Nachladen und Einstellungen sind vorhanden.

Der übergebene Stand bestand lokal `npm run check`: 20 Tests in zwei Dateien, TypeScript-Prüfung und Build erfolgreich. Level-2-Start wurde im Browser gesehen. Ein vollständiger menschlicher Durchlauf durch beide Levels und Bosskämpfe ist noch nicht geprüft. Der automatisierte Integrationstest verwendet Mocks und greift in den Bosszustand ein; er ersetzt diesen Durchlauf nicht. Nicht als fertig getestetes Vollspiel oder fertige Offline-PWA darstellen.

Source unverändert übernommen; node_modules, Builds und Diagnose-Tools sind nicht enthalten. Frühere `expansion-v2/shooter-baseline/` ist ein älterer Stand und darf diese aktuelle Version nicht ersetzen. Der Website-Auftrag liegt im Nachbarordner `website-brief/`:
https://github.com/kburna243/mikes-cytube-dist/tree/main/images/bunkerhain/website-brief
