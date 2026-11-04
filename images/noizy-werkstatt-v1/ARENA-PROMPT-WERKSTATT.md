# ARENA-PROMPT · Marken-Werkstatt für DJ Noizy Neighbor

Alles ab der Linie in arena.ai (WebDev) einfügen. Optional die Bilder aus `reference/` als Stil-Referenz anhängen. Die Assets lädt Arena selbst von GitHub.

---

Du baust die **Marken-Werkstatt** für den Berliner DJ und Beat-Produzenten **DJ Noizy Neighbor**. Das ist ein Browser-Tool, mit dem er selbst Social-Media-Grafiken und Flyer baut, die immer im richtigen Marken-Look sind. Er wählt eine Vorlage und ein Format, tippt seinen Text, wählt ein Foto und lädt ein fertiges PNG herunter, ohne Designkenntnisse.

Das Tool wird danach als Modul in seine bestehende Next.js-Seite eingebaut. Halte dich deshalb exakt an den **Integrationsvertrag in Abschnitt 6**. Liefere eine lauffähige Vorschau (`App.tsx` mit Beispieldaten), aber die eigentliche Logik gehört in den Ordner `werkstatt/`.

## 1. Quellen, zuerst lesen

Alles liegt öffentlich auf GitHub. Raw-Links schicken CORS-Header mit, du kannst die Bilder also direkt laden und auf ein Canvas zeichnen.

- Ordner-Übersicht: `https://github.com/kburna243/mikes-cytube-dist/tree/main/images/noizy-werkstatt-v1`
- Einstieg: `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noizy-werkstatt-v1/START-HERE.md`
- Markenregeln: `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noizy-werkstatt-v1/BRAND.md`
- Asset-Liste, jede Datei mit `path`, direkter `url`, Maßen und Rolle: `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noizy-werkstatt-v1/manifest.json`
- Echte Inhalte (Release, Gems, Socials, Mix, Beispiel-Termine): `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noizy-werkstatt-v1/content.json`
- Design-Tokens: `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noizy-werkstatt-v1/tokens.json` und `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noizy-werkstatt-v1/tokens.css` (der `@theme`-Block der Live-Seite)
- Look-Referenz, Screenshots der Live-Seite: `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noizy-werkstatt-v1/reference/site-home.png`, `site-gems.png`, `site-dates.png`, `site-about.png`, `site-home-mobil.png`
- Die Live-Seite selbst: `https://servermitte.tailecbf0f.ts.net/noizy`

Asset-URL = `assetBase + path`. In der Vorschau ist `assetBase` = `https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noizy-werkstatt-v1`.

**Benutze ausschließlich diese Assets.** Erzeuge keine Platzhalterbilder und keine KI-Grafiken, zeichne keine eigenen Logos. Der Name wird immer **NEIGHBOR** geschrieben, nie „Neighbour“.

## 2. Look (Kurzfassung von BRAND.md)

Die Grafiken sehen aus wie ein zweifarbig gedrucktes 70er-Plattencover: Papier, Schwarz, Vinyl-Orange, harte Kanten, harte Schatten ohne Blur, feines Papierkorn. Keine Verläufe, kein Glow, kein Neon.

```css
--ink:#141311; --paper:#f6ead9; --page:#f1e4cf; --surface:#e9dbc3; --fg-muted:#5b5146;
--vinyl:#e85c0d; --vinyl-deep:#b8450a; --sunburst:#f6b436; --olive:#4b5b3b; --dark-page:#111111;
```

**Schrift:**
- **Archivo** (Google Fonts, Variable mit wdth-Achse) für alles. Headlines setzt du in 900, *extra-condensed* (wdth 62 %), Großbuchstaben, Zeilenhöhe 0.86.
- **Space Mono** für Daten und Labels: Datum, BPM, Katalognummer, Badge-Texte, in Großbuchstaben.

**Fotos:** Standard ist Duotone. Das Foto wird graustufig mit Kontrast 1.18 und im Modus *multiply* auf eine `#e85c0d`-Fläche gelegt. Alternativ gibt es Schwarzweiß oder Original.

**Themes**, als Paare aus Hintergrund, Text und Akzent:
- **Papier:** page, ink und vinyl
- **Nacht:** dark-page, paper und vinyl
- **Orange:** vinyl, ink und paper
- **Olive:** olive, paper und sunburst

Andere Kombinationen gibt es nicht. sunburst wird nie als Text auf hellem Grund verwendet.

## 3. Formate (Exportgröße in Pixeln)

| id | Name | Größe | Hinweis |
|---|---|---|---|
| `post` | Instagram Post | 1080 × 1080 | |
| `portrait` | Instagram Hochformat | 1080 × 1350 | |
| `story` | Story / Reel-Cover | 1080 × 1920 | Safe-Zone: oben 250px und unten 340px frei von Text |
| `youtube` | YouTube-Thumbnail | 1280 × 720 | |
| `event` | Event-Header (Facebook, RA) | 1920 × 1005 | |
| `flyer` | Flyer A5 hoch, Druck | 1748 × 2480 | 150 dpi, 3 % Rand bleibt frei |

Jede Vorlage muss in **jedem** Format gut aussehen. Das Layout reagiert auf das Seitenverhältnis (quer, quadratisch, hoch) und skaliert nicht nur.

## 4. Vorlagen

1. **Gig-Ankündigung:** Datum groß in Space Mono (Tag und Monat), Location und Stadt als Headline, Notiz darunter, Status-Label (TICKETS, SOLD OUT oder BESTÄTIGT), Foto im Duotone, Logo. Aus der Termin-Liste (Props) vorbefüllbar.
2. **Gem der Woche:** Plattencover groß mit hartem Schatten, Label „GEM DER WOCHE“, Titel, Label und Land in Space Mono, Badge (z. B. „Discogs: 1.337 €“), dazu eine Zeile Story. Aus der Gem-Liste (Props) vorbefüllbar.
3. **Release / Neuer Track:** Cover, Titel als riesige Condensed-Headline, Zeile „JETZT ÜBERALL“ und darunter Streaming-Namen als Text (Spotify, Apple Music, YouTube). Keine fremden Plattform-Logos.
4. **Mix / Live-Set:** Titel, Untertitel, Plattform in Space Mono, Hintergrund wahlweise Foto oder Muster (`pattern-*`).
5. **Statement:** nur Typografie, ein kurzer Satz in riesigen Condensed-Versalen. Ein Wort lässt sich per Klick im Akzent einfärben, wie „NEIGH**BOR**“ auf der Startseite.
6. **Studio-Moment:** Foto vollflächig, darunter ein Papierstreifen mit einer Zeile Text und einem Mono-Label. Wirkt wie ein Polaroid-Streifen, sitzt aber gerade.

## 5. Bedienung

Die Oberfläche ist Deutsch und mobil zuerst, denn er arbeitet am Handy. Oben steht die Live-Vorschau, darunter die Steuerung. Ab 1024px liegen Vorschau und Steuerung nebeneinander.

**Steuerung:**
- Vorlage, Format, Theme
- Textfelder je nach Vorlage
- Foto aus der Bibliothek (Raster mit allen Fotos, Gem- und Release-Covern aus dem Manifest) **oder** ein eigenes Foto vom Gerät. Eigene Fotos bleiben im Browser und werden nirgendwohin hochgeladen.
- Fotolook: Duotone, Schwarzweiß oder Original
- Bildausschnitt: per Ziehen in der Vorschau verschieben, Zoom-Regler
- Logo-Position: vier Ecken oder aus; Logo-Variante: Badge oder Schriftzug
- Papierkorn an/aus
- Story-Safe-Zone ein- und ausblenden (nur Anzeige, nicht im Export)

**Leitplanken, damit es immer gut aussieht:**
- Texte schrumpfen automatisch, bis sie passen (fit-to-box). Bei zu langem Text erscheint ein freundlicher Hinweis mit Zeichenzähler.
- Steht „Neighbour“ in einem Textfeld, wird es zu „Neighbor“ korrigiert, mit kurzem Hinweis.
- Nur die vier Themes, keine freie Farbwahl.

**Export:**
- Button „PNG herunterladen“ exportiert in Originalgröße.
- „Alle Formate“ exportiert die aktuelle Vorlage in allen sechs Formaten nacheinander.
- Auf dem Handy gibt es `navigator.share({ files })`, damit er direkt in Instagram teilen kann. Fallback ist der Download.
- Dateiname: `noizy_<vorlage>_<format>_<YYYY-MM-DD>.png`

**Caption-Helfer:** Unter dem Export steht ein fertiger Instagram-Text passend zur Vorlage. Er wird aus festen Textbausteinen und den Eingaben erzeugt, ohne KI. Dazu kommen 5–8 Hashtags (#djnoizyneighbor #berlin #rarefunk #crate digging …) und ein Button zum Kopieren.

## 6. Integrationsvertrag (verbindlich)

**Stack:**
- React 19 und TypeScript strict, ein Client-Component
- Tailwind CSS v4
- Icons nur aus `lucide-react`
- **Keine weiteren Abhängigkeiten.** Gerendert wird mit der nativen Canvas-2D-API, kein html2canvas und kein Fabric.

**Dateien:**
```
werkstatt/
  Werkstatt.tsx      // default export, "use client", die ganze Oberfläche
  types.ts           // Props und Datentypen (siehe unten)
  formats.ts         // die 6 Formate
  themes.ts          // die 4 Themes
  library.ts         // Bildbibliothek, aus manifest.json übernommen (relative Pfade)
  draw.ts            // Helfer: fitText, drawDuotone, drawGrain, drawLabel, drawHardShadow, drawLogo, loadImage
  templates/*.ts     // je Vorlage eine reine Funktion: (ctx, data, format, theme, assets) => void
App.tsx              // nur Vorschau: rendert <Werkstatt> mit Daten aus content.json
```

**Props** (exakt so):
```ts
export type WerkstattGig = { date: string /* YYYY-MM-DD */; venue: string; city: string; status: "TICKETS" | "CONFIRMED" | "SOLD OUT"; note?: string };
export type WerkstattGem = { title: string; artist?: string; label: string; country?: string; badge: string; story?: string; img: string };
export type WerkstattRelease = { title: string; year: string; label: string; cover: string };
export type WerkstattProps = {
  assetBase: string;            // Präfix für alle Asset-Pfade. Vorschau: "https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/noizy-werkstatt-v1", auf der Seite: ""
  gigs?: WerkstattGig[];
  gems?: WerkstattGem[];        // img darf relativ ("/assets/...") oder "/api/media/..." sein
  release?: WerkstattRelease;
  fonts?: { display: string; mono: string }; // CSS-Familiennamen, Standard "Archivo" / "Space Mono"
};
```

**Regeln für die Integration:**
- **Bildpfade:** Im Code stehen alle Pfade relativ (`/assets/photos/...`). Die URL baust du immer mit `assetBase + pfad`. Keine absoluten URLs hart verdrahten außer in `App.tsx`.
- **Bilder laden:** mit `img.crossOrigin = "anonymous"` und `await img.decode()`, bevor gezeichnet wird. Sonst ist das Canvas „tainted“ und der Export schlägt fehl.
- **Fonts auf dem Canvas:**
  - Vor dem ersten Zeichnen wartest du auf `document.fonts.load('900 100px "<display>"')` und auf dasselbe für Mono.
  - Condensed setzt du über `ctx.fontStretch = "extra-condensed"`. Wo das nicht unterstützt wird (Firefox), skalierst du horizontal (`ctx.scale(0.62, 1)`) und kompensierst die Breite beim Messen.
  - Die Familiennamen kommen aus der Prop `fonts`, denn auf der Zielseite benennt `next/font` die Familien um.
  - In der Vorschau lädst du Archivo (wdth 62..125, wght 400..900) und Space Mono per Google-Fonts-Link.
- **Rendern:** in einem Offscreen-Canvas in Exportgröße. Die Vorschau ist dasselbe Canvas, per CSS verkleinert. So sind Vorschau und Export garantiert identisch.
- **Styling:** Für die Oberfläche nutzt du Tailwind-Klassen mit diesen Token-Namen, damit es auf der Seite ohne Anpassung passt:
  - Farben: `bg-page`, `bg-surface`, `text-fg`, `text-fg-muted`, `bg-vinyl`, `text-ink`, `border-fg`
  - Zusatzklassen: `sticker` (2px-Rahmen, 4px-Hartschatten), `type-condensed` (Headline-Stil), `font-mono`
  - In der Vorschau definierst du diese Tokens und Klassen selbst in einer `index.css` mit `@theme`, mit den Werten aus `tokens.json`.
- **Zustand:** Kein globaler State, kein Router, kein `localStorage`-Zwang. Ein „Zuletzt benutzt“-Speicher in `localStorage` ist erlaubt, muss aber in try/catch laufen.
- **Barrierefreiheit:** echte `<label>` für alle Felder, Fokus-Rahmen sichtbar (2px vinyl), Buttons mindestens 44px hoch.

## 7. Abnahme

1. Alle 6 Vorlagen funktionieren in allen 6 Formaten. Es läuft kein Text aus dem Bild, die Story-Safe-Zone wird eingehalten.
2. Das exportierte PNG hat exakt die Formatgröße und entspricht 1:1 der Vorschau.
3. Gezeichnet werden nur Assets aus dem Manifest bzw. eigene Uploads, keine erfundenen Grafiken.
4. In keinem Export steht „Neighbour“. Das Logo ist unverzerrt und hat Mindestabstand.
5. Auf einem 390px-Handy ist alles bedienbar, Teilen per Share-Sheet funktioniert.
6. `tsc --noEmit` läuft fehlerfrei, die Konsole bleibt sauber (keine CORS- oder 404-Fehler).
7. Außer React und `lucide-react` gibt es keine Abhängigkeiten.

Zeig am Ende eine kurze Galerie: jede Vorlage einmal im Format `post` mit den echten Beispieldaten.
