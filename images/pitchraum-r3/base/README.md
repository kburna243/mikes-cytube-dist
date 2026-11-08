# Pitchraum — Design-Runde 2 (Arbeitstitel, Demo)

Eine full-stack Demo für Komponistinnen, Komponisten und Producer, die Musik an Film und
Fernsehen lizenzieren. Öffentliche Website, verdrahtete App, öffentlicher Empfängerlink und
fünf eigenständige Künstlerseiten.

**Der Ausgangsstand** wurde aus `pitchraum-r2/base` geladen: 58/58 Dateien, alle SHA256-
Prüfsummen aus `manifest.json` geprüft. Andere Ordner des Repos wurden nicht gelesen.

---

## Startbefehle

```bash
npm install

# Website bauen (gehashte Assets, kein Singlefile)
npm run build

# Demo-Server kompilieren und starten
npx esbuild server/src/index.ts --bundle --platform=node --format=esm \
  --outfile=server/dist/index.js --external:express
node server/dist/index.js          # http://localhost:3000

# Tests (echte HTTP-Aufrufe plus Render-Smoke)
npx vitest run
```

Der Express-Server liefert `dist/` inklusive API aus. Ohne Server zeigt die Demo echte
Fehlerzustände — niemals Fantasiedaten als Ersatz.

## Routen

| Route | Inhalt |
| --- | --- |
| `/` | Montage: Szene → Schnitt → Link → Akte → Fünf Gesichter → Abspann |
| `/so-funktioniert-es` | Ablauf, Grenzen, technische Machart |
| `/preise` | geplante Preise, keine Kaufmöglichkeit |
| `/fragen` | ehrliche Antworten inkl. „Was es nicht tut“ |
| `/impressum`, `/datenschutz` | nur sichtbarer Platzhalter „Rechtstext folgt vor Veröffentlichung“ |
| `/demo` | verdrahtete App (Cookie-Arbeitsbereich) |
| `/l/:token` | öffentlicher Vorführraum, nur Tracks dieses Links |
| `/k/aya-dornbusch` | Plakat |
| `/k/bendix-halvar` | Leinwand |
| `/k/maroa-quell` | Archiv |
| `/k/ilva-sund` | Atelier |
| `/k/karo-reimann` | Raster |

## API

| Methode | Pfad | Zweck |
| --- | --- | --- |
| POST | `/api/demo-workspaces` | Arbeitsbereich + HttpOnly-Cookie (`randomBytes(16)`, SameSite=Lax, Secure in Produktion) |
| GET | `/api/state` | Komponistenstand aus Cookie |
| POST | `/api/workspace/reset` | Fantasiedaten neu, alte Tokens ungültig |
| POST | `/api/pitch-links` | Link anlegen (geprüft, eigenes `randomBytes(16)`-Token) |
| POST | `/api/inquiries/:id/stage` | Pipeline-Status |
| PATCH | `/api/tracks/:id/rights` | ISRC/Werknummer/Notiz, leer bleibt leer |
| POST | `/api/tracks/:id/splits` | Anteil 0–100 |
| POST | `/api/tracks/:id/contracts` | nur Dateiname, als Demo gekennzeichnet |
| PUT | `/api/meine-seite` | Markenpaket + Gestalt, geprüft |
| GET | `/api/l/:token` | öffentlicher Link, erfasst „geöffnet“; ungültig → 404 |
| POST | `/api/l/:token/listened` | erfasst Wiedergabe |
| POST | `/api/l/:token/inquiries` | Anfrage nur im richtigen Arbeitsbereich |
| GET | `/api/l/:token/audio/:trackId` | echte Demo-Datei, sonst 404 |

Der öffentliche Payload enthält **ausschließlich** Infoblatt-Felder. Rechte-Akten werden
serverseitig auf `rightsStatus` + `personName`/`role`/`sharePercent` reduziert; Dateinamen,
Notizen, ISRC-/Werknummern und Verträge bleiben im Arbeitsbereich. Dafür gibt es einen Test.
Sicherheitsregeln aus Runde 1 bleiben: Cookie-Trennung, 100 kB Body-Limit, IP-Limit,
Token-404, Header. CSP jetzt mit `script-src 'self'` (kein `unsafe-inline` für Skripte).

## Gestaltung

- **Schriften:** `@fontsource-variable/anybody` (wght + wdth), `instrument-sans`,
  `martian-mono`; alle Version 5.3.0, **OFL-1.1**, lokal gebündelt. Künstlerseiten laden
  ihre Markenschriften erst sichtbar nach. `gsap` war nicht nötig und ist nicht installiert.
- **Farbe:** Kinoschwarz `#08090A`, warmes Weiß `#F2ECE1`, genau eine Akzentfarbe,
  abgeleitet aus dem laufenden Track (sage / copper / signalrot). Künstlerseiten nutzen nur
  ihre `--brand-*`- und `--font-family-*`-Werte, inklusive der Shader-Grundfarben.
- **Szene:** eigener WebGL2-Fragment-Shader (Regen, Glasrefraktion, Stadtbokeh, Nebel,
  Scheinwerfer, Filmkorn). Pausiert unsichtbar und im Hintergrund-Tab; Auflösung sinkt
  automatisch unter 42 fps (bis 0,56×). Ohne WebGL2 gibt es eine gestaltete CSS-Regenfläche.
- **Klang:** drei eigene Web-Audio-Skizzen (ruhig/treibend/bedrohlich). Jeder weitere Track
  erhält eine aus Tempo, Stimmung und Tonart abgeleitete Skizze. Ein `AnalyserNode` speist
  Shader, Wellenformen und die Variable-Font-Achsen der Headline.
- **Bewegung:** CSS Scroll-driven Animations, View Transitions API, WAAPI-nahe CSS-Übergänge,
  `requestAnimationFrame` für Achsen/Signal. Kein Scrolljacking.
- **Reduzierte Bewegung:** Schriften/Achsen statisch, Shader ein Einzelbild, Timecode steht,
  Scroll-Animationen aus; alle Inhalte und Funktionen bleiben.

## Testergebnis

```
✓ tests/pitchraum.test.ts (17)
✓ tests/render.test.tsx    (3)
✓ tests/contrast.test.ts   (7)
Test Files 3 passed | Tests 27 passed
```

Abgedeckt u. a.: A/B-Isolation lesen/ändern, ungültige Tokens 404, Link nur mit eigenen
Tracks, Anfrage im richtigen Bereich, Eingabevalidierung, 413, Header/Cookie, kompletter
Abnahmeablauf, öffentlicher Payload ohne Aktenfelder, Kontrast, Render aller fünf
Künstlerseiten und des Vorführraums. Zusätzlich manuell per HTTP geprüft: alle Routen 200,
gehashte Assets 200, CSP, Audio-Endpunkt 200 mit Datei / 404 ohne.

## Build-Größe (gemessen)

- `dist/` gesamt: **1,2 MB** (46 Asset-Dateien, 19 Fontdateien, davon viele erst lazy)
- JS: **391,5 kB** roh, **113,13 kB** gzip
- CSS: **100,6 kB** roh, **22,26 kB** gzip
- kein `vite-plugin-singlefile`, JS/CSS/Fonts gehasht

## Bildrate (ehrlich)

Im Sandbox stand **kein Browser/GPU** zur Verfügung, deshalb gibt es **keinen gemessenen
FPS-Wert**. Die Szene schreibt ihren gleitenden fps-Wert sichtbar in die Bildunterschrift und
als `data-fps`/`data-scale` ans DOM. Die automatische Qualitätsregel senkt die Auflösung ab
zwei Sekunden unter 42 fps schrittweise; Ziel ist flüssig auf einem normalen Laptop.

## Drei gestalterische Entscheidungen

1. **Ein Analyser regiert alles.** Derselbe Klang treibt Shader, Wellenform und die
   Achsen von „Dasselbe Bild. Drei Filme.“ — der Trackwechsel ist keine Farbauswahl,
   sondern ein Schnitt.
2. **Montage statt Abschnittsstapel.** Der Regen wird beim Scrollen zum Filmstreifen und
   zum Empfängerfenster; Status wandern sichtbar vom Link zum Komponisten. Natives Scrollen.
3. **Fünf Gestalten sind fünf Verhalten.** Plakat atmet, Archiv rechnet und filtert per
   Tastatur, Atelier schweigt, Leinwand projiziert einen Track-Shader, Raster öffnet Kacheln
   mit View Transition. Cover entstehen aus Trackdaten (Spektrogramm/Welle/Rauschen).

## Ehrlich: Attrappe / nicht getestet

- **Klangskizzen sind Synthese**, keine Aufnahmen. Sie ersetzen die frühere „nicht
  verfügbar“-Meldung. Echte Dateien aus `demo-assets/audio/` werden ausgeliefert, wenn
  vorhanden; der Browser-Dateipfad ist ohne echte Datei nur serverseitig getestet.
- **Kein Upload, keine E-Mail, keine KI.** Unterlagen speichern nur den Dateinamen.
- **Der Link-Abschnitt auf der Website ist ein lokaler Beispielablauf.** Nur `/l/:token`
  und die App sind mit dem Server verdrahtet.
- **„Meine Seite“ ist nur in der App sichtbar**, keine öffentliche Adresse.
- **Speicher flüchtig:** Neustart löscht alles; zusätzlich 24 h TTL und max. 500 Bereiche.
- **Kein echtes Browser-/Gerätetesting** in dieser Umgebung: 375-px-Layout, Tastaturfluss,
  Reduced Motion, WebGL-Rückfall und Audio-Rückfall sind implementiert und getestet soweit
  ohne Browser möglich, aber nicht visuell auf Hardware abgenommen.
- **FPS nicht gemessen** (kein Browser/GPU im Sandbox).
- **Impressum/Datenschutz** sind Platzhalter, keine Rechtstexte; Preise geplant, kein Kauf.
- **Alle Personen, Werke, Produktionen sind erfunden.** Keine Kundenstimmen, Logos, Zahlen
  oder Auszeichnungen. Rechtestatus immer „Eigenangabe, ungeprüft“.
- CSP erlaubt weiterhin Inline-**Stile** (Markenpakete als CSS-Variablen), aber keine
  Inline-Skripte.
