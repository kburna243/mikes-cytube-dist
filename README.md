# Federführer

Ein lokales Schreib- und Weltbau-Studio als PWA (Tablet und Desktop).

> **Ausbau zum Graphic-Novel-Studio:** Auftrag und Anforderungen stehen in [`ARENA-PROMPT-GRAPHIC-NOVEL.md`](ARENA-PROMPT-GRAPHIC-NOVEL.md).

## Lokal starten

### Voraussetzungen

- Node.js 22+
- PostgreSQL 16 (oder Docker)

### Mit Docker (empfohlen)

```bash
# 1. Docker Compose starten
docker compose -f docker-compose.example.yml up -d

# 2. Datenbank migrieren
docker compose -f docker-compose.example.yml exec app npm run db:migrate

# 3. Beispiel-Daten laden (optional)
docker compose -f docker-compose.example.yml exec app npm run db:seed

# 4. Nutzer anlegen
docker compose -f docker-compose.example.yml exec app npm run user:create

# 5. App öffnen
# http://localhost:3055
```

### Ohne Docker

```bash
# 1. Dependencies installieren
npm install --legacy-peer-deps

# 2. PostgreSQL starten und Datenbank erstellen
createdb federfuehrer

# 3. .env Datei erstellen
cp .env.example .env
# DATABASE_URL und SESSION_SECRET in .env anpassen

# 4. Datenbank migrieren
npm run db:migrate

# 5. Beispiel-Daten laden (optional)
npm run db:seed

# 6. Nutzer anlegen
npm run user:create

# 7. Dev-Server starten
npm run dev

# 8. App öffnen
# http://localhost:3000
```

## Skripte

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Dev-Server starten |
| `npm run build` | Production-Build erstellen |
| `npm start` | Production-Server starten |
| `npm test` | Tests ausführen (Vitest) |
| `npm run db:generate` | Drizzle-Migrationen generieren |
| `npm run db:migrate` | Datenbank migrieren |
| `npm run db:seed` | Beispiel-Daten laden |
| `npm run user:create` | Neuen Nutzer anlegen |

## Was ist echt

- **Echter Login**: Benutzername + Passwort mit bcrypt, Session-Cookie, Sperre nach 5 Fehlversuchen
- **PostgreSQL**: Alle Daten in PostgreSQL über Drizzle ORM, keine In-Memory-Fallbacks
- **Owner-Isolation**: Jede DB-Abfrage filtert auf `owner_id` – Nutzer sehen nur ihre eigenen Daten
- **Soft-Delete**: Kapitel, Charaktere, Orte, Fakten können in die Schublade gelegt und zurückgeholt werden
- **Zeitmaschine**: Snapshots von Kapiteln erstellen und zurückholen
- **Sync-Konflikt**: Neuere Server-Fassung wird nie überschrieben (409 Conflict)
- **CSP**: Kein `unsafe-eval`, keine externen Fonts, keine Google-Dienste
- **Fail-closed**: OmniRoute (KI) und ASR (Spracherkennung) sind deaktiviert wenn nicht konfiguriert
- **Docker**: Multi-Stage Build, läuft nicht als root, mit ffmpeg für Spracherkennung

## Was ist offen

- **Proposals**: KI-Vorschläge werden derzeit nicht persistiert (nur In-Memory)
- **Buch-Vorschau**: Export als EPUB/PDF noch nicht implementiert
- **Offline-Sync**: IndexedDB-Cache existiert, aber automatische Sync-Logik noch nicht vollständig
- **Mehrsprachigkeit**: UI nur auf Deutsch
- **Mobile-Optimierung**: PWA-Manifest vorhanden, aber Touch-Gesten noch nicht optimiert

## Datenschutz

### Diktat über Google

Die Web Speech API für live-Diktat läuft über Google. Das wird der Nutzerin einmalig erklärt. Manuskripte verlassen den Server sonst nur über OmniRoute/Bailian.

### Sprachnotizen auf dem eigenen Server

Audio-Dateien für Sprachnotizen werden auf dem eigenen Server gespeichert (`/data/ideen` Volume). Die Transkription läuft über den konfigurierten ASR-Dienst (z.B. qwen-audio-3.0-asr-flash über OmniRoute). Ohne Konfiguration ist die Spracherkennung deaktiviert (fail-closed).

### KI über OmniRoute

KI-Funktionen (Co-Pilot, Konsistenzprüfung, etc.) laufen über OmniRoute auf dem eigenen Server. Die Manuskripte verlassen nur den Server, wenn OmniRoute konfiguriert ist. Ohne Konfiguration sind alle KI-Funktionen deaktiviert (fail-closed).

### Keine externen Laufzeit-Ressourcen

- Schriften liegen lokal unter `public/fonts`
- Keine CDNs, keine Google Fonts
- CSP ohne `unsafe-eval` und ohne Fremdquellen

## Tests

```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Modus
npm run test:watch
```

**Testabdeckung:**
- Auth: Passwort-Hashing, Login, Sperre, Sessions (9 Tests)
- Repo: Persistenz, Owner-Isolation, Soft-Delete, Zeitmaschine, Settings (8 Tests)
- Core: Schublade, Snapshots, Sync-Konflikt, Thesaurus, Upload-Grenzen, ASR, Buch-Vorschau (13 Tests)

**Insgesamt: 30 Tests, alle grün**

## Docker-Betrieb

### Image bauen

```bash
docker build -t federfuehrer:latest .
```

### Stack starten

```bash
docker compose up -d
```

### Healthcheck

```bash
curl http://localhost:3055/api/health
```

### Logs

```bash
docker compose logs -f app
```

## Architektur

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express 4 + TypeScript
- **Datenbank**: PostgreSQL 16 + Drizzle ORM
- **Auth**: bcrypt + Session-Cookie (HttpOnly, Secure, SameSite=Lax)
- **KI**: OmniRoute (OpenAI-kompatibel)
- **Spracherkennung**: ASR über OmniRoute oder externer Dienst
- **PWA**: Service Worker + IndexedDB für Offline-Cache

## Lizenz

Alle Rechte vorbehalten. Die Nutzung ist nur nach Absprache mit Friedrich Börner (Dehl und Börner Systems GbR) erlaubt.
