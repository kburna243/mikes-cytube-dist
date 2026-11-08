# Auftrag: Pitchraum, Runde 3

## Quelle: zuerst laden
Der Ausgangsstand liegt öffentlich auf GitHub:

- Ordner: https://github.com/kburna243/mikes-cytube-dist/tree/main/images/pitchraum-r3
- Dateiliste mit direkten Links: https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/pitchraum-r3/manifest.json

Lade alle Einträge unter `files` in die Projektwurzel (`target`). Die Einträge unter `reference` sind nur zum Lesen: Kopiere sie nicht ins Projekt und importiere sie nicht. Andere Ordner dieses Repos gehören nicht zum Auftrag. Kannst du die Dateien nicht laden, sage das sofort und baue nichts aus der Beschreibung nach.

## Ziel
Die Basis bleibt: Typografie, Farbsystem, Montage, Server und App sind gut. **Baue sie nicht neu.** Diese Runde hat zwei Aufgaben in dieser Reihenfolge:

- **Teil A (Abschnitte 1 bis 4):** Der Hero muss in der ersten Sekunde umhauen. Heute ist die Szene fast unsichtbar.
- **Teil B (Abschnitt 5):** Die Demo bekommt Markenwerkstatt und Content-Schleuder.

Mache Teil A zuerst fertig.

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

## 5. Markenwerkstatt und Content-Schleuder
Die Künstlerin soll in der Demo den ganzen Weg erleben: **Marke festlegen, Kampagne planen, Grafiken und Texte bekommen.**

Es gilt eine klare Trennung:
- **Meine Marke** legt fest, wer die Künstlerin ist. Hier entstehen keine Posts oder Grafiken.
- **Kampagne** erzeugt daraus Fahrplan, Grafiken und Texte. Sie liest das Markenpaket nur.
- **Meine Seite** und die Kampagne verwenden dasselbe Markenpaket. Ändert sich die Marke, ändern sich beide.

Die neue Navigation der App: Start, Meine Musik, Anfragen, Meine Marke, Meine Seite, Kampagne. Weiter gilt: eine Aufgabe pro Bildschirm, Alltagssprache, ein Hauptknopf.

### Meine Marke
Ein Wizard mit fünf kurzen Schritten:
1. **Worum geht es?** Name, Musikrichtung, für wen.
2. **Wie soll es wirken?** Drei klar verschiedene Richtungen als große Live-Vorschau zur Auswahl, keine Tabelle.
3. **Farben und Schrift:** Kuratierte Paare oder eigener Farbwert, mit Kontrastprüfung und lesbarer Alternative.
4. **Tonfall:** Wenige Regler und Beispielsätze, die sich sofort mitändern, dazu eigene Do's und Don'ts.
5. **Fertig:** Das Ergebnis auf einer Seite, dazu Download als Markenpaket.

Das Markenpaket besteht aus `tokens.json` im DTCG-Format, `theme.css` mit den verbindlichen Variablen `--brand-*` und `--font-family-*`, `brand-voice.json` und einem einfachen Wortmarken-SVG aus Name und gewählter Schrift. Nichts davon kommt von einer KI, und es gibt keine Logo-Erzeugung. Beschrifte das Logo als "Einfache Wortmarke".

### Kampagne
Lies die Referenzen unter `reference-noizy/`. Sie zeigen den funktionierenden Noizy-Stand. Baue daraus ein neutrales Modul in `src/app-shell/campaign/`, ohne diese Dateien unverändert zu übernehmen. Sämtliche Noizy-Texte, -Pfade, -Farben und -Bilder bleiben draußen.

Ablauf als Wizard:
1. **Welche Veröffentlichung?** Track aus "Meine Musik", Datum, Ziel.
2. **Fahrplan:** Zeitstrahl von 21 Tagen davor bis 14 Tage danach, nach dem Muster in `plan.ts`. Einzelne Termine lassen sich verschieben oder entfernen.
3. **Grafiken:** Vorlagen aus den Zeichenfunktionen von `templates/` und `draw.ts`, per Canvas 2D gerendert, ausschließlich mit dem Markenpaket und den Track-Daten. Formate: Post, Story, Hochformat und A5-Flyer. Eigenes Bild per Datei-Auswahl nur lokal im Browser, ohne Upload.
4. **Texte:** Vorlagen je Termin im gewählten Tonfall, frei bearbeitbar. Keine KI und keine Reichweitenzusagen.
5. **Ausliefern:** PNG herunterladen, Text kopieren, Teilen über `navigator.share`, Kalender als `.ics`.

**Kein automatisches Posten und keine Verbindung zu Plattform-Konten.** Zeige das klar an, zum Beispiel: "Du postest selbst. Pitchraum bereitet alles vor." Spotify und Apple Music erscheinen höchstens als Aufgabe auf der Liste. Keine Konto-Felder, Passwörter oder API-Schlüssel.

### Server und Website
- Markenpaket und Kampagne liegen im Demo-Arbeitsbereich, mit derselben Trennung und Prüfung wie der Rest. Grafiken werden nur im Browser erzeugt.
- Die Montage bekommt einen neuen Akt zwischen "Die Akte" und "Fünf Gesichter": Eine kurze Live-Vorführung zeigt, wie eine Marke sich ändert und Fahrplan, Grafik und Künstlerseite sofort mitziehen. Texte auf Website und in "Fragen" entsprechend ergänzen, einschließlich des Hinweises, dass nichts automatisch gepostet wird.

### Tests
- Markenpaket: `tokens.json` und `theme.css` enthalten alle Pflichtvariablen, und schwache Kontraste werden erkannt.
- Fahrplan: Termine stimmen um das Datum herum, auch über Monats- und Jahreswechsel.
- `.ics`: gültiges Format mit korrekten Daten und maskierten Sonderzeichen.
- Arbeitsbereich A kann Marke und Kampagne von Arbeitsbereich B weder lesen noch ändern.
- Ungültige Eingaben werden abgelehnt.
- Ein Test durchsucht `src`, `server` und `index.html` und schlägt fehl, sobald "noizy", "neighbor" oder "martin" (ohne Groß- und Kleinschreibung) vorkommt.

### Abnahme zu Teil B
6. Marke anlegen, Paket herunterladen: Die drei Dateien plus Wortmarke stimmen.
7. Marke ändern: Die Grafik in der Kampagne und "Meine Seite" ändern sich mit.
8. Kampagne für einen Track anlegen, Termin verschieben, PNG und `.ics` herunterladen.
9. Nirgends erscheinen Noizy-Reste oder Konto-Felder.

## Nicht ändern
- Server-Sicherheit, Cookie, Token, Trennung der Arbeitsbereiche und Empfängerdaten bleiben wie sie sind. Alle vorhandenen Tests bleiben grün, keiner wird gelöscht oder abgeschwächt.
- Ablauf und Sprache der App, Montage und Gestalten nur anfassen, wo dieser Auftrag es verlangt.
- Keine neuen Abhängigkeiten, auch nicht `lucide-react` aus der Referenz. Keine externen CDNs oder Google Fonts, keine Analyse-Tools, keine Stockbilder oder Videos.
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
