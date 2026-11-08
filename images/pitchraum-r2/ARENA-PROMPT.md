# Auftrag: Pitchraum, Design-Runde 2

## Quelle: zuerst laden
Der Ausgangsstand liegt öffentlich auf GitHub:

- Ordner: https://github.com/kburna243/mikes-cytube-dist/tree/main/images/pitchraum-r2/base
- Dateiliste mit direkten Links: https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/pitchraum-r2/manifest.json

Lade alle Dateien aus der Dateiliste in die Projektwurzel (`target`). Andere Ordner dieses Repos gehören nicht zum Auftrag. Kannst du die Dateien nicht laden, sage das sofort und baue nichts aus der Beschreibung nach.

## Ziel
Funktion und Ablauf stehen. Der Look ist austauschbar: Das ist die Schwäche, die diese Runde beseitigt. Wer die Seite öffnet, soll sich fragen: "Wie haben die das gemacht?" Sie soll wirken wie von einem kleinen, besessenen Design-Studio gebaut, nicht wie ein SaaS-Template.

Bewertet wird nur, was im Browser wirklich passiert. Kein zusätzliches Feature ersetzt fehlende Gestaltung.

## Die eine große Idee
Das Produkt verkauft Musik an Bilder. Also zeigt die Seite das unmittelbar:

**Dieselbe Szene. Drei Tracks. Drei verschiedene Filme.**

Der Hero ist vollflächig und ein spielbarer Filmmoment:
- Eine selbst programmierte Szene läuft in Echtzeit in WebGL2 mit eigenem Fragment-Shader, zum Beispiel Regen auf einer nächtlichen Scheibe, Scheinwerfer und Nebel. Keine Stockbilder, kein Video.
- Darunter eine schmale Timeline mit drei Tracks. Ein Klick wechselt den Track.
- Der Ton kommt live aus der Web Audio API: drei selbst programmierte Klangskizzen über Oszillatoren, Filter und Rauschen. Sie müssen klar verschieden klingen: ruhig, treibend, bedrohlich.
- Ein AnalyserNode steuert Licht, Tempo, Korn, Kamerabewegung und Farbe der Szene. Der Trackwechsel verändert Stimmung und Bedeutung desselben Bildes sichtbar und hörbar.
- Auch die große Headline reagiert: Die Variable-Font-Achsen von Gewicht und Breite folgen dem Signal.
- Ton startet nur nach einem Klick. Vor dem Klick läuft die Szene ruhig weiter und lädt deutlich zum Anhören ein.

Beschrifte die Klänge ehrlich: "Klangskizze, im Browser erzeugt". Diese Skizzen ersetzen auch in der App, auf dem Empfängerlink und auf den Künstlerseiten den bisherigen Hinweis "Hörprobe nicht verfügbar", solange keine echte Datei in `demo-assets/audio/` liegt. Jeder Track erhält seine eigene, aus Tempo, Stimmung und Tonart abgeleitete Skizze. Das Abspielen wird wie bisher erfasst.

## Die Seite als Montage
Die Startseite ist kein Stapel aus Abschnitten, sondern eine durchgehende Sequenz:
1. **Szene:** Der Hero oben.
2. **Schnitt:** Beim Scrollen wird das Bild zum Filmstreifen und dann zum kleinen Fenster. Dieselbe Szene und derselbe Ton laufen weiter, jetzt im echten Empfängerlink.
3. **Der Link:** Eine echte, interaktive Empfängeransicht zeigt in Echtzeit, was "geöffnet", "angehört" und "angefragt" bedeutet. Der Status wandert sichtbar zur Komponisten-Ansicht.
4. **Die Akte:** Anteile und Angaben eines Tracks falten sich wie ein Produktionsblatt auf. Rechtestatus bleibt "Eigenangabe, ungeprüft".
5. **Fünf Gesichter:** Derselbe Track wechselt live durch alle fünf Gestalten. Die Seite baut sich dabei mit der View Transitions API sichtbar um. Das ist der Beweis, dass Künstlerseiten nicht gleich aussehen.
6. **Abspann:** Der Abschluss läuft wie ein Filmabspann, mit dem Knopf "Demo ausprobieren" als letztem Titel.

Scrollen bleibt natives Scrollen. Kein Scrolljacking.

## Gestaltung
**Typografie ist die Hauptfigur.** Headlines sind riesig und setzen bewusst bis an den Rand. Verwende:
- Display: `@fontsource-variable/anybody` (Gewichts- und Breitenachse animieren)
- Fließtext: `@fontsource-variable/instrument-sans`
- Daten und Timecodes: `@fontsource-variable/martian-mono`

Prüfe die Lizenz und ob die Pakete existieren. Fehlt eines, nimm eine gleichwertige OFL-Schrift und nenne den Tausch.

**Farbe:** Kinoschwarz, warmes Weiß und genau eine Akzentfarbe, die vom aktuellen Track kommt. Beim Trackwechsel färbt sich die ganze Website um. Es gibt keine feste Markenfarbe.

**Bewegung:** Filmisch mit klarer Dauer und Absicht: harte Schnitte, Blenden, Timecodes, Filmkorn. Nutze WAAPI, View Transitions, CSS Scroll-driven Animations und `requestAnimationFrame`. Einzige erlaubte neue Abhängigkeit: `gsap` mit fester Version, falls ScrollTrigger wirklich nötig ist.

**Details, die man erst beim zweiten Blick merkt:** Ein mitlaufender Timecode, Knöpfe mit kurzem Klick-Sound nur bei eingeschaltetem Ton, Filmmarker an den Rändern, präzises Hover und Fokus.

**Texte:** Kurz, selbstbewusst, konkret. Die Headline darf nicht "Schicke deine Musik..." bleiben. Schreibe bessere deutsche Texte für die gesamte Website. Keine Füllsätze.

**Verboten, weil es sofort nach Template aussieht:**
- Violett, Blau-Violett-Verläufe, Glasmorphismus und Leuchtränder
- Drei gleich große Karten nebeneinander, Icon-über-Titel-Raster, Screenshot im Browser-Rahmen
- Inter, Space Grotesk, Fraunces und Playfair als Website-Schrift
- Lucide- oder Heroicons-Icons als Gestaltungselement
- Runde Pill-Badges überall, weiche Schatten, zentrierter Hero mit Text und Knopf
- Dekorative Kreise und Dreiecke als "Cover"

## Künstlerseiten
Die fünf Gestalten bekommen dieselbe Sorgfalt. Jede braucht ein eigenes Verhalten, nicht nur ein eigenes Layout:
- **Plakat:** Riesige Schrift, die mit dem Haupttrack atmet.
- **Archiv:** Schnell filterbares Werkverzeichnis, das wie ein Präzisionsinstrument reagiert.
- **Atelier:** Ruhige Lesefläche, Bewegung fast nur beim Abspielen.
- **Leinwand:** Vollflächige Shader-Szene je Track.
- **Raster:** Kacheln, die beim Abspielen aufgehen und ihre Nachbarn verschieben.

Coverflächen erzeugt ein Generator aus Track-Daten und Markenpaket, sichtbar verwandt mit der jeweiligen Klangskizze: Spektrogramme, Wellenfelder, Rauschstrukturen. Künstlerseiten nutzen weiter nur die Variablen `--brand-*` und `--font-family-*`. Die Website darf ihr Akzent-System nicht auf Künstlerseiten übertragen. Lege jetzt alle fünf Gestalten als Beispielseiten an.

## App und Empfängerlink
Ablauf, Wizard und Alltagssprache bleiben unverändert. Eine Aufgabe pro Bildschirm bleibt Pflicht: Die Show gehört auf Website und Empfängerlink. In der App zeigt sich die Qualität durch Typografie, Übergänge und Klarheit, nie durch Effekte, die beim Arbeiten stören.

Der Empfängerlink ist der zweite Höhepunkt: ein Vorführraum, in dem die Musik im Mittelpunkt steht, mit Wellenform und der Szene im Hintergrund.

## Technische Korrekturen
- `vite-plugin-singlefile` entfernen, Assets mit Hash ausliefern, CSP ohne `unsafe-inline` für Skripte. Schriften und Shader laden nur, was die Seite braucht.
- Der Empfängerlink liefert keine Dokumentennamen, Notizen oder sonstigen internen Felder aus der Rechte-Akte. Er liefert nur, was das Infoblatt anzeigt. Ergänze dafür einen Test.
- Bestehende Sicherheitsregeln des Servers nicht lockern: Cookie, Token, Trennung der Arbeitsbereiche, Prüfungen, 404 bei ungültigem Token.
- Alle vorhandenen Tests bleiben grün. Kein Test wird gelöscht oder abgeschwächt.

## Qualitätsgrenzen
- `prefers-reduced-motion`: Keine automatische Bewegung, aber vollständige Inhalte und Funktionen.
- Ohne WebGL2 oder Web Audio gibt es einen gestalteten Rückfall ohne Fehler.
- Auf 375 px genauso stark gedacht, nicht nur verkleinert. Kein seitliches Scrollen.
- Komplett per Tastatur bedienbar, sichtbarer Fokus, ausreichender Kontrast, Knöpfe mindestens 44 px hoch.
- Ein Shader läuft nur, solange er sichtbar ist, und pausiert im Hintergrund-Tab. Ziel: flüssig auf einem normalen Laptop. Bei schwacher Leistung senkt die Szene automatisch die Auflösung.
- Erster Inhalt erscheint schnell, ohne auf Shader oder Schriften zu warten.

## Unverändert gilt
- Kein Firebase, keine Datenbank, keine externen CDNs, keine Google Fonts, keine Analyse-Tools.
- Alle Personen und Werke sind erfunden. Keine erfundenen Kunden, Zitate, Logos, Zahlen oder Auszeichnungen. "Next big thing" zeigt sich in der Machart, nie in erfundenen Behauptungen.
- Nicht verwenden: "cleared", "verifiziert", "rechtssicher", "KI-Schutz", "Kopierschutz", "DSGVO-konform".
- Keine Rechtstexte oder Firmendaten erfinden, keine E-Mail-Adressen sammeln. Die Ansage "Noch in Entwicklung, das ist eine Demo" und "Demo mit Fantasiedaten" bleiben erkennbar, gestalterisch sauber eingebunden.
- Preise bleiben als "geplant" gekennzeichnet. Keine Kaufmöglichkeit.
- Keine Musik oder Bilder aus dem Netz laden und keine echten Personen oder Marken imitieren.
- Deutsche Texte mit echten Umlauten. Arbeitstitel bleibt eine Konstante.

## Abnahme
1. Hero öffnen, Ton einschalten, zwischen den drei Tracks wechseln: Bild, Farbe, Headline und Klang ändern sich klar und ohne Ruckeln.
2. Durch die ganze Startseite scrollen: Sie wirkt wie eine durchgehende Montage.
3. Derselbe Track wechselt durch alle fünf Gestalten, sichtbar animiert.
4. Link anlegen, im privaten Fenster öffnen, anhören und anfragen, beim Komponisten erscheint das Ergebnis.
5. Alle vorhandenen Abläufe und Tests laufen weiter.
6. Reduzierte Bewegung, 375 px und Tastatur funktionieren.

## Am Ende liefern
Dateiliste, Startbefehle, Testergebnis, gemessene Bildrate und Build-Größe, die drei gestalterischen Entscheidungen, auf die du am meisten stolz bist, und eine ehrliche Liste, was noch Attrappe oder nicht getestet ist.
