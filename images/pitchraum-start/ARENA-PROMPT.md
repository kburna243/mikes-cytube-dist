# Auftrag: Pitchraum-Demo

## Quelle: zuerst laden
Der Ausgangscode liegt öffentlich auf GitHub:

- Ordner: https://github.com/kburna243/mikes-cytube-dist/tree/main/images/pitchraum-start/pitch-demo
- Dateiliste mit direkten Links: https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/pitchraum-start/manifest.json

Lade alle Dateien aus der Dateiliste und übernimm sie nach `src/components/pitch-demo/`. Baue darauf auf: Aufbau, Sprache und Bedienung bleiben erhalten. Andere Ordner dieses Repos gehören nicht zum Auftrag, lies und verwende sie nicht.

Kannst du die Dateien nicht laden, sage das sofort. Baue sie dann nicht aus der Beschreibung nach.

## Auftrag
Baue aus dem Ordner pitch-demo eine vollständige, eigenständige Produkt-Demo mit Arbeitstitel "Pitchraum" (nur als eine Konstante). Zielgruppe: unabhängige Komponisten und Producer, die Musik an Film und Fernsehen lizenzieren. Sie sind keine Technikprofis. Die Demo besteht aus öffentlicher Website, verdrahteter App und Künstlerseiten.

Technik: React, TypeScript, Vite, Tailwind, Express. Kein Firebase, keine Datenbank, kein externes CDN, keine Google Fonts, keine Analyse-Tools. Schriften lokal über @fontsource, nur OFL-Lizenz. Darüber hinaus keine neuen Abhängigkeiten.

## Teil 1: Öffentliche Website
Seiten: / (Startseite), /so-funktioniert-es, /preise, /fragen, /impressum, /datenschutz.
- Kernaussage in Alltagssprache: Schicke deine Musik gezielt an Menschen bei Film und Fernsehen, sieh, was angehört wurde, und halte Anfragen und Angaben zu jedem Track an einem Ort.
- Hauptknopf überall: "Demo ausprobieren". Zweiter Weg: "Gespräch anfragen" über einen mailto-Link aus einer Konstante, die zunächst leer ist und den Knopf dann ausblendet.
- Startseite: Nutzen, drei Schritte, echte Oberflächen-Ausschnitte aus der App, Beispiele der Künstlerseiten, klare Ansage "Noch in Entwicklung, das ist eine Demo".
- Preise aus einer Konstante, gekennzeichnet als "geplant": Solo 49 €/Monat, Gründerpreis 29 €/Monat, Team ab 149 €/Monat. Keine Kaufmöglichkeit.
- Fragen müssen auch ehrlich sagen, was das Produkt nicht tut: keine Distribution, keine Tantiemen-Auszahlung, kein Marktplatz, keine Rechtsprüfung, keine Rechtsberatung.
- Keine erfundenen Kunden, Zitate, Logos, Zahlen oder Auszeichnungen. Nicht verwenden: "cleared", "verifiziert", "rechtssicher", "KI-Schutz", "Kopierschutz", "DSGVO-konform".
- Impressum und Datenschutz: nur sichtbare Platzhalter "Rechtstext folgt vor Veröffentlichung". Keine Rechtstexte oder Firmendaten erfinden.
- Keine E-Mail-Adressen sammeln und keine Warteliste bauen.

## Teil 2: App verdrahten
Behalte Aufbau, Sprache und Bedienung aus pitch-demo. Ersetze mockApi.ts durch diese Schicht:
- PitchApi: TypeScript-Schnittstelle für alle Datenzugriffe.
- httpPitchApi: spricht mit dem Demo-Server.
Keine Komponente ruft fetch direkt auf.

Baue einen eigenen Express-Server in server/ nur für diese Demo:
- "Demo ausprobieren" erzeugt einen neuen Demo-Arbeitsbereich mit denselben Fantasiedaten wie bisher, ohne Anmeldung und ohne personenbezogene Pflichtangaben.
- Arbeitsbereich-ID: crypto.randomBytes(16), im HttpOnly-Cookie mit SameSite=Lax, im Produktivbetrieb zusätzlich Secure.
- Der Server leitet den Arbeitsbereich immer aus dem Cookie ab, nie aus Anfragedaten. Ein Arbeitsbereich sieht nie Daten eines anderen.
- Alle Daten nur im Speicher, nach 24 Stunden gelöscht, höchstens 500 Arbeitsbereiche, danach verständliche Meldung. In der Demozeile steht "Deine Eingaben werden nach 24 Stunden gelöscht".
- Empfängerlink: /l/:token mit eigenem Zufallstoken aus crypto.randomBytes(16) je Link. Er muss in einem anderen Browser ohne Cookie funktionieren und zeigt nur die Tracks dieses Links.
- Ungültiges Token: verständliche 404-Seite, niemals Beispieldaten oder Rückfall auf einen anderen Link.
- Öffnen, Abspielen und Anfrage über den Empfängerlink werden wirklich erfasst und erscheinen beim Komponisten. "Link kopieren" liefert die vollständige /l/:token-Adresse.
- Serverseitig prüfen: Pflichtfelder, Typen, Längen, Anteile 0 bis 100. Körpergröße auf 100 kB begrenzen. Einfache Begrenzung je IP für Anlegen und Anfragen. Grundlegende Sicherheits-Header setzen. Kein dangerouslySetInnerHTML.
- Kein echter Datei-Upload, kein E-Mail-Versand, keine KI-Aufrufe. Bei Unterlagen wird nur der eingegebene Dateiname gespeichert, klar gekennzeichnet als Demo.
- Rechtestatus bleibt immer "Eigenangabe, ungeprüft". Keine automatisch erzeugten ISRC-, GEMA- oder IPI-Angaben. Leere Felder bleiben leer.
- Audio: Der Server liefert Dateien aus demo-assets/audio/, wenn es zu einer Track-ID eine passende Datei gibt. Sonst zeigt der Player weiter "Hörprobe in der Demo nicht verfügbar". Keine Audiodateien erfinden oder aus dem Netz laden.

## Teil 3: Künstlerseiten, die nicht gleich aussehen
Trenne strikt drei Ebenen:
1. Markenpaket als JSON: Name, Tonfall-Stichworte und diese Werte: --brand-primary, --brand-secondary, --brand-background, --brand-accent, --brand-text, --font-family-display, --font-family-body, --font-family-mono. Diese Variablennamen sind verbindlich. Künstlerseiten verwenden nur diese Werte, keine festen Farben.
2. Gestalt: fünf eigene React-Kompositionen mit wirklich unterschiedlichem Aufbau und unterschiedlicher Trackdarstellung, nicht nur anderen Farben:
   - Plakat: übergroße Typografie, ein Haupttrack, klare vertikale Blöcke.
   - Archiv: dichte Katalogliste wie ein Werkverzeichnis, Filter im Mittelpunkt.
   - Atelier: viel Weißraum, ruhige Textspalte, persönliche Vorstellung zuerst.
   - Leinwand: vollflächige Bildfläche, Titel darüber, filmisch.
   - Raster: Kachelraster mit Coverflächen, wenig Text.
3. Inhalt: aus dem jeweiligen Künstlerprofil.

Lege drei erfundene Künstler an, jeweils mit eigenem Markenpaket, eigener Gestalt und eigenem Inhalt, öffentlich unter /k/:slug und auf der Startseite verlinkt. Bilder nur als selbst erzeugte abstrakte SVG- oder CSS-Flächen, keine Stockfotos.

In der App kommt der Bereich "Meine Seite" dazu. Kurzer Wizard:
- Schritt 1: "Wie soll sich deine Seite anfühlen?" mit 3 Fragen. Daraus ein Vorschlag für Gestalt und Markenpaket, jederzeit änderbar.
- Schritt 2: Farben und Schriftpaar aus kuratierter Auswahl oder eigener Farbwert.
- Schritt 3: Vorschau mit den eigenen Daten, dann "Seite zeigen".
Kein freier Seiteneditor. Zu geringen Kontrast zwischen Text und Hintergrund (unter WCAG AA) zeigt die Oberfläche verständlich an und bietet eine lesbare Alternative an.

Verboten als Standard: Vinyl, Plattenspieler, MPC, Retro-Riso-Look und die Kombination aus Creme und Orange. Die Website und die fünf Gestalten sollen keine gemeinsame Farbpalette oder Standardschrift erzwingen.

## Bedienung
- Nur eine Hauptaktion pro Bildschirm, Alltagssprache, du für Komponisten, Sie für Empfänger.
- Komplett per Tastatur bedienbar, sichtbarer Fokus, auf 375 px ohne seitliches Scrollen, Knöpfe mindestens 44 px hoch.
- Leer-, Lade- und Fehlerzustände überall. Ein Serverfehler zeigt eine echte Fehlermeldung, nie Beispieldaten als Ersatz.
- Deutsche Texte mit echten Umlauten. "Demo mit Fantasiedaten" bleibt in der App dauerhaft sichtbar.

## Tests mit Vitest (echte HTTP-Aufrufe gegen den Server)
- Arbeitsbereich A kann Daten von Arbeitsbereich B weder lesen noch ändern.
- Ungültiges Token liefert 404 und keine Trackdaten.
- Ein Empfängerlink zeigt nur seine Tracks.
- Eine Anfrage über den Link erscheint nur im richtigen Arbeitsbereich.
- Ungültige Eingaben werden abgelehnt.
- Kontrastprüfung erkennt zu schwache und ausreichende Paare.
- Kein Test darf den Server oder die Prüflogik durch Mocks ersetzen.

## Abnahme
A. Von der Startseite zur Demo, zwei Tracks verschicken, Link kopieren.
B. Link in einem privaten Fenster öffnen, Track abspielen, Anfrage senden.
C. Im ersten Fenster erscheinen "Angehört" und die Anfrage. Status auf "Im Gespräch" setzen.
D. Einen Anteil ergänzen und die Summenwarnung sehen.
E. Eigene Seite anlegen und zwei verschiedene Gestalten mit denselben Inhalten vergleichen: Der Aufbau muss klar verschieden sein.
F. Die drei Beispielkünstler sehen nebeneinander nicht wie ein Template mit anderer Farbe aus.

## Am Ende liefern
Dateiliste, Startbefehle, alle Routen und API-Endpunkte, Testergebnis und eine ehrliche Liste, was noch Attrappe ist. Schreibe nicht, dass etwas fertig oder sicher sei, wenn du es nicht getestet hast.
