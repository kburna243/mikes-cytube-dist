# Deploy: servermitte → https://servermitte.tailecbf0f.ts.net/noizy

Läuft als zwei Container in `/volume1/docker/noizy/` (Compose), hinter `caddy_dubs-caddy_1` (Block `@noizy` in `/volume1/docker/caddy/Caddyfile`, Backup `Caddyfile.bak-vor-noizy-20261104`). Öffentlich über Tailscale Funnel.

- `noizy-web` – Next.js standalone, basePath `/noizy`, im Netz `db-net` für Caddy
- `noizy-db` – Postgres 16, Volume `noizy_noizy_db`, Schema aus `sql/` beim ersten Start
- Zugangsdaten: `/volume1/docker/noizy/.env` (chmod 600, nicht im Repo)

## Admin (`/noizy/admin`)

Martin pflegt dort Diggin' Gems (Foto/Video-Upload direkt vom Handy) und Termine.

- Aktivieren: `ADMIN_PASSWORD=…` (mind. 8 Zeichen) in `/volume1/docker/noizy/.env`, dann `docker-compose up -d`. Ohne Variable ist der Admin aus.
- Passwort ändern = alle Sitzungen abgemeldet.
- Uploads liegen im Volume `noizy_uploads` (`/app/data/uploads`), ffmpeg ist im Image.
- Tabellen `gems` und `tour_dates.note_en` legt die App beim ersten Aufruf selbst an (`sql/0001_gems_admin.sql` nur für frische Installationen). Leere Tabellen werden einmalig aus `src/lib/data.ts` befüllt.

## Neue Version ausrollen

```bash
docker build --build-arg BASE_PATH=/noizy -t noizy-web:1.0.1 .
docker save noizy-web:1.0.1 | ssh servermitte /usr/local/bin/docker load
# Tag in docker-compose.yml auf dem Server anpassen, dann:
ssh servermitte "cd /volume1/docker/noizy && /usr/local/bin/docker-compose up -d"
```

Lokal ohne Unterpfad entwickeln: `npm run dev` (BASE_PATH leer lassen).
