# BUNKERHAIN: verbindlicher Shooter-Stand und Erweiterung

## Ausgangspunkt: ausdrücklich die SHOOTER-VERSION

Dieses Paket enthält den funktionierenden Canvas-Railshooter (lokale Version 3). Die Lauf-/Dialogspiel-Version 2 ist verworfen und nicht Bestandteil dieses Snapshots. Der Spieler zielt und schießt, bewegt aber keine Spielfigur. Bestehenden Shooter erweitern, keine neue Engine schreiben und kein generisches React-Template an seine Stelle setzen. Falls das Arena-Projekt einen anderen Stand enthält, zuerst `shooter-baseline/` als Ausgangspunkt übernehmen.

Snapshot enthält unveränderte Quellen und Konfiguration, keine Bildduplikate, Abhängigkeiten, Builds oder Caches. Zeilenangaben unten beziehen sich auf diesen Snapshot. Graph-Evidenz war für diese Kopie nicht verfügbar; Aussagen wurden direkt im Source geprüft.

## Start und Assets

Im Snapshot-Verzeichnis `npm ci`, dann `npm run dev -- --host 0.0.0.0`. `npm run build` erstellt den Vite-Build; `npx tsc --noEmit` prüft separat TypeScript. Das vorhandene Build-Script führt keine Typprüfung aus. Neue Prüfskripte erst implementieren, dann deren tatsächliche Ausgabe liefern.

Acht Original-PNGs werden aus dem bestehenden GitHub-Manifest geladen:
https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/bunkerhain/manifest.json

Die dort angegebenen Bilddateien herunterladen und entsprechend ihrem Kategoriepfad unter `public/assets/` ablegen. Bilder beim Build lokal mitliefern, keine Laufzeit-Abhängigkeit von GitHub. Dateinamen im Snapshot sind verbindlich: fünf `backgrounds/background-01-queue.png` bis `background-05-boss.png` (vollständige Namen in `assets.ts`), `characters/characters-atlas.png`, `ui/ui-atlas.png`, `screens/title-screen.png`. Vorhandene PNG-Transparenz erhalten. Keine SVG-Ersatzzeichnungen und keine neuen Originalfiguren erfinden.

## Architektur (IST)

| Datei | Verantwortung und Einstieg |
| --- | --- |
| `src/main.tsx` | React-StrictMode, CSS-Import, Mount von App |
| `src/App.tsx` | React-Oberfläche: loading/title/play/over/win, Canvas bleibt gemountet; loadAssets und Engine-Erzeugung im Effect ab Zeile 52; Start ab 82; Mute, Retry und Ergebnisansicht |
| `src/game/assets.ts` | Typisierte Bildquellen, CHAR_FRAMES/UI_FRAMES aus JSON; 1672×941 logische Auflösung (23–24); loadImage (33), loadAssets (52) |
| `src/game/atlas-frames.json` | Vorhandene Crop-Rechtecke des Snapshots; vor neuer Animation visuell prüfen. Keine echte Frame-Animation: zombieA–D, humanF/M, bouncerIdle/Attack sind einzelne Posen |
| `src/game/engine.ts` | Gesamte Echtzeitlogik und Canvas2D-Rendering in Engine. Es gibt KEIN Phaser/Pixi und keine getrennten reinen Spiellogikmodule |
| `src/game/audio.ts` | BunkerAudio: Web Audio, synthetischer 126-BPM-Techno und SFX, unlock durch Nutzerinteraktion, Master-Mute und Beat-Callback |
| `src/index.css` | Tailwind, UI, CRT/Noise, Neon-Flicker; lädt derzeit Google Fonts extern |
| `src/utils/cn.ts` | Tailwind/Klassennamen-Helfer |
| `vite.config.ts` | React, Tailwind und viteSingleFile, Alias @ auf src |

Ablauf: App lädt alle acht Bilder parallel → erzeugt Engine → Titel → Nutzerstart aktiviert Audio und `Engine.begin()` (182) → reset (195) → requestAnimationFrame loop (675) → update (522) → render (745). Zeitdelta ist auf 0,05 Sekunden begrenzt. Engine meldet Ergebnis über onPhase zurück an React; Highscore liegt als `bunkerhain_hs` in localStorage.

`WAVES` ab engine.ts:49 beschreibt vier feste Stationen: Schlange, Tür, Garderobe, Floor; danach nextWave (609) aktiviert den Türsteher-Boss im fünften Hintergrund. Zombies/Menschen werden innerhalb definierter Zonen zufällig erzeugt. Die Szene fährt nicht kontinuierlich als Kamerafahrt: Figuren wachsen entlang interpolierter Wege, Hintergründe wechseln mit Crossfade. Diesen funktionierenden Eindruck erhalten.

Mob-Zustand enthält kind, einzelnes frame, Start-/Endposition/-skalierung, Fortschritt t, Geschwindigkeit, Sway, state und rect (engine.ts:9). `spawnMob` (488) erzeugt Figuren, update (522) bewegt sie; `drawMob` (825) setzt Wackeln, Beat-Hop, Flip, Schatten und Fades um. `drawFrame` (716) schneidet Atlasbilder aus und verankert sie an den Füßen. Die Trefferbox entsteht aktuell beim Rendern aus dem Bildrechteck. `shoot` (254) prüft Sterne, Boss und Figuren von vorn nach hinten; Ziele verwenden Rechtecke, keine Alpha-Masken.

Kampf: sechs Patronen, automatisches Reload bei leerem Magazin, R lädt nach (234/247), Reload 1,15 s. Drei Herzen (119/199 und HUD 918), Zombie ein Treffer, Boss 26 HP (146/299). Zombie gibt 100×Kombo Punkte (330), Kombo maximal 8. Menschen kosten ein Herz und 150 Punkte (346), Durchbruch kostet ein Herz. Sterne sind schießbare +250-Boni. Boss-Angriff (629): 1,5-s-Fenster, zwei Treffer wehren ab. Ergebnis und Highscore in gameOver (370) / winGame (382).

## Ladefix unbedingt erhalten

`assets.ts:33–49` hat onerror und 15-s-Timeout einschließlich Handler-Cleanup, statt unendlich auf defekte Dateien zu warten. `App.tsx` hat loadError, sichtbare Fehlermeldung und Erneut-laden-Knopf. Fortschritt folgt erfolgreich geladenen Dateien. Canvas bleibt auch während des Ladens gemountet, damit der Engine-Konstruktor ein reales Canvas bekommt. Neue Atlanten in denselben Fehlerpfad integrieren. Keine endlose Ladeanimation bei falschen Pfaden zulassen.

## Grenzen und bekannte Prüfstellen (IST, nicht fertig umgesetzt)

- Keine Pause, Continues, Levelauswahl, Touch-Reloadtaste, Rechtsklick-/Offscreen-Reload oder Headshot-Wertung. Aktuell R und Auto-Reload; nur primäre Maustaste schießt (238).
- Keine Waffenwechsel, Health-Pickups, Fluggegner, Projektile oder zweites Level.
- Keine Tests/test/check-Scripts im package.json; kein Service Worker oder Webmanifest im Snapshot. Singlefile-Plugin ersetzt keine PWA, PNGs bleiben separate Dateien. Google-Fonts-Import verhindert vollständig autarkes Offline-Verhalten.
- Keine Lichtempfindlichkeitswarnung/Strobo-Einstellung. CSS neon-flicker und rotes Boss-Alarm-Pulsieren (drawBg:694) sind vorhanden und müssen vor einer entsprechenden Sicherheitsbehauptung geprüft/angepasst werden.
- Reset setzt totalKills, Boss-Sway, Boss-Taunt und manche Effektzustände nicht vollständig zurück; totalKills (400) akkumuliert Wellen. Wiederholte Runs gezielt prüfen. comboT-Ablauf (534) setzt Kombo nicht auf 1 zurück. Nicht als erwiesene korrekte Kombo-Zeitlogik darstellen.
- destroy (176) entfernt resize/keydown, aber nicht die Canvas-Pointerlistener. Boss verwendet nicht verwaltete setTimeout-Callbacks. Vor echter Pause/Levelwechsel Timer/Listener-Lebenszyklus bereinigen.
- Resize verwendet Cover-Skalierung (213), kann auf schmalen Bildschirmen Randbereiche abschneiden. Boss-Hitbox (299) und Darstellung (855) haben leicht abweichende Größenberechnung; bei Animationen eine gemeinsame Geometrie verwenden.

Vorherige lokale Prüfung laut Übergabe: Build, TypeScript und Browser-Spielstart bestanden. KEIN belegter vollständiger Leveldurchlauf. In diesem reinen Doku-/Snapshot-Schritt wurden keine Pakete installiert und keine Builds/Tests erneut ausgeführt.

## Erweiterungsplan (SOLL)

1. Bestehenden Level-1-Shooter und Originalgrafik als Regression-Basis erhalten. Zunächst echte Frameanimationen für Zombies und lebende Gäste integrieren. Neue Sheet-Bilder sind einzelne Dateien; dazu explizite Frame-/Clip-Metadaten (Reihenfolge, Dauer, Pivot/Fußpunkt, Loop, Hitbox). Nie gleiche Rechtecke vermuten: tatsächliche Bildmaße und Zellgrenzen prüfen. Sprite-Zeit in update pro Figur fortschreiben, drawMob wählt Frame; Trefferbox verwendet gleiche Geometrie. Gesten: Zombies greifen/tanzen/taumeln; Gäste winken, ducken sich, fliehen. Lebende Gäste bleiben klar erkennbar und dürfen nicht zu Gegnern werden.
2. Techno-Zombiefledermaus: eigener Gegnerarchetyp mit Flug-Loop, seitlichem/Bogenflug, angekündigtem Sturzflug und Trefferreaktion; eigenständige Hitbox. Nicht in countWalkers-Zählung versehentlich hängenbleiben lassen. Wenige früh lesbare Einführungsgegner.
3. Datengetriebene Pickups statt Stern-Sonderfall ausbauen: sechs Typen `health`, `ammo`, `shotgun`, `smg`, `bass-cannon`, `shield`. Mit drei Herzen starten; Health +1 bis maximal fünf Herzen. Shotgun, SMG und Basskanone erhalten begrenzte Sondermunition und fallen danach auf die Standardpistole zurück. Munition und Schild gemäß ARENA-FOLLOWUP-PROMPT.md umsetzen. Keine bezahlten/upgegradeten Dauerboni. Gasttreffer-Regel auch für Streuschuss und Basskanone definieren und testen; Waffenstatus und verbleibende Sondermunition im HUD sichtbar machen.
4. Level 2: Boxhagener Platz im frühen Morgen. Drei feste Stationen durch den Wochenmarktaufbau gemäß ARENA-FOLLOWUP-PROMPT.md: Ankunft/Kisten und Lieferwagen → Marktaufbau/Gemüsegasse → offene Granny-Arena mit Zombie-Oma als Mini-Boss. Marktleute sind Zombies, lebende Passanten werden geschützt. Berliner Morgenlicht, nasser Asphalt, Kisten und Planen, Neonreste. Railshooter-Perspektive beibehalten, kein Laufspiel/Plattformer. Handverfasste Stationen mit Spawn-/Vordergrundzonen, keine prozedurale Levelgenerierung.
5. Oma: Warn-Geste → Handtaschenwurf → Erholung. Handtaschen als separate Projectile-Daten mit position/velocity/age/hitbox, update und render; abschießbar, treffen den Spieler erst beim klar angekündigten Erreichen der Vordergrundebene. Keine sofortigen unlesbaren Treffer. Neue Geschossprüfung vor Gegnerprüfung passend zur sichtbaren Tiefe. Health-/Waffenbelohnung möglich.
6. Kleine reine Funktionen für Schadens-/Pickup-/Waffen-/Animationszeitlogik extrahieren und mit Vitest unabhängig testen; keine vollständige Engine-Neuentwicklung. Danach test/build/check-Scripts und echte Ausgabe liefern. Level 1 + Boss + Übergang + Level 2 + Neustart + Touch und Gastschutz im Browser prüfen. Maximal zwei Versuche pro blockierendem Problem, dann konkret melden.

## Abnahme für nächstes Modell

Echte PNGs sichtbar statt Platzhalter; transparente Ränder ohne Matte; keine abgeschnittenen Animationszellen/Fußsprünge; lesbare Flug-/Wurfattacken; Oma-Geschosse abschießbar; Health-Cap und Waffen-Rückfall korrekt; Level 1 weiter spielbar; keine versehentliche Laufspiel-Version; kein Hängen im Loader; keine externen Font-/CDN-Abhängigkeiten nach Offline-Ausbau. Abschließend verwendete Assets, tatsächliche Checks und verbleibende Grenzen nennen. Bestehende Dateien nicht als bereits implementierte Erweiterung ausgeben.


