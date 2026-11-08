# Pitchraum — eigenständige Produkt-Demo (Arbeitstitel)

Demo für unabhängige Komponistinnen, Komponisten und Producer, die Musik an Film und
Fernsehen lizenzieren. Bestandteile: öffentliche Website, verdrahtete App (Express-Server,
In-Memory-Arbeitsbereiche) und Künstlerseiten (Markenpaket × Gestalt × Inhalt).

Ausgangscode der App-Oberflächen: Ordner `pitch-demo` aus
`github.com/kburna243/mikes-cytube-dist` (per `manifest.json` geladen und per SHA256 geprüft).
Aufbau, Sprache und Bedienung wurden übernommen; `mockApi.ts` wurde durch die Schicht
`PitchApi` / `httpPitchApi` ersetzt.

## Startbefehle

```bash
npm install                                            # Abhängigkeiten
npm run build                                          # Website nach dist/index.html bauen
npx esbuild server/src/index.ts --bundle --platform=node --format=esm \
  --outfile=server/dist/index.js --external:express    # Server kompilieren
node server/dist/index.js                              # Start: http://localhost:3000
npx vitest run                                         # Tests (echte HTTP-Aufrufe)
```

Der Server liefert die gebaute Website selbst aus (`dist/index.html` für alle Nicht-API-GET-Routen).
Ohne laufenden Server zeigt die Website eine echte Fehlermeldung statt Fantasiedaten.

## Seiten (Routen)

**Website:** `/` · `/so-funktioniert-es` · `/preise` · `/fragen` · `/impressum` · `/datenschutz`
**App:** `/demo` (braucht das Arbeitsbereich-Cookie)
**Empfängerlink:** `/l/:token` (öffentlich, ohne Cookie, nur die Tracks des Links)
**Künstlerseiten:** `/k/aya-dornbusch` (Plakat) · `/k/bendix-halvar` (Leinwand) · `/k/maroa-quell` (Archiv)

## API-Endpunkte

| Methode | Pfad | Zweck |
| --- | --- | --- |
| POST | `/api/demo-workspaces` | Neuer Demo-Arbeitsbereich, setzt HttpOnly-Cookie (`crypto.randomBytes(16)`, SameSite=Lax, Secure im Produktivbetrieb) |
| GET | `/api/state` | Stand des Arbeitsbereichs (nur aus Cookie); 401 ohne gültigen Bereich |
| POST | `/api/workspace/reset` | Fantasiedaten neu anlegen, alte Link-Tokens ungültig |
| POST | `/api/pitch-links` | Link anlegen (Pflichtfelder/Typen/Längen geprüft; Zufallstoken je Link) |
| POST | `/api/inquiries/:id/stage` | Status einer Anfrage setzen (nur erlaubte Stufen) |
| PATCH | `/api/tracks/:id/rights` | ISRC/Werknummer/Notiz (leer bleibt leer, nichts wird erzeugt) |
| POST | `/api/tracks/:id/splits` | Anteil ergänzen (0–100 geprüft) |
| POST | `/api/tracks/:id/contracts` | Unterlage: nur Dateiname gespeichert (als Demo gekennzeichnet) |
| PUT | `/api/meine-seite` | Einstellungen „Meine Seite“ (Gestalt, Markenpaket, geprüft) |
| GET | `/api/l/:token` | Öffentlicher Link (zählt „Geöffnet“); 404 mit verständlicher Seite bei ungültigem Token |
| POST | `/api/l/:token/listened` | Abspielen erfassen |
| POST | `/api/l/:token/inquiries` | Anfrage über den Link (erscheint nur im richtigen Arbeitsbereich) |
| GET | `/api/l/:token/audio/:trackId` | Hörprobe aus `demo-assets/audio/`, sonst 404 |

Schutz: Körpergröße ≤ 100 kB, einfache IP-Begrenzung für Anlegen und Anfragen,
Sicherheits-Header (CSP, X-Frame-Options, nosniff u. a.). Arbeitsbereiche nur im Speicher,
max. 500, Löschung nach 24 Stunden. Arbeitsbereich immer aus dem Cookie, nie aus Anfragedaten.

## Was hier bewusst noch Attrappe ist

- **Kein Datei-Upload, keine echten Audiodateien:** Unterlagen speichern nur den Dateinamen;
  der Player zeigt „Hörprobe in der Demo nicht verfügbar“, bis jemand real eine Datei nach
  `demo-assets/audio/<Track-ID>.mp3` legt.
- **Kein E-Mail-Versand:** Links müssen selbst kopiert und verschickt werden.
  „Gespräch anfragen“ bleibt ausgeblendet, solange `CONTACT_EMAIL` leer ist.
- **Keine Konten/Anmeldung:** Identität = HttpOnly-Cookie, das nach 24 h verfällt;
  es gibt keine Passwörter, keine Wiederherstellung.
- **Datenhaltung flüchtig:** Neustart/Wiederanlauf des Servers löscht ohnehin alles.
- **„Meine Seite“ ist nur in der App sichtbar**, keine öffentliche Adresse für Besucher.
- **Künstlerseiten-Beispiele sind statische fiktive Inhalte**, nicht aus Arbeitsbereichen.
- **CSP erlaubt Inline-Skripte/-Stile**, weil die Demo als eine einzelne eingebettete
  HTML-Datei gebaut wird (vite-plugin-singlefile).
- **Keine Käufe/Buchungen/Warteliste** — Preise sind als „geplant“ gekennzeichnet.
- Impressum/Datenschutz enthalten absichtlich nur den Platzhalter „Rechtstext folgt vor
  Veröffentlichung".
