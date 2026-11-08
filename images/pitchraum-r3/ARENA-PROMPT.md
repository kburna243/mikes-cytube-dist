# Auftrag: Pitchraum, Runde 3

## Quelle: zuerst laden
Der Ausgangsstand liegt öffentlich auf GitHub:

- Ordner: https://github.com/kburna243/mikes-cytube-dist/tree/main/images/pitchraum-r3
- Dateiliste mit direkten Links: https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/pitchraum-r3/manifest.json

Lade alle Einträge unter `files` in die Projektwurzel (`target`). Die Einträge unter `reference` sind nur zum Lesen: Kopiere sie nicht ins Projekt und importiere sie nicht. Andere Ordner dieses Repos gehören nicht zum Auftrag. Kannst du die Dateien nicht laden, sage das sofort und baue nichts aus der Beschreibung nach.

## Ziel
Die Basis bleibt: Typografie, Farbsystem, Montage, Server und App sind gut. **Baue sie nicht neu.** Diese Runde hat genau eine Hauptaufgabe: Der Hero muss in der ersten Sekunde umhauen. Heute ist die Szene fast unsichtbar.

Die Referenz-Datei `reference-a/SceneCanvas.tsx` zeigt die Wucht, die fehlt: große Lichtquelle, viel Kontrast, klar sichtbarer Wechsel je Track. Übernimm diese Wirkung, nicht ihre Schwächen: Der Lichtfleck wirkt beliebig, die Tropfen sehen wie Ringe aus, und Text wird auf hellem Licht unlesbar.

## 1. Der neue Hero: eine echte Filmszene
Baue die Szene in `src/scene/sceneRenderer.ts` neu auf. Sie ist auf den ersten Blick als Bild erkennbar:

**Nachts, Blick durch eine regennasse Autoscheibe.**
- Vorne: Tropfen, die das Bild wirklich brechen. Jeder Tropfen zeigt verzerrt und auf dem Kopf, was hinter ihm liegt. Sie laufen in Bahnen, verschmelzen und hinterlassen Spuren. Keine Ringe.
- Dahinter: unscharfe Lichter der Stadt mit echtem Bokeh und Tiefenstaffelung.
- Darüber: feines Filmkorn und leichte Vignette.

Dieselbe Szene erzählt mit jedem Track eine andere Geschichte. Der Unterschied muss auch ohne Ton sofort erkennbar sein:
- **Nebel über dem Kanal (ruhig):** Warmes Laternenlicht, langsame schwere Tropfen, kaum Bewegung. Eine leere Straße nach Mitternacht.
- **Kupferdraht & Puls (treibend):** Das Auto fährt. Rote Rücklichter ziehen zu Streifen, Tropfen werden seitlich weggedrückt, die Lichter pulsieren im Takt.
- **Glashaus-Mechanik (bedrohlich):** Kaltes Licht, fast Stillstand. Ein einzelnes Licht kommt langsam näher und wird größer. Viel Schwarz.

Der Wechsel zwischen Tracks ist in etwa 800 ms ein sichtbarer filmischer Übergang, keine bloße Farbblende. Der Analyser wirkt auf Licht, Tropfen und Korn deutlich spürbar, statt nur minimal mitzuzucken.

Die Szene füllt den gesamten Hero, randlos über die volle Breite und Höhe des Fensters. Text liegt darüber.

## 2. Kontrast und Aufbau
- Headline und Fließtext sind in jedem Track und bei jedem Klangpegel lesbar. Mindestens 4,5:1 für Fließtext, 3:1 für die große Headline. Erreiche das im Shader: Unter der Textfläche begrenzt eine weiche Maske die Helligkeit. Keine Kästen hinter dem Text.
- Stelle die berechnete Maske und ihre Helligkeitsgrenze als reine Funktion bereit und prüfe sie mit einem Test für alle drei Tracks.
- Hauptaktion im Hero ist "Ton einschalten". Direkt daneben steht "Demo ausprobieren". "Wie das zum Link wird" wird zum unauffälligen Textlink.
- Die drei Tracks sind eine klar lesbare Timeline am unteren Rand des Heros, deutlich sichtbar ohne zu scrollen.
- Auf 375 px bleibt die Szene der Star. Kürze dort die Texte und blende die obere Meta-Zeile aus, sodass die Szene im ersten Bildschirm wirkt.

## 3. Technik-Labels raus
Die Zielgruppe sind Musiker. Sie sollen die Wirkung erleben und keine Technik lesen.
- Entferne alle sichtbaren Angaben wie "WebGL2", "Fragment-Shader", "Web Audio API", "Variable Font", "WGHT/WDTH", "Scroll-driven Animations", "View Transitions" aus Website und Fußzeile. Das betrifft mindestens `src/site/home/Hero.tsx`, `src/scene/FilmScene.tsx`, `src/site/HomePage.tsx`, `src/site/HowItWorksPage.tsx`, `src/site/SiteLayout.tsx`.
- Bleiben dürfen der Timecode und "Klangskizze, im Browser erzeugt".
- Der FPS-Wert ist nur mit `?debug=1` sichtbar. `data-fps` und `data-scale` bleiben im DOM.
- Ersetze die Technik-Tabelle im Abspann durch einen kurzen Abspann in Filmsprache, zum Beispiel mit Angaben zu Bild, Ton und Besetzung. Personen und Werke bleiben als erfunden gekennzeichnet.

## 4. Fehler beheben
- **Schriften im Produktivstart:** Die CSP `font-src 'self'` blockiert eingebettete `data:`-Schriften. Setze `assetsInlineLimit: 0` in `vite.config.ts`, damit Schriften als eigene Dateien ausgeliefert werden. Die CSP bleibt ohne `data:` für Schriften.
- **Qualitätsregel:** Sie greift nicht zuverlässig. Bei niedriger Bildrate blieb `data-scale` bei 1. Korrigiere das: Unter 42 FPS wird die Auflösung schrittweise gesenkt, bis auf ein Minimum. Messwerte aus verdeckten Tabs zählen nicht. Die Regel ist eine reine, getestete Funktion.
- **Knopfgrößen:** Alle Knöpfe und Links, die als Bedienelement dienen, sind auf 375 px mindestens 44 px hoch.
- **Neuer Produktivtest:** Baue die Website, starte den Server mit `NODE_ENV=production` und prüfe per HTTP: `index.html` antwortet mit CSP, jede in `index.html` verlinkte CSS- und JS-Datei liefert 200 mit passendem Inhaltstyp, und jede CSS-Datei enthält keine `data:font`-Quelle.

## Nicht ändern
- Server-Sicherheit, Cookie, Token, Trennung der Arbeitsbereiche und Empfängerdaten bleiben wie sie sind. Alle vorhandenen Tests bleiben grün, keiner wird gelöscht oder abgeschwächt.
- Ablauf und Sprache der App, Montage und Gestalten nur anfassen, wo dieser Auftrag es verlangt.
- Keine neuen Abhängigkeiten. Keine externen CDNs oder Google Fonts, keine Analyse-Tools, keine Stockbilder oder Videos.
- Alle Personen und Werke bleiben erfunden. Keine erfundenen Kunden, Zitate, Logos oder Zahlen. Nicht verwenden: "cleared", "verifiziert", "rechtssicher", "KI-Schutz", "Kopierschutz", "DSGVO-konform".
- `prefers-reduced-motion`: Die Szene zeigt ein ruhiges, trotzdem erkennbares Standbild je Track. Ohne WebGL2 gibt es einen gestalteten Rückfall. Ton startet nur nach einem Klick.

## Abnahme
Du hast vermutlich keinen Browser mit GPU. Behaupte daher nichts über Aussehen oder Bildrate, was du nicht gemessen hast. Geprüft wird danach von Hand.
1. Beim Öffnen ist in unter einer Sekunde eine nächtliche Szene durch eine nasse Scheibe erkennbar.
2. Die drei Tracks ergeben ohne Ton drei klar verschiedene Bilder.
3. Der Text bleibt in allen drei Tracks lesbar.
4. Auf der Website steht kein technischer Begriff mehr.
5. Alle Tests sind grün, der neue Produktivtest läuft.

## Am Ende liefern
Liste der geänderten Dateien, Startbefehle, Testergebnis, Build-Größe und eine ehrliche Liste, was du nicht prüfen konntest.
