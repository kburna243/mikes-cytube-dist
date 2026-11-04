# Asset-Gebrauch – Detektiv Funk Schnüffler

Dieses Paket enthält echte Dateien aus dem festgehaltenen Spielstand, optimierte WebP-Kopien, responsive Varianten, zwei kurze Originalmusik-Auszüge, Sichtbelege und den unveränderten Intro-Prototyp. Die Spielquellen und die fertige Landingpage sind nicht enthalten.

## Dateien und Pfade

`manifest.json` beschreibt alle Binärdateien. `website-brief/website-assets.json` enthält eine kuratierte Auswahl mit Abschnitt-Vorschlägen. `localPath` ist relativ zu diesem Paket; `targetPath` ist der Pfad im neuen Website-Projekt; `publicPath` ist der dafür bestimmte Browserpfad. Beispiel: `assets/backgrounds/scene-otto-rough-v1.webp` wird nach `public/site/assets/backgrounds/scene-otto-rough-v1.webp` kopiert und als `/site/assets/backgrounds/scene-otto-rough-v1.webp` verwendet. Bei Hosting unter einem Unterpfad den konfigurierten Basis-Pfad voranstellen.

Alle `url`-Felder sind bewusst `null`: Dieses Paket ist vorbereitet, aber noch nicht auf GitHub veröffentlicht. Die im Manifest genannte Repository-/Ordnerkombination ist nur ein Vorschlag. Keine daraus abgeleiteten Raw-Links als existierend behaupten.

## Auswahl und Stil

- `preferred`: die neue Berlin-Karte, Kreuzberger Straße, Mansarde, Ottos Keller und Kalte Fritte. Diese Bilder tragen den bestätigten rauen Druckstil.
- `current`: Logo, Hauptfigur, Sprites und stehende Otto-/Arthur-/Mona-Grafiken.
- `current-dialogue`: die drei ursprünglichen Gesprächsporträts. Oberkörperbilder gehören in Dialoge und nicht als schwebende Figuren auf den Szenenboden.
- `legacy-in-use`/`legacy`: weitere vorhandene Spielgrafik. Sie ist für Bestands-/Spielkontext beigefügt, stilistisch aber noch nicht vollständig umgestellt. Nicht mit den neuen Bildern zu einem vermeintlich konsistenten Hero mischen.
- `current-evidence`: echte Spielaufnahmen. Einzelne Bilder wurden vor den letzten Rahmen-/Sprite-Abstandsänderungen aufgenommen. Die aktuelle Straße, Mansarde, Otto stehend, Handygespräch und Karte zeigen den letzten Stand; Kalte Fritte und einzelne frühere Aufnahmen können noch alte Rahmen zeigen.

Das Logo bleibt die originale Markengrafik. Die PNG-Fallback-Datei ist unverändert. WebP-Logos und Figuren sind verlustfrei codiert; Hintergrundplatten und Spielaufnahmen verwenden Qualität90. Neue responsive Varianten haben eine eigene Prüfsumme und `variantOf`.

## Transparenz, Sprites und Anker

Schachbrett in der Galerie zeigt echte Transparenz. Farbige RGB-Werte unter vollständig transparenten Pixeln sind kein sichtbarer Hintergrund. Alpha beibehalten; keine matte schwarze Fläche hinter die Figur backen.

`grid` bezeichnet die beabsichtigte Anordnung. `rect` ist das Rechteck der Bildzelle in Atlas-Pixeln. `bounds` und `pivot` sind relativ zu dieser Zelle. `pivotNormalized` teilt die Pixelkoordinaten durch die jeweilige Zellbreite/-höhe. Alle Motivgrenzen werden mit Alpha>180 gemessen, damit extrem schwache Randpixel die Messung nicht verfälschen. Beim Zuschneiden `pivot - bounds.xy` als neuen Anker verwenden. Bei unverändertem Atlas die Zellkoordinaten nutzen.

Die vier Gehphasen sind echte horizontale Zellen, aber die Datei enthält große transparente Ränder. Die vier DJ-Posen sind Oberkörper, keine gehenden Ganzkörper. Der DJ-Atlas ist1774px breit; die gerundeten vier Zellbreiten sind unterschiedlich. Nicht blind vier identische Integer-Rechtecke voraussetzen. `touchesCellEdge` warnt vor Motiven, die Zellränder berühren. Die Grenze ist eine Messung und keine Zusage, dass jedes Motiv perfekt freigestellt oder jede Pose sauber separiert ist. Figurenmaßstab über eine Animationsfolge gleich halten, den gemessenen Anker zur Boden-/Pultposition ausrichten.

## Raum und Interaktion

Die Hintergründe sind fertige flache Druckplatten. Es gibt keine separaten Vordergrund-/Mittelebenen, Tiefenkarten, 3D-Modelle oder schaltbaren Lichtlagen. Auf der Landingpage dürfen ganze Platten in virtuellen Tiefen gestaffelt, Perspektivkarten aufgebaut und echte 3D-Schallplatten prozedural ergänzt werden. Keine vorhandene exakte Freistellung von Häusern oder Möbeln behaupten. Ein Kameraflug durch die Bildfläche ist eine Inszenierung, kein Nachweis echter 3D-Geometrie.

## Ton und Video

`noziy-01-preview` und `noziy-02-preview` sind jeweils zwölf Sekunden der bereitgestellten Originalaufnahmen. Ihre neutralen Titel lauten „Gastbeat01“ und „Gastbeat02“; keine Songtitel erfinden. Credit: **DJ noziy neigbour aka Detektiv Funk Schnüffler**. Ton nur nach bewusster Nutzeraktion starten und jederzeit pausierbar/stummschaltbar machen. Musik nicht auf GitHub oder eine neue Website veröffentlichen, ohne die vom Auftraggeber gegebenen Nutzungsrechte zu respektieren; dieses Paket trifft keine neue Lizenzzusage.

`intro-original.mp4` ist eine unveränderte Kopie des gelieferten Videos. Die unsaubere Logo-Subline ist bekannt; ihr Neurender wurde ausdrücklich zurückgestellt. Deshalb `prototype-not-final`, nicht fertiger Trailer. Das Poster ist nur ein extrahiertes erstes Bild. Das Video höchstens als freiwillige Prototyp-Vorschau anbieten, nicht als blockierendes Hero-Intro.

## Reproduzieren und prüfen

Vorbereitung: `python scripts/prepare_assets.py --source-repo PFAD_ZUM_SPIELREPO` mit Pillow und ffmpeg/ffprobe. Ohne Parameter wird der ursprüngliche Geschwisterordner erwartet. Keine Spieldatei wird verändert.

Prüfung: `node scripts/verify-package.mjs`. Die Prüfung benötigt keine zusätzlichen Pakete. Sie prüft Pfadgrenzen, Dateigrößen, SHA-256, Manifestübereinstimmung und Anker-/Zellkonsistenz. Sie ersetzt keine Sichtprüfung. Für die Galerie das Paket über einen lokalen HTTP-Server öffnen, zum Beispiel `python -m http.server 8080`, dann `gallery.html` aufrufen.
