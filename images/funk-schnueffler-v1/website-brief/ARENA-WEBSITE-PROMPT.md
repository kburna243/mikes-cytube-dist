# Bauauftrag: Detektiv Funk Schnüffler – eine Reise durch Berliner Rillen

Du arbeitest als Creative Developer, Art Director und Frontend-Engineer. Baue eine eigenständige, lokal lauffähige, visuell außergewöhnliche Landingpage für **Detektiv Funk Schnüffler – Rare Groove Hustle**. Sie macht neugierig auf das vorhandene Berliner Musik-Adventure und führt zum Spiel. Liefere eine umgesetzte Website mit nachvollziehbaren Prüfungen, nicht nur eine Beschreibung oder ein Mock-up.

Die Seite soll sich wie das Öffnen eines fremden Plattenkoffers und der Beginn einer Berliner Nacht anfühlen. Ein starkes zusammenhängendes Erlebnis ist das Ziel: Raum, Material, Eingaben, Übergänge und Musik reagieren überzeugend aufeinander. Nutze moderne Webtechnik dort, wo sie diese Idee sichtbar besser macht. Desktop darf spektakulär sein; Mobile muss genauso bewusst gestaltet und direkt bedienbar wirken.

## Zuerst das tatsächliche Material verstehen

Lies `website-assets.json`, `../manifest.json`, `../design.md`, `../PLAN.md`, `../EXPERIENCE-DIRECTION.md` und `../docs/ASSET-GUIDE.md`. Pfade sind hier relativ zum Ordner `website-brief/` des mitgelieferten Pakets. `localPath` bezeichnet die Datei im Paket; `targetPath` ihren vorgesehenen Zielort im Website-Projekt. Verifiziere SHA-256 beim Kopieren. Aus einem Zielpfad `public/site/...` wird zur Laufzeit `/site/...`, mit dem tatsächlichen Hosting-Basispfad kombiniert.

Die Assets liegen als echte Dateien im Paket und sind auf GitHub veröffentlicht:
- **Repository:** https://github.com/kburna243/mikes-cytube-dist/tree/main/images/funk-schnueffler-v1
- **Manifest:** https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/funk-schnueffler-v1/manifest.json
- **Website-Assets:** https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/funk-schnueffler-v1/website-brief/website-assets.json

Zur Laufzeit kommen alle Assets vom eigenen Website-Host, nicht aus meinem Laufwerk, GitHub oder einem fremden CDN. Keine vorhandenen Spielgrafiken durch generische Bilder, Emoji, Stock-Art oder neue KI-Grafik ersetzen.

Beginne mit diesen tatsächlichen Motiven und ihren optimierten Varianten:

- `funk-schnueffler-logo`: Markenlogo, als vorhandene Grafik verwenden und nicht nachsetzen oder verzerren.
- `berlin-map-rough-v1`: bestätigte Stilreferenz und Reisekarte.
- `kreuzberg-street-rough-v1`: Hauptpanorama mit Mansarde, Plattenladen und Kneipe.
- `scene-home-rough-v1`, `scene-otto-rough-v1`, `scene-fritte-rough-v1`: Innenräume derselben Druckwelt.
- `schnueffler-comic`, `schnueffler-walk-sprites`, `schnueffler-dj-sprites`: erkennbare Hauptfigur und vorhandene Animationsbögen.
- `npc-arthur-standing-v1`, `npc-otto-standing-v1`, `npc-mona-standing-v1`: stehende Figuren; Originalporträts sind separate Dialogmotive.
- `noziy-01-preview`, `noziy-02-preview`: kurze tatsächliche Musikvorschauen; ihre Credits unverändert übernehmen.
- `standbilder/`: echte Screenshots des aktuellen Spiels, geeignet für einen bewusst gestalteten Einblick.
- `og-image-1200x630`: fertig gestaltetes Share-Bild aus den vorhandenen Marken-/Spielgrafiken, unter `social/og-image-1200x630.png`.

Die vollständige Auswahl und alle Größen kommen aus dem Manifest. Nicht jedes Legacy-Bild verwenden, nur weil es im Paket liegt. Der erste grafisch geschlossene Abschnitt ist Kreuzberg.

## Identität und Sprache

Die Hauptfigur ist **DJ noziy neigbour aka Detektiv Funk Schnüffler**. „Detektiv“ ist sein Künstlername. Es geht um Funk, Soul, Plattensammeln, Pressungen, eigene Beats und Clubnächte, nicht um Kriminalfälle. Der Leitsatz lautet: **„Dein Koffer ist klein. Dein Sound ist groß.“**

Die Sprache ist Deutsch, knapp, warm und trocken. Lieber „Der nächste Break liegt ganz unten“ als Marketing-Floskeln. Kein aufgesetzter Berlin-Dialekt in jedem Satz. Keine erfundenen Dialogzitate von echten Menschen. Die Herkunft von Funk und Soul und der tatsächliche Musikkünstler werden respektvoll sichtbar gewürdigt.

## Visuelle Richtung

Verbindlich ist die Welt aus `design.md`: kantige Linolschnittformen, abgenutzter Siebdruck, kopierte Clubflyer und vergilbtes Papier. Große schwarze Silhouetten, feine Unregelmäßigkeiten, klare freie Flächen. Palette: Papier `#EEDDAD`, Druckschwarz `#211F18`, Petrol `#39756F`, Rostorange `#C75A27`, helles Papier `#F6E9C9`.

Typografie: eine charaktervolle kondensierte Display-Schrift für wenige große Überschriften und eine ruhige gut lesbare Textschrift. Fontdateien lokal mitliefern; ihre Lizenz mitführen. Das vorhandene Logo bleibt das besondere Markenbild. Texte nicht in ein Bild oder WebGL backen. Gute Zeilenumbrüche und echte Layoutarbeit, nicht überall riesige Großbuchstaben.

Die Seite darf räumlich und technisch aufwendig sein. Materialien wirken wie bedruckte Pappe, Holz, Papier und Vinyl; die bestehende flache Druckgrafik bleibt erkennbar. Keine Glasflächen, violetten Neonwolken, austauschbaren Feature-Kacheln, glänzenden Fantasieobjekte oder ständig schwebenden Buttons. Eine wiederholte horizontale Kartenreihe ersetzt keine Dramaturgie.

## Dramaturgie und verpflichtende Signatur-Interaktionen

### 1. Hero – der Plattenkoffer

Logo, Leitsatz und primärer Spiel-CTA sind sofort sichtbar. Dahinter ein hochwertiger räumlicher Plattenkoffer auf einer gezeichneten Berliner Bühne. Koffer, Hüllen und Vinyl dürfen als einfache eigene 3D-Geometrie aufgebaut werden; die Gestaltung wird durch die gelieferten Druckmotive geprägt. Pointer und Touch verändern die Ansicht maßvoll. Eine ausgewählte Platte hebt sich aus dem Stapel und wird nachvollziehbar zum nächsten Kapitel der Seite.

Die erste Inszenierung dauert höchstens rund eine Sekunde, blockiert keine Links und kann direkt übersprungen werden. Kein Preloader für das gesamte Paket, kein Pflichtvideo vor der Seite. Der sichtbare HTML-Hero steht unabhängig vom Laden des GPU-Moduls.

### 2. Von der Rille zur Karte

Ein grafisch zusammenhängender Übergang führt von der Platte in die Berlin-Karte, etwa über eine kreisförmige Papiermaske. Die fünf Kieze lassen sich anwählen und bieten kurze echte Informationen. Kreuzberg führt unmittelbar zur Straßenansicht. Route, Karte und nächste Ansicht teilen einen erkennbaren Bezugspunkt; keine unabhängigen Einblende-Animationen ohne Verbindung.

Die Ortsnamen liegen als lesbare Buttons im DOM über der Karte. Touch, Tab und Enter können dieselben Orte auswählen. Auf älteren Browsern wechselt die Ansicht sofort oder mit einem einfachen Fade. Es werden keine nicht vorhandenen Geheimorte oder öffentlichen Spiel-Deep-Links erfunden.

### 3. Ein Stück Kreuzberg

Die Straße lässt sich erkunden: Mansarde → Otto → Kalte Fritte. Verwende eine zusammenhängende breite Szene statt drei gleich großer Karten. Türen reagieren auf Hover, Fokus oder Tippen und zeigen kurze räumlich zugeordnete Einblicke in die Innenräume. Eine Figur kann wenige Schritte aus dem gelieferten Spritebogen machen; das ist eine Vitrine der Welt, keine zweite Adventure-Engine.

Ein begrenzter, scrollbar erzählter horizontaler Abschnitt ist auf Desktop erlaubt. Native Scrollrichtung und Ausstieg bleiben klar; keine gefangene Maus, kein notwendiges Ziehen. Auf Touch gibt es normales Wischen plus deutlich sichtbare Vor-/Zurück-Buttons. Ohne Bewegung erscheinen dieselben Einblicke als ruhige Folge.

### 4. Der eigene Plattenfund

Eine zweite bewusste Interaktion: wenige Hüllen durchblättern, eine Platte nach vorne holen, Vorder-/Rückseite ansehen und eine der echten Audiovorschauen starten. Eine hochwertige prozedurale Vinylscheibe darf die ausgewählte Hülle ergänzen. Verwende echte verfügbare Metadaten; für die beiden neutral benannten Vorschauen keine erfundenen berühmten Titel oder Covers einsetzen.

Audio startet ausschließlich nach einem Klick/Tipp. Ein sichtbarer Stop-/Mute-Knopf bleibt erreichbar. Nur eine Vorschau spielt gleichzeitig. Ein kleiner Equalizer oder Lichtimpuls reagiert auf echte Audioanalyse; bei stummem oder gestopptem Ton steht er ruhig. Ein Dreh- oder Scratch-Effekt kann bei Pointer-Geste angeboten werden, wenn er tatsächlich hörbar umgesetzt ist; kein falsches Versprechen eines fertigen DJ-Simulators.

### 5. Von der Platte in die Nacht

Der gewählte Kreis oder die Hülle wird zum Übergang in die Kalte Fritte. Zeige Mona und Schnüffler, einen knappen Einblick ins Spiel und drei klare Tätigkeiten: Platten finden, eigenen Sound bauen, Menschen zum Tanzen bringen. Diese Tätigkeiten werden räumlich an vorhandene Motive gebunden; keine separate Standard-Feature-Grid-Sektion.

Danach ein starker Abschluss mit erneutem Spiel-CTA, Musikcredits und kleinem Entwicklungsstand-Hinweis. Eine kompakte globale Navigation bietet „Berlin“, „Platten“, „Die Nacht“. Primäres Ziel bleibt „Spiel starten“.

## Technische Umsetzung

Arbeite im vorhandenen Website-Stack. Bei einem leeren Projekt: Vite + TypeScript + React, statischer Build und klar getrennte Module. Die Landingpage ist ein eigenständiges Projekt; das vorhandene Spiel wird nicht umgebaut. HTML-Inhalt, Navigation, CTA und semantische Überschriften bleiben zugänglich und indexierbar; falls nötig einen Prerender-Schritt einrichten. Den finalen HTML-Output tatsächlich prüfen.

Für die räumliche Bühne **Three.js**, für die zusammenhängende Regie **GSAP mit ScrollTrigger**. Eine gemeinsame Renderinstanz und ein abgestimmter Animationstakt reichen für die sichtbare Bühne; beim Wechseln Canvas und Ressourcen sauber verwalten. WebGPU darf als hochwertige Fähigkeit verwendet werden, mit geprüfter WebGL2- und anschließender HTML/2D-Ausweichdarstellung. Die bloße Anwesenheit von `navigator.gpu` ist kein erfolgreicher Rendererstart: Initialisierung und mögliche Fehler behandeln.

Wenn du Three.js `WebGPURenderer` verwendest, beachte dessen node-/TSL-basierte Materialien und Postprocessing. Klassische `ShaderMaterial`-/`EffectComposer`-Rezepte nicht ungeprüft mit diesem Renderer vermischen. Ein sauber implementierter und gemessener WebGL-Ansatz ist ebenfalls zulässig. Versionen aus kompatiblen aktuellen Paketen wählen und im Lockfile festhalten; API-Details anhand der offiziellen Quellen in `source-references.md` verifizieren.

View Transitions für den Wechsel Karte → Ort oder Platte → Detail als zusätzliche Qualität nutzen, wenn unterstützt; Feature-Check und gleichwertiger direkter Wechsel gehören dazu. Web Audio für die tatsächlich gestartete Vorschau und ihre Analyse. Standard-CSS/SVG eignet sich für Papiermasken und Druckraster, normale Layouts bleiben im DOM. Aufwendige Effekte werden nachgeladen und bei Bedarf vollständig deaktiviert.

Die Hintergründe sind **flach zusammengeführte Bilder**. Separate Architektur-Tiefenmasken, 3D-Modelle und einzelne Instrumentenobjekte liegen nicht fertig vor. Figuren können als vorhandene freigestellte Flächen vor einer Kulisse stehen; Record-/Koffer-Geometrie darfst du selbst erstellen. Keine behaupteten Tiefenkanäle erfinden und keine flachen Bildränder durch übertriebene Kamerafahrten sichtbar aufreißen lassen. Sprite-Raster, gemessene Motivgrenzen und Fußpunkte aus dem Manifest nutzen, nicht blind gleiche Zellen mit unberücksichtigtem Leerraum platzieren.

## Performance und Qualität der Bedienung

- Die höchste Qualität ist adaptiv. Desktop-Ziel 60 fps; tatsächliche Messung mit Testbedingungen melden. Auf schwächeren Geräten reduzierte Effekte und kleinere Texturen; DPR begrenzen, außerhalb des Viewports Rendering stoppen, bei unsichtbarem Tab pausieren.
- Hero-Bild passend vorladen, alle anderen Bilder bedarfsgerecht mit `srcset`, Größenangaben und Lazy Loading. Audio und Video nicht vor der Nutzerauswahl vollständig herunterladen. WebP-Varianten aus dem Paket verwenden, Alpha erhalten.
- Ziel unter definierten mobilen Testbedingungen: LCP ≤ 2,5 s, CLS ≤ 0,1, kurze Eingabereaktion. INP ≤ 200 ms ist ein Feldziel und wird ohne Felddaten nicht als nachgewiesen ausgegeben. Prüfe die realen Hauptinteraktionen zusätzlich im Browser. Keine Perfektionszahl erfinden.
- `prefers-reduced-motion` und eine sichtbare Einstellung „Bewegung reduzieren“ schalten Kamerafahrten, Scroll-Pins und Tonvisualisierung ab. Alle Inhalte und Funktionen bleiben verfügbar. Tastaturfokus wechselt sofort; keine Animation hält ihn fest.
- Browser-Zoom, 360–1920 px Breite, 390×844 und 844×390 explizit testen. Ziele möglichst mindestens 44×44 px, lesbare Schrift, ruhige Textflächen und sichtbare Fokuszustände. Drag ist immer auch über Buttons bedienbar.
- Nur ein modaler Dialog gleichzeitig, Escape schließt, Fokus bleibt sinnvoll und kehrt zurück. CTA und Audio-Bedienung dürfen weder durch Canvas noch durch offene Details verdeckt werden.

## Spiel- und Videoanbindung

Konfiguration `VITE_GAME_URL`: nur eine tatsächliche bereitgestellte relative oder HTTP(S)-URL akzeptieren. Standard leer. Ist keine URL gesetzt, zeige „Spiel-Link folgt“ mit kurzem ehrlichem Hinweis, dass ein lokaler Prototyp existiert; keinen scheinbar aktiven toten Link erzeugen. Bei gesetzter URL im selben Tab zum Spiel wechseln. Keine unbestätigten Level-Queryparameter, Accounts, Leaderboards oder E-Mail-Formulare erfinden.

`cutscenes/intro-original.mp4` ist ein vorläufiger Originalclip mit bekannter noch offener Subline-Korrektur. **Jetzt kein neues Video rendern.** Für die Landingpage standardmäßig keine Verwendung als Haupttrailer. Falls als Bonus gezeigt: ausdrücklich Prototyp, erst auf Klick laden, echte Controls und schneller Ausgang. Der Clip bestimmt nicht den Zeichenstil der Website.

Keine erfundenen Awards, Release-Termine, Bewertungen, Stores oder Spielendenzahlen. Die neue Grafik ist zunächst in Kreuzberg geschlossen; weitere Kieze haben noch ältere Grafik. Den Entwicklungsstand nicht als finale Vollversion verkaufen. Credits und Herkunftshinweise aus dem Paket übernehmen.

Für die Veröffentlichung echte `title`-/Description-/Open-Graph-/Twitter-Metadaten im ausgelieferten HTML setzen. Das mitgelieferte Share-Bild verwenden; eine absolute Bild-URL erst aus der tatsächlich konfigurierten Website-Origin ableiten. Canonical-URL und Sprache `de` korrekt setzen. Ein Favicon kann aus der vorhandenen Markengrafik abgeleitet werden. Keine lokalen Laufwerkspfade in Metadaten veröffentlichen.

## Arbeitsweise und Abnahme

1. Tatsächliche Assets integrieren, einen hervorragenden Hero und eine vollständige lesbare Seitenfolge bauen.
2. Die zusammenhängenden Übergänge und die bedienbare Koffer-/Platteninteraktion umsetzen.
3. Echtes Audio, responsive Varianten und progressive Qualitätsstufen ergänzen.
4. In einem getrennten Sichtprüfungsdurchgang Komposition, Kontrast, Bewegung und Performance korrigieren. Keine aufwendige Technik stehen lassen, die die Nutzung verschlechtert.

Liefere Projektcode, `dev`/`build`/`preview`/`check`-Skripte, lokale Assets, `.env.example`, aussagekräftige Readme und überprüfte Screenshots. Teste CTA mit und ohne URL, Audio Start/Wechsel/Stop, Tastatur, Drag-Ersatz, reduzierte Bewegung, fehlende Assets, GPU-Ausfall und Handy/Querformat. Keine Konsolenfehler, fehlenden Dateien, unsichtbaren CTAs oder blockierten Scrollbereiche. Laufen Checks nicht, nenne die konkrete Einschränkung. Trenne Laborwerte von echten Felddaten.

Am Ende muss eine benutzbare Website stehen, deren technisch aufwendige Momente wie eine einzige bewusst gestaltete Berliner Musikreise zusammenwirken.
