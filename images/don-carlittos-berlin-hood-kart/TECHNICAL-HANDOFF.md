# Landingpage-Asset-Paket V6

Dieses Paket enthält die Gestaltungsmittel und den Bauauftrag für eine eigenständige interaktive Landingpage. Es enthält noch keine fertig gebaute oder veröffentlichte 3D-Landingpage.

## Ordner

- dist/assets/brand/logo.png: transparente Marke.
- dist/assets/map-icons/: zwölf aus den Originalmodellen gerenderte RGBA-PNGs in 512×512 und 128×128, ohne eingebrannte Beschriftung.
- dist/assets/models/hero-kart.glb: existierendes V4-Kart LOD1 für die Hero-Präsentation.
- dist/assets/models/hero-kart-mobile.glb: existierendes V4-Kart LOD2.
- dist/assets/maps/<map-id>/: drei Landmark-GLBs, Vorschau und Quellmanifest je Map.
- dist/assets/images/: echte Blender-Kart-/Späti-Poster; gegebenenfalls zusätzlich generierte hero-key-art.png als Werbeillustration.
- dist/asset-manifest.json: relative Pfade, Bytezahlen, SHA-256.
- dist/landing-story.json: zentrale Konfiguration und Inhalt.
- dist/index.html: lokale Asset-Galerie, kein Landing-App-Build.
- SPIELANLEITUNG.md und dist/spielanleitung.html: Anleitung für Spieler.
- LANDING-BUILD-PROMPT.md: kopierfertiger Auftrag für den umsetzenden Agenten.

## GitHub / „wie Cytube“

Im aktuell zugänglichen Projekt wurde kein eindeutiges Cytube-Distributionsziel gefunden. Deshalb wurde kein Repository erfunden und nichts hochgeladen. dist ist vorbereitet für ein eigenes statisches Asset-Verzeichnis. Vor dem Push genau owner/repository, Branch und Zielpfad festlegen. Nicht das vorhandene dist des Spiels ersetzen.

Am einfachsten: dist/assets in den public-Ordner des separaten Landingprojekts kopieren. Dann bleiben Modell und Poster auf derselben Origin. Alternativ kompletten Inhalt von dist in ein eigenes GitHub-Pages-Projekt oder unter einen eigenen Unterpfad legen. GitHub Pages liefert den veröffentlichten Inhalt aus; die normale GitHub-Dateiansicht mit /blob/ ist kein Asset-Host. Asset-URLs relativ oder über ASSET_BASE_URL zusammensetzen. Unterpfad der Veröffentlichung beachten. GAME_URL separat konfigurieren. Browser-Netzwerkprüfung auf 200, MIME und CORS durchführen.

## Einbau ins Spiel

Die Icons liegen zusätzlich unter public/assets/map-icons-v6. assets/map-icons/manifest.json ordnet sie den bestehenden courseId-Werten zu. Einen 512-PNG in der Streckenübersicht und den 128-PNG für kompakte Menüeinträge nutzen. Keine Skalierung über 512 CSS-Pixel. Titel daneben als HTML ausgeben. Icons sind separat vorbereitet; die bestehende Streckenauswahl wird durch dieses Paket nicht automatisch umgebaut.

## Herkunft und Grenzen

Map-Icons sind echte transparente Blender-Renderings der vorhandenen Landmark-Modelle. Die 3D-Dateien stammen aus den vorherigen eigenen V4/V5-Paketen. Eventuell vorhandene Hero-Key-Art ist generierte Werbeillustration und darf nicht als Screenshot des laufenden Spiels bezeichnet werden. Die beigefügte Chat-Referenz wurde nicht als technische Quelldatei für diese Modelle verwendet. Keine zusätzlichen Drittanbieter-Scans oder fremden Marken integriert.

Die Map-GLBs sind Bausteine, keine kompletten Strecken. V5-Quellmanifeste enthalten die ursprünglichen Abmessungen und Budgets. Gerenderte Map-Vorschauen zeigen normalisierte Größen. Alle GLBs verwenden Y-up. Export-/Reimportprüfungen der V4/V5-Modelle sind in den ursprünglichen Paketen dokumentiert. Diese Zusammenstellung kopiert unveränderte GLBs und erzeugt eine Prüfsummenliste.

Ein erfolgreicher Web-Build oder ein Performance-Test der zukünftigen Landingpage ist damit nicht behauptet. Vor Veröffentlichung alle Pfade, CTA, Textdarstellung, WebGL-Fallback, Touch und Tastatur prüfen.
