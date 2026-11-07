# Proposal · DJ Noizy Neighbor als Referenzprojekt

**Stand:** 05.11.2026 · **Projekt:** Marke, Website und Content-Werkzeuge für DJ Noizy Neighbor (Martin Schulz, Berlin) · **Repo:** Forgejo `fried/noizy-brand-suite` · **Live:** https://servermitte.tailecbf0f.ts.net/noizy

## 1. Kurzfassung

In gut zwei Tagen, vom 03.11. abends bis 05.11.2026 nachts, ist aus ein paar Handyfotos und drei Sprachnachrichten eine komplette Künstlermarke geworden: Logo, Website mit Admin, ein Browser-Spiel, eine Marken-Werkstatt für Social-Grafiken, eine Content-Schleuder für Promo-Kampagnen, eine Video-Verpackung für Reels und ein Brand-Kit mit 74 Assets. Es ist das erste große Projekt, das wir komplett abschließen.

Die wichtigste Erkenntnis für die nächsten Projekte: **Sobald `DESIGN.md` und Logo stehen, kommt zuerst das Brand-Kit, erst danach Website und Module.** Wir haben es hier umgekehrt gemacht und dafür mehrfach nachgearbeitet (Abschnitt 4).

## 2. Was gebaut wurde

| Baustein | Was es ist | Stand |
|---|---|---|
| **Marke** | Sticker-Logo mit Berliner Skyline, Fernsehturm und Sonne. Schreibweise NEIGHBOR wie auf Spotify und Apple Music. Palette, Archivo und Space Mono, Markenregeln in `brandkit-werkstatt/BRAND.md` | fertig |
| **Website** | Next.js 16, Postgres, Docker auf servermitte. Musik-Seite mit Album „Back on 16 pads“, Diggin' Gems, Termine, Über, Shop, Pressekit, Rider, Impressum | live, Version 1.5.0 |
| **Spiel** | „Detektiv Funk Schnüffler“, ein Point-and-Click durch Berlin, mit Spielanleitung und Infografik | live unter `/funk` |
| **Admin** | Am Handy pflegbar: Gems mit Foto- und Video-Upload, Termine | live unter `/noizy/admin` |
| **Inhalte prüfen** | Die Text-Vorlage als Fragebogen im Admin: Stimmt so, Ändern oder Später, mit Übersicht der Pflichtfelder | live |
| **Marken-Werkstatt** | Posts, Storys und Flyer im Markenlook: 6 Vorlagen, 6 Formate, 4 Farbwelten, PNG-Export, Teilen am Handy | live unter `/noizy/admin/werkstatt` |
| **Content-Schleuder** | Release einmal anlegen, Fahrplan von T−21 bis T+14 mit Posts pro Plattform, Grafiken aus der Werkstatt, Kalender-Export | live unter `/noizy/admin/schleuder` |
| **Video-Verpackung** | HyperFrames-Bausteine (Titel, Bauchbinde, Übergang, Endkarte, Sting). Erstes Reel mit Noizys Footage, gegradet | Reel fertig, weitere Bausteine im Entwurf |
| **Brand-Kit** | 74 Assets (Logos, Logo-Ebenen, Icons, Labels, Overlays, Texturen, Hintergründe), Tokens, Brand-Guide als HTML, ZIP | fertig, noch nicht in Seite und Werkstatt eingebaut |
| **Projektdoku** | 28 Seiten, A4 quer, mit Chronik und Screenshots | `praesentation/Noizy-Neighbor-Projektdoku.pdf` |

## 3. So sind wir vorgegangen

1. **Material sammeln:** Fotos, Sprachnachrichten, Links per WhatsApp.
2. **Logo-Suche:** acht Konzepte, drei Richtungen, die Skyline mit Fernsehturm gewinnt.
3. **Fotoshooting mit Gemini** nach den echten Fotos, neun Motive.
4. **Website** über einen Bauauftrag an Arena. Zwei Muster, das bessere als Basis, danach Redesign in Richtung Plattenladen-Print.
5. **Live auf eigenem Server:** Docker, Caddy, Tailscale. Jede Version wird lokal gebaut und per `docker save | ssh` übertragen.
6. **Pflege durch den Künstler:** Admin, Fragebogen, Werkstatt, Schleuder. Werkstatt und Schleuder kamen wieder über Arena mit je zwei Mustern, verglichen im Browser.
7. **Video:** Gemini-Clips, HyperFrames-Verpackung, Reel aus echtem Footage.
8. **Brand-Kit:** GPT-Sheets nach eigenem Prompt, automatisch geschnitten, dann als Kit verpackt.
9. **Doku** am Ende.

Bewährt hat sich:
- **Zwei Muster pro Modul aus Arena.** Der Vergleich deckt echte Fehler auf, etwa vertauschte Tage vor dem Release in einem Schleuder-Muster.
- **Klare Integrationsverträge im Prompt:** feste Props, eine `store`-Schnittstelle, ein `renderImage`-Anschluss. Dadurch war jedes Modul in Stunden statt Tagen eingebaut.
- **Pflege direkt im Admin**, statt dass der Künstler Dateien bearbeitet. Eine Markdown-Vorlage ließ sich am Handy nicht einmal öffnen.
- **Prüfung im Browser vor jedem Deploy** und Live-Prüfung danach.

## 4. Die wichtigste Lehre: erst Brand-Kit, dann bauen

**Was passiert ist:** Website und Werkstatt entstanden, bevor es einen vollständigen Satz Markenbausteine gab. Die Folgen:
- Logo-Teile mussten aus einem Rasterbild herausgeschnitten werden.
- Das Logo trug zunächst die falsche Schreibweise NEIGHBOUR. Wir haben einen Ersatz nachgebaut, später kam das echte Logo, und Merch-Bilder und Badges wurden nachträglich getauscht.
- Icons, Texturen und Video-Overlays fehlten. Jedes Modul hat sich eigene Hilfsgrafiken gebaut.
- Video-Verpackung und Reel liefen anfangs mit Ersatzschriften und ohne passende Bausteine für den Logoaufbau.

**Wie wir es künftig machen:** Sobald `DESIGN.md` (Name, Schreibweise, Farben, Schrift, Formsprache, Tonfall, Verbote) und das finale Logo stehen, entsteht das Brand-Kit, **bevor** eine Zeile Website-Code geschrieben wird.

1. **Style Frame:** ein einziges gestaltetes Moodboard, das den Look festlegt. Erst wenn es sitzt, weiter.
2. **Sechs Arbeits-Sheets:** Logo-Ebenen für Animation, Icons, Texturen, leere Labels und Rahmen, Video-Overlays, Hochformat-Hintergründe. Vorlage: `asset-sheets/GPT-PROMPT-ASSET-SHEETS.md`.
3. **Automatisch schneiden und verpacken** mit `asset-sheets/cut_sheets.py` und `build_kit.py`: freistellen, auf die Markenfarben ziehen, Kacheln nahtlos machen, Brand-Guide und ZIP.
4. **Brand-Kit öffentlich bereitstellen**, damit Arena und andere Werkzeuge direkt darauf zugreifen. Das haben wir hier für die Werkstatt auf GitHub gemacht.
5. **Erst dann Website und Module**, die alle aus demselben Kit schöpfen.

Was das bringt: einheitlicher Look in allen Modulen, keine Nacharbeit, schnellere Arena-Ergebnisse, weil die Prompts auf fertige Assets verweisen, und Video-Bausteine von Anfang an. Für Kunden ist das Brand-Kit außerdem ein eigenes, sichtbares Lieferergebnis.

## 5. Weitere Lehren

- **Schreibweise und Fakten am ersten Tag klären.** Name wie auf den Plattformen, dazu die Basisdaten (Equipment, Jahre, Gigs) direkt vom Kunden. Unbestätigte Schätzungen wie „seit 2009, 700+ Gigs“ landeten sonst in Texten, Pressekit und sogar in der `llms.txt` für KI-Suchmaschinen.
- **Den Fragebogen früh verschicken**, nicht am Ende.
- **Originale statt WhatsApp-Kopien.** WhatsApp verkleinert Videos auf 368 bis 480 Pixel. Kunden sollen Dateien über „Datei“, AirDrop oder Drive schicken, Hochformat wenn möglich.
- **KI-Bilder immer prüfen:** Schreibweise Buchstabe für Buchstabe, Kauderwelsch-Schrift im Bild (Trennkarten im Gemini-Plattenladen), Abweichungen vom Prompt (Horizont statt Lichtfläche, quadratisch statt 9:16).
- **SEO-Inhalte nur mit bestätigten Fakten ausrollen.** Den SEO-Commit haben wir deshalb bewusst zurückgehalten.
- **Infrastruktur:** Docker legt seine Daten auf C ab und hat die Platte zweimal gefüllt. Den Docker-Speicher auf ein großes Laufwerk legen. Produktionsdaten ändert der Kunde über den Admin, nicht wir direkt in der Datenbank.

## 6. Was daraus wird

| Baustein | Weiterverwendung |
|---|---|
| **Content-Schleuder** | für eigene Answer-42-Projekte und als Service für Kunden: Kampagne einmal anlegen, Posts für alle Kanäle im eigenen Look. Stufe 2: automatisches Posten über einen selbst gehosteten Planer (z. B. Postiz) |
| **Video-Verpackung** | Proof of Concept für die Nordstern-Strategie: Marken-Bausteine, die aus einer Konfiguration fertige Reels rendern |
| **Marken-Werkstatt und Admin** | Muster, damit Kunden Seite und Social-Grafiken selbst pflegen |
| **Brand-Kit-Pipeline** | Prompt, Schnitt-Skripte und Guide als Standardschritt in jedem Markenprojekt, im Aufbau angelehnt an den Export der Answer42 Markenwerkstatt |

**Vorschlag:** Die Abfolge **DESIGN.md + Logo → Brand-Kit → Website und Module → Video → Doku** wird unser Standardablauf für Markenprojekte. Als Nächstes lösen wir die Content-Schleuder als eigenständiges, markenneutrales Modul heraus.
