# Federführer

Ein lokales Schreib-, Weltbau- und Graphic-Novel-Studio als PWA (Tablet und Desktop).

> **Ausbau zum Graphic-Novel-Studio:** Auftrag und Anforderungen stehen in [`docs/prompts/ARENA-PROMPT-GRAPHIC-NOVEL.md`](docs/prompts/ARENA-PROMPT-GRAPHIC-NOVEL.md).

## Lokal starten

### Voraussetzungen

- Node.js 22+
- PostgreSQL 16 (oder Docker; in der lokalen Entwicklung greift ohne `DATABASE_URL` automatisch ein PGlite-Fallback mit deutlicher Log-Warnung)

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
npm install

# 2. PostgreSQL starten und Datenbank erstellen
createdb federfuehrer

# 3. .env Datei erstellen
cp .env.example .env
# DATABASE_URL, SESSION_SECRET und WATERMARK_SECRET in .env anpassen

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
| `npm run dev` | Dev-Server starten (Port 3000) |
| `npm run build` | Production-Build erstellen |
| `npm start` | Production-Server starten (`node server.ts`) |
| `npm test` | Tests ausführen (Vitest) |
| `npm run db:generate` | Drizzle-Migrationen generieren |
| `npm run db:migrate` | Datenbank migrieren |
| `npm run db:seed` | Beispiel-Daten laden |
| `npm run user:create` | Neuen Nutzer anlegen |

---

## Graphic Novel

Federführer erweitert das bestehende Schreib- und Weltenbuch-Studio um das komplette Backend, Datenmodell (`drizzle/migrations/0003_graphic_novel.sql`) und eine deutsche Test-Oberfläche (Reiter **„Comic & Schutz“**, Touch-Ziele ≥ 48 px) für Graphic Novels und Comics.

### Neue Abhängigkeiten (Begründung)

- **`sharp`**: Serverseitige Bildverarbeitung für sRGB-Konvertierung, Entfernen von EXIF/GPS-Metadaten in den abgeleiteten Varianten (`thumbnail`, `preview`, `print`), Pixelzugriff für das 8×8-DCT-Wasserzeichen sowie das serverseitige Rendern der Comic-Seiten.
- **`pdf-lib`**: Erzeugung druckfertiger PDF-Dokumente mit exakten Seitenmaßen in Punkt/Millimeter, 3 mm Anschnitt (Bleed) und Schnittmarken (Crop Marks) ohne externe Systemabhängigkeiten.
- **`jszip`**: Verpacken gerenderter Comic-Seiten und `ComicInfo.xml`-Metadaten in standardkonforme CBZ-Archive (`.cbz`).

### 1. Bildbibliothek (`lib/assets/`)

- **Unterstützte Formate**: PNG, JPEG, WebP, AVIF, TIFF, SVG, PSD und KRA (eingebettetes Composite-Vorschaubild).
- **Magic-Byte-Prüfung**: Dateitypen werden ausschließlich anhand ihrer binären Signatur (`lib/assets/magicBytes.ts`) erkannt – niemals über die Dateiendung. Umbenannte Fremddateien werden mit HTTP 400 abgelehnt.
- **SVG-Bereinigung**: Serverseitiges Entfernen von `<script>`, `<foreignObject>`, `<iframe>`, sämtlichen `on*`-Ereignisattributen, `javascript:`-URLs sowie externen `href`/`xlink:href`-Verweisen (`lib/assets/svgSanitizer.ts`).
- **Unveränderte Originale & sRGB-Varianten**: Originale liegen unangetastet unter `ASSETS_DIR`. `sharp` erzeugt automatisch drei Varianten (`thumbnail`, `preview`, `print`) in `sRGB` ohne EXIF-/GPS-Daten.
- **Dubletten & Verknüpfungen**: SHA-256-Hash erkennt doppelte Uploads derselben Nutzerin (`duplicate: true`) und vermeidet doppelte Speicherung. Jedes Asset kann mit vorhandenen Figuren (`characters`), Orten (`locations`) und Szenen (`scenes`) verknüpft werden.

### 2. Comic-Seiten (`lib/comic/`)

- **Tabellen**: `comic_pages`, `panels`, `panel_images`, `balloons` sowie `proposals` (alle mit `owner_id` und strikter Mandantentrennung).
- **Seitenformate & DPI**:
  - `US-Comic`: 168,275 × 257,175 mm (300 DPI: 1988 × 3037 px | 600 DPI: 3975 × 6075 px)
  - `A4`: 210 × 297 mm (300 DPI: 2480 × 3508 px | 600 DPI: 4961 × 7016 px)
  - `B5`: 176 × 250 mm (300 DPI: 2079 × 2953 px | 600 DPI: 4157 × 5906 px)
  - `Webtoon`: 69 × 1000 mm (300 DPI: 815 × 11811 px | 600 DPI: 1630 × 23622 px)
- **Serverseitige Panel-Vorlagen**: `2x3` (6 Panels), `3x3` (9 Panels) und `splash` (1 ganzseitiges Panel) werden als normierte Polygone (`[{x, y}, ...]`) erzeugt.
- **Skript-Brücke**: `POST /api/v1/comic/script-bridge` zerlegt Kapitel- oder Szenentext in Vorschläge für Panelbeschreibungen und Dialoge und speichert sie als `pending` in `/api/v1/assistant/proposals`. Vorschläge werden niemals automatisch übernommen.
- **Serverseitiger Export**: Rendert Panels, beschnittene/transformierte Assets und Sprechblasen (Sprechen, Denken, Schreien, Erzählkasten, Soundeffekt) serverseitig mit `sharp` und exportiert als **PDF** (inkl. 3 mm Anschnitt und Schnittmarken), **CBZ**, **PNG** oder **EPUB**.

---

### API-Übersicht der neuen Routen (alle hinter `requireUser`)

#### Bildbibliothek (`/api/v1/assets`)

- **`POST /api/v1/assets`** (`multipart/form-data`, Feld `file`, bis `MAX_ASSET_BYTES`)
  ```json
  // Form-Felder: file (Binärdatei), projectId, title, tags: ["heldin","szene1"], characterIds: [], locationIds: [], sceneIds: []
  // Antwort (201 Created oder 200 OK bei SHA-256-Dublette):
  {
    "duplicate": false,
    "asset": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "ownerId": "d0000000-0000-4000-8000-000000000001",
      "title": "Kaelen Charakterblatt",
      "mimeType": "image/png",
      "byteSize": 284910,
      "sha256": "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      "width": 2048,
      "height": 2048,
      "colorSpace": "srgb",
      "tags": ["heldin", "szene1"],
      "characterIds": [],
      "locationIds": [],
      "sceneIds": []
    }
  }
  ```

- **`GET /api/v1/assets?tag=heldin&characterId=...&from=2025-01-01&to=2025-12-31`**
  ```json
  { "assets": [ /* Array von Asset-Objekten der angemeldeten Nutzerin */ ] }
  ```

- **`GET /api/v1/assets/:id/:variante`** (`:variante` = `original` | `thumbnail` | `preview` | `print`)
  Liefert den Binärstrom des Bildes (`image/webp` bzw. `image/png` bei `print`).

- **`PATCH /api/v1/assets/:id`**
  ```json
  // Request:
  {
    "title": "Kaelen Charakterblatt v2",
    "tags": ["heldin", "koloriert"],
    "characterIds": ["c1111111-1111-4111-8111-111111111111"]
  }
  ```

- **`DELETE /api/v1/assets/:id`**
  Legt das Asset per Soft-Delete (`deleted_at`) in die Schublade (`{ "success": true }`).

#### Comic-Seiten (`/api/v1/comic/...`)

- **`GET /api/v1/comic/formats`**
  Liefert Formate (`US-Comic`, `A4`, `B5`, `Webtoon`), Umrechnungstabellen für 300/600 DPI und Polygon-Vorlagen (`2x3`, `3x3`, `splash`).

- **`POST /api/v1/comic/pages`**
  ```json
  // Request:
  {
    "projectId": "7f9c2b10-0000-4000-8000-000000000001",
    "chapterId": "8a1d3c20-0000-4000-8000-000000000002",
    "title": "Seite 1 – Hafen im Nebel",
    "format": "A4",
    "dpi": 300,
    "bleedMm": 3,
    "template": "2x3"
  }
  // Antwort (201 Created): Vollständige Seite inkl. erzeugter Polygon-Panels, Panel-Bilder und Sprechblasen
  ```

- **`GET /api/v1/comic/pages?projectId=...&chapterId=...`** / **`GET /api/v1/comic/pages/:id`** / **`PATCH /api/v1/comic/pages/:id`** / **`DELETE /api/v1/comic/pages/:id`**
- **`POST /api/v1/comic/pages/:id/apply-template`** (`{ "template": "3x3" }`)
- **`POST /api/v1/comic/panels`** / **`PATCH /api/v1/comic/panels/:id`** / **`DELETE /api/v1/comic/panels/:id`**
  ```json
  {
    "pageId": "9b2e4d30-0000-4000-8000-000000000003",
    "polygon": [{ "x": 0.05, "y": 0.05 }, { "x": 0.95, "y": 0.05 }, { "x": 0.95, "y": 0.48 }, { "x": 0.05, "y": 0.48 }],
    "borderWidth": 3,
    "zIndex": 1,
    "altText": "Totale des verschneiten Hafens bei Nacht"
  }
  ```
- **`POST /api/v1/comic/panel-images`** / **`PATCH /api/v1/comic/panel-images/:id`** / **`DELETE /api/v1/comic/panel-images/:id`**
  ```json
  {
    "panelId": "1c3f5e40-0000-4000-8000-000000000004",
    "assetId": "550e8400-e29b-41d4-a716-446655440000",
    "offsetX": 0,
    "offsetY": 0,
    "scaleX": 1.0,
    "scaleY": 1.0,
    "rotationDeg": 0,
    "cropX": 0,
    "cropY": 0,
    "cropWidth": 1,
    "cropHeight": 1
  }
  ```
- **`POST /api/v1/comic/balloons`** / **`PATCH /api/v1/comic/balloons/:id`** / **`DELETE /api/v1/comic/balloons/:id`**
  ```json
  {
    "pageId": "9b2e4d30-0000-4000-8000-000000000003",
    "panelId": "1c3f5e40-0000-4000-8000-000000000004",
    "balloonType": "speech",
    "text": "Wir legen vor Morgengrauen ab!",
    "x": 0.5,
    "y": 0.22,
    "width": 0.36,
    "height": 0.14,
    "tailX": 0.45,
    "tailY": 0.42,
    "readingOrder": 1
  }
  ```
- **`POST /api/v1/comic/script-bridge`**
  ```json
  // Request:
  {
    "projectId": "7f9c2b10-0000-4000-8000-000000000001",
    "chapterId": "8a1d3c20-0000-4000-8000-000000000002",
    "pageId": "9b2e4d30-0000-4000-8000-000000000003"
  }
  // Antwort (201 Created):
  {
    "usedAi": false,
    "proposals": [
      {
        "id": "a0112233-4455-4666-8777-8899aabbccdd",
        "entityType": "comic_script",
        "title": "Panel 1: Dichter Nebel zieht über das Hafenbecken...",
        "status": "pending"
      }
    ]
  }
  ```
- **`POST /api/v1/comic/export`**
  ```json
  // Request:
  {
    "pageIds": ["9b2e4d30-0000-4000-8000-000000000003"],
    "format": "pdf",
    "dpi": 300,
    "bleedMm": 3,
    "cropMarks": true,
    "creator": "Name der Illustratorin",
    "copyrightNotice": "© 2025 Alle Rechte vorbehalten",
    "applyInvisibleWatermark": true,
    "visibleWatermark": {
      "enabled": true,
      "text": "© Muster-Illustratorin",
      "opacity": 0.25,
      "tiled": true
    }
  }
  // Antwort: Binärdatei (application/pdf, application/vnd.comicbook+zip oder image/png)
  ```

#### Schutz der Kunstwerke (`/api/v1/protect/...`)

- **`POST /api/v1/protect/verify`** (`multipart/form-data`, Feld `file`)
  ```json
  // Antwort:
  {
    "watermark": {
      "found": true,
      "signatureValid": true,
      "ownerShortId": "aaaaaaaa11114111",
      "assetId": "550e8400-e29b-41d4-a716-446655440000",
      "timestampSec": 1730000000,
      "confidence": 0.96
    },
    "matchedAsset": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Kaelen Charakterblatt",
      "originalFilename": "kaelen.png"
    },
    "uploadedPHash": "a3f190bc4412e871",
    "nearestFingerprint": {
      "distance": 0,
      "fingerprint": { "pHash": "a3f190bc4412e871", "exportFormat": "png" }
    }
  }
  ```
- **`POST /api/v1/protect/scrambler`**
  ```json
  // Request:
  { "assetId": "550e8400-e29b-41d4-a716-446655440000", "strength": "mittel" }
  // Antwort ohne konfigurierten Worker (503 Service Unavailable):
  { "detail": "Schutzschicht gerade nicht verfügbar" }
  ```
- **`GET /api/v1/protect/jobs`** & **`GET /api/v1/protect/fingerprints`**

---

## Schutz der Kunstwerke – was es kann und was nicht

**Grundsatz:** Kein technisches Verfahren macht Bilder garantiert unlesbar für KI-Systeme. Federführer zeigt oder verspricht niemals ungemessene Schutzwirkungen und gibt niemals Zufalls- oder Sinusmuster als vermeintlichen KI-Schutz aus.

### Was umgesetzt ist und was es leistet

1. **Sichtbares Wasserzeichen (`lib/protect/visibleWatermark.ts`)**:
   - Frei wählbarer Text oder Logo-Overlay, einstellbare Deckkraft (`0.05` bis `1.0`) und Kachelung oder Einzelpositionierung.
   - Wird ausschließlich beim Export angewendet; die Originaldatei unter `ASSETS_DIR` bleibt immer unangetastet.
2. **Unsichtbares Frequenzraum-Wasserzeichen (`lib/protect/invisibleWatermark.ts`)**:
   - Arbeitet im Frequenzraum über eine 2D-DCT in 8×8-Blöcken der Luminanz (Y-Kanal) auf einem normierten 256×256-Referenzraster (1024 Blöcke) mit 5-facher räumlicher Redundanz und Mehrheitsentscheid.
   - Nutzlast (256 Bit): Magic-Header (`FFWM`), 64-Bit-Kurz-ID der Urheberin (`ownerShortId`), 128-Bit-`assetId`, 32-Bit-Unix-Zeitstempel und eine mit `WATERMARK_SECRET` berechnete HMAC-SHA256-Signatur.
   - **Was es übersteht (in Vitest gemessen)**: Verlustfreie Speicherung, JPEG-Kompression mit Qualität 75 sowie Skalierung auf 75 % (auch kombiniert).
   - **Was es nicht übersteht**: Starken Beschnitt (Cropping, der das Seitenverhältnis/Raster verschiebt), starke Rotation, extremes Weichzeichnen oder komplettes Abmalen/Abzeichnen.
3. **Metadaten & Perceptual Hash (`lib/protect/metadata.ts`)**:
   - Bettet standardkonformes XMP/IPTC mit `dc:creator`, `dc:rights`, `plus:DataMining="http://ns.useplus.org/ldf/vocab/DMI-PROHIBITED"` sowie `tdm:reservation="1"` (`Data Mining: Prohibited`) in exportierte Bilder ein.
   - Berechnet bei jedem Export einen 64-Bit-DCT-Perceptual-Hash (`pHash`) und protokolliert ihn in `export_fingerprints`, sodass Kopien auch dann wiedererkannt werden können, wenn Metadaten durch soziale Netzwerke entfernt wurden.
4. **KI-Schutzschicht / Scrambler (`lib/protect/scrambler.ts`)**:
   - Export-Reihenfolge: **Schutzschicht (falls Worker konfiguriert) → unsichtbares Wasserzeichen → sichtbares Wasserzeichen → IPTC/XMP-Metadaten & pHash**.
   - Die Schnittstelle `protect(ownerId, assetId, strength)` verwaltet Jobs in der PostgreSQL-Tabelle `protection_jobs` und delegiert die eigentliche adversariale Optimierung (PGD gegen Vision-Encoder wie CLIP/SigLIP unter Einhaltung einer SSIM-Wahrnehmungsgrenze) an einen externen GPU-Worker unter `SCRAMBLER_WORKER_URL`.
   - Ist `SCRAMBLER_WORKER_URL` nicht gesetzt oder nicht erreichbar, antwortet der Server strikt **fail-closed mit HTTP 503 (`"Schutzschicht gerade nicht verfügbar"`)**.
5. **Kein Bilder-Upload an Sprachmodelle (`lib/llm.ts`, `lib/aiRoutes.ts`)**:
   - Sowohl die Express-Middleware vor `/api/ai/*` als auch `chatCompletion()` in `lib/llm.ts` prüfen eingehende Payloads auf Bilddaten (`data:image/...`, `image_url`, Binär-/Base64-Bildfelder) und lehnen diese sofort mit HTTP 400 ab.

### Spezifikation für den externen Scrambler-Worker (`SCRAMBLER_WORKER_URL`)

Wenn ein externer Python/GPU-Worker unter `SCRAMBLER_WORKER_URL` betrieben wird, ruft Federführer folgenden Endpunkt auf:

- **Endpunkt**: `POST {SCRAMBLER_WORKER_URL}/v1/scramble`
- **Request-Header**: `Content-Type: application/json`, zwingend `X-Scrambler-Signature-256: sha256=<HMAC-SHA256 der exakten JSON-Bytes mit SCRAMBLER_HMAC_SECRET>`, zusätzlich optional `Authorization: Bearer {SCRAMBLER_WORKER_API_KEY}`. Ohne HMAC-Schlüssel wird kein Job angenommen.
- **Request-Body (JSON)**:
  ```json
  {
    "jobId": "660e8400-e29b-41d4-a716-446655440000",
    "assetId": "550e8400-e29b-41d4-a716-446655440000",
    "strength": "leicht | mittel | stark",
    "imageBase64": "<Base64-kodiertes sRGB-PNG>",
    "mimeType": "image/png",
    "constraints": {
      "algorithm": "pgd",
      "minSsim": 0.97
    }
  }
  ```
- **Erwartete Response (200 OK, JSON)**:
  ```json
  {
    "imageBase64": "<Base64-kodiertes geschütztes PNG>",
    "metrics": {
      "ssim": 0.978,
      "clipCosineDistance": 0.412,
      "siglipCosineDistance": 0.389,
      "iterations": 40,
      "model": "clip-vit-b32+siglip-b16"
    }
  }
  ```

---

## Formate & Doppelseiten (Teil A)

Federführer ersetzt feste Seitengrößen durch ein flexibles Format- und Arbeitsflächen-System (`drizzle/migrations/0004_formats_spreads_publish.sql`, `lib/comic/formats.ts`):

1. **Format-System & Benutzerdefinierte Arbeitsfläche (`page_formats`)**:
   - Unterstützt Einheiten `mm`, `in` (Zoll) und `px` (Pixel) bei beliebiger Druckauflösung (DPI), eigenem Anschnitt (`bleed`), Sicherheitsrand (`safe_margin`), Bundsteg (`gutter`) und Ausrichtung (`portrait`, `landscape`, `square`).
   - Zentrale, getestete Umrechnungsfunktion `convertUnit(value, fromUnit, toUnit, dpi)` für `mm ↔ in ↔ px`.
   - **Mitgelieferte Vorlagen**:
     - *Comic*: `US-Comic`, `Manga-B5` (`B5`), `Manga-A5`, `Tankobon`, `Franco-Belgisch` (Album A4+)
     - *Allgemein*: `A3`, `A4`, `A5`, `A6`, `Letter`, `Quadrat-20x20`
     - *Online*: `Webtoon` (800 px breit, Endlos-Höhe), `Instagram-Quadrat` (1080×1080 px), `Instagram-Hoch` (1080×1350 px), `Instagram-Story` (1080×1920 px), `Poster`
     - *POD-Formate*: `Postkarte`, `Sticker`, `T-Shirt`
   - Eigene Formate können über `POST /api/v1/comic/formats` angelegt und als wiederverwendbare Vorlage (`is_custom = true`) gespeichert werden.
2. **Doppelseiten (Spreads)**:
   - Eine Seite kann als Einzelseite oder als Doppelseite (`isSpread: true`) angelegt werden. Eine Doppelseite bildet **eine gemeinsame Arbeitsfläche** mit doppelter Breite und markiertem Bund (`spineSafetyMm`) in der Mitte.
   - Panels, Sprechblasen und freie Grafiken dürfen über den Bund laufen. Liegt Text oder ein Gesicht (`hasFace` / Figuren-Verknüpfung) im einstellbaren Bundbereich, meldet `checkSpineWarnings()` automatisch eine Warnung.
   - Projektweite Leserichtung: links nach rechts (`ltr`) oder rechts nach links (`rtl`, Manga).
   - **PDF-Export**: Wahlweise als **Einzelseiten** (`spreadMode: "einzelseiten"`, teilt die Doppelseite über `splitSpreadPngIntoHalves` exakt in linke und rechte Hälfte, jeweils mit vollständigem Anschnitt auf allen vier Seiten) oder als zusammenhängender **Druckbogen** (`spreadMode: "druckbogen"`).
   - **Storyboard-Ansicht (`GET /api/v1/comic/storyboard`)**: Zeigt Doppelseiten nebeneinander, berücksichtigt Seite 1 als rechte Auftaktseite und markiert verwaiste Einzelseiten (`orphanedSinglePageIds`).
3. **Frei platzierbare Grafiken (`page_elements`)**:
   - Zusätzliche Ebene direkt auf der Seite neben `panel_images`: `image`, `text`, `shape`, `balloon`, `soundeffekt`.
   - Unterstützt Position (`x`, `y` in mm), Größe (`width`, `height`), Drehung (`rotation`), Spiegelung (`flip_x`, `flip_y`), Deckkraft (`opacity`), `z_index`, Sperren (`locked`), Sichtbarkeit (`visible`), Gruppierung (`group_id`) und Masken (`mask_json`).
   - Elemente dürfen frei über Panelränder, über den Bund und bis in den Anschnitt (`x < 0` / `y < 0`) ragen.
   - Aktionen über `/api/v1/comic/pages/:id/elements/batch`: Gruppieren, Ausrichten (`left`, `center`, `right`, `top`, `middle`, `bottom`), Gleichmäßig verteilen (`horizontal`, `vertical`), Reihenfolge ändern und Duplizieren sowie automatisches Einrasten (`snapElementToGuides`) an Seitenrändern, Bund, Anschnitt, Sicherheitsrand, Panelkanten und Raster.

---

## Veröffentlichen & Verkaufen (`lib/publish/`, Teil B)

Alle Veröffentlichungs-, Portfolio- und Merch-Funktionen laufen über das einheitliche `PublishConnector`-Interface (`id`, `kind`, `isConfigured()`, `validate()`, `preview()`, `publish()`, `status()`).

1. **Verbindungs-Architektur & Verschlüsselung (`connector_accounts`, `publications`)**:
   - Zugangsdaten werden mit **AES-256-GCM** über den Umgebungsschlüssel `CONNECTOR_SECRET` verschlüsselt in `connector_accounts` abgelegt. Sie werden niemals geloggt und niemals im Klartext an das Frontend zurückgegeben.
   - Ohne hinterlegte Zugangsdaten wirft kein Connector einen Fehler, sondern meldet sauber:
     ```json
     {
       "status": "nicht_verbunden",
       "message": "Noch nicht verbunden – du kannst das Paket herunterladen und selbst hochladen."
     }
     ```
   - **Unterstützte Connectoren**:
     - Eigene Website: **WordPress** (REST API `/wp-json/wp/v2/posts` & `/media`), **Ghost** (Admin API `/ghost/api/admin/posts/`)
     - Eigener Shop: **Shopify** (Admin API), **WooCommerce** (REST API `/wp-json/wc/v3/products`)
     - Print-on-Demand: **Printful**, **Printify**
     - **Generischer Webhook** (`webhook`): Sendet `POST` mit JSON-Metadaten, Bild-Referenzen und einer **HMAC-SHA256-Signatur** im Header `X-Federfuehrer-Signature-256` (funktioniert sofort ohne Drittanbieter-Konto).
     - **Export-Paket (`export_package`)**: Erzeugt jederzeit ein sofort herunterladbares ZIP-Archiv mit `product.json`, Texten und allen geschützten Bildern.
2. **Pflicht-Schutz-Pipeline & Statisches Portfolio**:
   - Jedes veröffentlichte Bild (in Connectoren, Export-Paketen und im Portfolio-ZIP) durchläuft zwingend `applyExportProtectionPipeline` (unsichtbares 8×8-DCT-Wasserzeichen + IPTC/XMP `"Data Mining: Prohibited"` + optional sichtbares Wasserzeichen).
   - **KI-Textentwurf**: `POST /api/v1/publish/publications/:id/ai-draft` erzeugt aus dem Kapitelkontext (ausschließlich Text, niemals Bilder!) einen Vorschlag für Titel, Beschreibung, Tags und Alt-Text in `/api/v1/assistant/proposals`.
   - **Statisches Portfolio (`POST /api/v1/publish/portfolio/zip`)**: Erzeugt eine fertige, eigenständige HTML+CSS-Website ohne externe CDNs oder Google-Fonts als ZIP zum direkten Hochladen auf eigenen Webspace.
3. **Merch, Freisteller & Shop-Vorbereitung (`merch_products`)**:
   - Produkttypen: **T-Shirt, Poster, Kunstdruck, Postkarte, Sticker, Tasse, Tasche, Notizbuch**.
   - **Freisteller ohne KI (`POST /api/v1/publish/merch/:id/cutout`)**: Schneidet ein Motiv per Rechteck-/Polygon-Maske oder Farb-Schwellenwert mit `sharp` auf transparenten Hintergrund frei und legt es als neues Asset an.
   - **Druckprüfung (`checkMerchPrintQuality`)**: Prüft jedes Motiv gegen die Mindestauflösung des gewählten Produkts bei 300 DPI und warnt im Klartext, z. B.:
     > *„Für ein Poster in A2 ist das Bild zu klein (1200×1600 px vorhanden, 4961×7016 px bei 300 DPI nötig).“*
   - **Flache Produkt-Vorschau (`GET /api/v1/publish/merch/:id/mockup.svg`)**: Rendert das Motiv maßstabsgetreu auf einer SVG-Produkt-Silhouette (T-Shirt, Rahmen, Tasse, Tasche, Sticker usw.).
   - **Shop-Export (`GET /api/v1/publish/merch/export?format=csv|json`)**: Exportiert den Produktkatalog als Shopify-kompatible CSV oder strukturiertes JSON.

### So verbindest du später deine Website, deinen Shop, Printful/Printify

1. **Verschlüsselungsschlüssel in `.env` setzen**:
   Trage in deiner `.env` einen langen zufälligen Wert für `CONNECTOR_SECRET` ein (mindestens 32 Zeichen). Damit verschlüsselt Federführer alle API-Schlüssel per AES-256-GCM in PostgreSQL.
2. **Eigene Website verbinden (WordPress oder Ghost)**:
   - *WordPress*: Erstelle in deinem WordPress-Profil unter *Benutzer → Profil → Anwendungspasswörter* ein neues Anwendungspasswort. Wähle in Federführer den Connector `wordpress`, gib deine Website-URL (`https://deine-seite.de`), deinen Benutzernamen und das Anwendungspasswort ein.
   - *Ghost*: Lege unter *Ghost Admin → Settings → Integrations → Add custom integration* eine Integration an, kopiere den **Admin API Key** (`id:secret`) und speichere ihn zusammen mit deiner Ghost-URL unter `ghost`.
3. **Eigenen Shop verbinden (Shopify oder WooCommerce)**:
   - *Shopify*: Erstelle in deinem Shopify-Adminbereich eine benutzerdefinierte App mit den Berechtigungen `write_products` und `write_content`. Kopiere das `Admin API Access Token` (`shpat_...`) und deine Shop-Domain (`https://dein-shop.myshopify.com`) in den Connector `shopify`.
   - *WooCommerce*: Erzeuge unter *WooCommerce → Einstellungen → Erweitert → REST-API* ein Schlüsselpaar (`Consumer Key` & `Consumer Secret` mit Lese-/Schreibrechten) und speichere es zusammen mit deiner Shop-URL unter `woocommerce`.
4. **Print-on-Demand verbinden (Printful oder Printify)**:
   - *Printful*: Erstelle im Printful Developer Portal ein Private Token und hinterlege es beim Connector `printful`.
   - *Printify*: Erzeuge unter *Printify → My Profile → Connections → API* ein Personal Access Token und trage es samt deiner `shopId` beim Connector `printify` ein.
5. **Eigener Webhook oder Offline-Export-Paket (sofort ohne Konto nutzbar)**:
   - *Webhook*: Gib eine beliebige eigene Ziel-URL und ein `secret` beim Connector `webhook` an. Federführer signiert jeden `POST`-Aufruf mit `X-Federfuehrer-Signature-256: sha256=<HMAC>`.
   - *Ohne Verbindung*: Du musst überhaupt keinen Dienst verbinden – über `GET /api/v1/publish/publications/:id/package` oder `POST /api/v1/publish/portfolio/zip` kannst du jederzeit das fertige ZIP-Paket mit allen geschützten Bildern und Produktdaten herunterladen.

### API-Übersicht für Teil A & Teil B (Beispiel-JSON)

- **`POST /api/v1/comic/formats`** (Eigenes Seitenformat anlegen)
  ```json
  // Request:
  { "name": "Mein Quadrat-Zine", "width": 200, "height": 200, "unit": "mm", "dpi": 300, "bleed": 3, "safeMargin": 5, "gutter": 4 }
  ```
- **`POST /api/v1/comic/pages/:id/elements`** (Frei platzierbares Grafik-/Text-Element auf der Arbeitsfläche)
  ```json
  // Request:
  { "elementType": "soundeffekt", "text": "KRACH!", "x": -2.5, "y": 15, "width": 90, "height": 28, "zIndex": 15 }
  ```
- **`POST /api/v1/publish/connectors`** (Verschlüsselte Connector-Zugangsdaten speichern)
  ```json
  // Request:
  {
    "kind": "wordpress",
    "label": "Mein Studio-Blog",
    "endpointUrl": "https://atelier-beispiel.de",
    "credentials": { "username": "autorin", "appPassword": "xxxx-xxxx-xxxx" }
  }
  // Antwort (201 Created – ohne Klartext-Geheimnis):
  { "id": "...", "kind": "wordpress", "status": "verbunden", "hasCredentials": true }
  ```
- **`POST /api/v1/publish/merch`** (Merch-Produkt mit automatischer 300-DPI-Druckprüfung anlegen)
  ```json
  // Request:
  { "assetId": "550e8400-e29b-41d4-a716-446655440000", "productType": "Poster", "variantFormat": "A2", "title": "Marta Poster A2", "priceCents": 2900 }
  // Antwort (201 Created):
  {
    "id": "...",
    "productType": "Poster",
    "variantFormat": "A2",
    "qualityCheck": {
      "passed": false,
      "message": "Für ein Poster in A2 ist das Bild zu klein (1200×1600 px vorhanden, 4961×7016 px bei 300 DPI nötig)."
    }
  }
  ```

---

## CI/CD & Betrieb (`comicfeder`)

Die Bereitstellung läuft über **Forgejo Actions** (`.forgejo/workflows/ci.yml`) und Docker (`Dockerfile`, `docker-compose.example.yml`).

### 1. Forgejo Actions Workflow (`.forgejo/workflows/ci.yml`)

- **Job `check`** (läuft bei jedem `push` und `pull_request` auf `main` sowie bei `workflow_dispatch` auf `node-22`):
  1. `actions/checkout@v4`
  2. `npm ci` (ohne `--legacy-peer-deps`, da der Peer-Dependency-Konflikt um `esbuild` über `esbuild@^0.28.0` in `devDependencies` sauber aufgelöst ist)
  3. `npm run check` (`tsc --noEmit && vitest run && vite build`)
- **Job `deploy`** (`needs: check`, läuft **ausschließlich manuell** per `workflow_dispatch` auf dem Branch `main`):
  1. Installiert `openssh-client` und schreibt `secrets.DEPLOY_SSH_KEY` sowie `vars.DEPLOY_KNOWN_HOSTS` mit `umask 077` nach `$RUNNER_TEMP`. Beide Werte müssen gesetzt sein (`test -n`), und `known_hosts` darf ausschließlich den Ziel-Host `172.17.0.1` enthalten.
  2. **Negativtest der Deploy-Schranke**: Prüft vor jedem Deploy, dass der CI-Schlüssel die Befehle `rollback comicfeder` und `ls` mit **Exit-Code 2** abgelehnt bekommt. Andernfalls bricht der Job sofort ab.
  3. Prüft, dass `GIT_SHA` exakt aus 40 Hex-Zeichen besteht (`^[0-9a-fA-F]{40}$`).
  4. Führt `ssh ... fried@172.17.0.1 "deploy comicfeder $GIT_SHA"` mit strikten SSH-Optionen (`BatchMode=yes`, `IdentitiesOnly=yes`, `IdentityAgent=none`, `GlobalKnownHostsFile=/dev/null`, `StrictHostKeyChecking=yes`, `UserKnownHostsFile=$RUNNER_TEMP/known_hosts`, `ConnectTimeout=10`) aus.
  5. Löscht im `if: always()`-Schritt die temporären Schlüsseldateien aus `$RUNNER_TEMP`.

### 2. Benötigte Forgejo-Konfiguration (Secrets & Variablen)

Im Forgejo-Repository müssen folgende Werte hinterlegt sein (keine Schlüssel oder Passwörter im Repository):

- **Secret `DEPLOY_SSH_KEY`**: Privater Ed25519-SSH-Schlüssel für den eingeschränkten Deploy-Zugang (`fried@172.17.0.1`).
- **Variable `DEPLOY_KNOWN_HOSTS`**: Öffentlicher Host-Key-Eintrag des Ziel-Hosts (ausschließlich `172.17.0.1 <key-type> <public-key>`).

### 3. Serverseitiges Deploy-Gate (`authorized_keys`)

Auf dem Zielserver (`172.17.0.1`, Nutzer `fried`) ist der öffentliche CI-Schlüssel in `~/.ssh/authorized_keys` an ein striktes Wrapper-Skript (`command="/usr/local/bin/deploy-gate"`) gebunden:
- Erlaubt für den CI-Schlüssel **nur** `deploy comicfeder <40-hex-sha>`.
- Lehnt alle anderen Kommandos (wie `rollback comicfeder` oder `ls`) mit **Exit-Code 2** ab.

### 4. Container-Betrieb, Healthcheck, Backup & Rollback

- **Docker & Migrationen**: Das Multi-Stage-`Dockerfile` (`node:22-alpine`) installiert Abhängigkeiten per `npm ci`, baut das Frontend mit `vite build`, installiert `ffmpeg` und `vips` (für `sharp`), läuft als Nicht-Root-User (`nodejs`), bindet Volumes für `/data/ideen` (`IDEAS_DIR`) und `/data/assets` (`ASSETS_DIR`) ein und führt beim Container-Start automatisch `npm run db:migrate` vor `npm start` aus.
- **Port-Bindung & Sicherheit**: In `docker-compose.example.yml` lauscht `comicfeder-app` ausschließlich auf Loopback (`127.0.0.1:3057:3000`). `ALLOW_DEV_LOGIN` ist im Produktions-Compose nicht gesetzt.
- **Healthcheck**: `GET /api/health` prüft Datenbankverbindung und Serverstatus (wird vom Docker-`HEALTHCHECK` alle 15–30 s abgefragt).
- **Backup (`./scripts/backup.sh`)**: Sichert die PostgreSQL-Datenbank (`pg_dump`), Sprachnotizen (`IDEAS_DIR` → `ideas.tar.gz`) sowie die komplette Bildbibliothek (`ASSETS_DIR` → `assets.tar.gz`) in ein zeitgestempeltes Archiv `comicfeder_YYYYMMDD_HHMMSS.tar.gz` und rotiert automatisch auf die letzten 7 Sicherungen.
- **Rollback**: Ein Rollback wird niemals durch den CI-Schlüssel ausgelöst, sondern ausschließlich manuell direkt auf dem Zielserver über das administrative Server-Skript (`rollback comicfeder <vorheriger-sha>`).

---

## Offen

Folgende Punkte sind bewusst für die nächste Ausbaustufe vorgesehen und nicht als Platzhalter im Code versteckt:

- **Ausführung von `docker build .` in dieser Sandbox-Umgebung**: `Dockerfile` und `docker-compose.example.yml` sind vollständig auf `comicfeder` (Node 22, `npm ci`, `sharp`/`vips`, Nicht-Root, `/data/ideen` & `/data/assets`, automatische Start-Migrationen) umgestellt; da in dieser Entwicklungsumgebung kein Docker-Daemon läuft, findet der eigentliche Container-Build auf dem Zielserver statt.
- **Großes Zeichen- und Layout-Atelier im Vollbild**: Die interaktive SVG-Arbeitsfläche mit Pointer-Events (Verschieben, Skalieren, Einrasten, Doppelseiten-Bund und Storyboard-Vorschau) ist in der deutschen Test-Oberfläche unter „3. Formate, Doppelseite & Arbeitsfläche“ voll funktionsfähig; ein mehrschichtiges Vollbild-Zeichenwerkzeug mit Stift-Druckkurven und Freihand-Polygon-Schnitt folgt in der dedizierten Frontend-Runde.
- **Externer Python-GPU-Worker (`SCRAMBLER_WORKER_URL`)**: Schnittstelle, Job-Tabelle und separater PyTorch-Worker für PGD gegen CLIP/SigLIP sind implementiert und auf CPU geprüft. Der Worker muss separat betrieben werden; GPU/4-GB-VRAM sind noch ungeprüft. Ohne Worker und HMAC-Schlüssel liefert der Server 503.
- **Krita-Ebenen & C2PA-Zertifikatskette**: KRA-Originalimport und Composite-Vorschau sind umgesetzt, begrenzte 8-Bit-RGBA-Paint-Layer sind extrahierbar. Vollständiges Rendering von Gruppen/Masken/Vektoren/CMYK/HDR, reale Krita-Beispielfixtures sowie C2PA-Manifeste mit X.509-Zertifikat bleiben offen.
- **OAuth-Ein-Klick-Flows für Drittanbieter-Shops**: Aktuell werden API-Tokens/Anwendungspasswörter für WordPress, Ghost, Shopify, WooCommerce, Printful und Printify direkt mit AES-256-GCM verschlüsselt hinterlegt; ein mehrstufiger Browser-OAuth-Handshake pro Anbieter ist noch offen.
- **EPUB-Kompatibilität & vollständige Offline-Hintergrundsynchronisation**: EPUB-Packaging ist implementiert. EPUBCheck, konkrete Lesegeräteprüfungen und vollständige Offline-Hintergrundsynchronisation bleiben offen.

---

## Was ist echt

- **Echter Login**: Benutzername + Passwort mit bcrypt, Session-Cookie, Sperre nach 5 Fehlversuchen; Dev-Login-Hilfe erscheint ausschließlich wenn `NODE_ENV !== 'production'` und `ALLOW_DEV_LOGIN=true`
- **PostgreSQL & PGlite-Dev-Fallback**: Alle Daten über Drizzle ORM; in Produktion PostgreSQL Pflicht, lokal ohne `DATABASE_URL` automatischer PGlite-Fallback mit Warnhinweis
- **Owner-Isolation**: Jede DB-Abfrage filtert auf `owner_id` – Nutzerinnen sehen nur ihre eigenen Projekte, Kapitel, Assets, Comic-Seiten, Formate, Connectoren, Veröffentlichungen, Merch-Produkte, Vorschläge und Schutz-Jobs
- **Soft-Delete**: Kapitel, Charaktere, Orte, Fakten, Assets und Comic-Seiten können in die Schublade gelegt und zurückgeholt werden
- **Persistente Proposals**: KI- und Skript-Brücken-Vorschläge werden in der Tabelle `proposals` in der Datenbank gespeichert
- **Zeitmaschine & Sync-Konflikt**: Snapshots von Kapiteln erstellen; neuere Server-Fassung wird nie überschrieben (409 Conflict)
- **CSP**: Kein `unsafe-eval`, keine externen Fonts, keine Google-Dienste
- **Fail-closed**: OmniRoute (KI), ASR (Spracherkennung) und Scrambler-Worker sind deaktiviert bzw. melden 503, wenn sie nicht konfiguriert sind

## Comic-Studio-Oberfläche

Nach der vorhandenen Anmeldung öffnet „Comic-Studio“ die Arena-Variante B unter `src/comic/`. „Zurück zum Federführer“ führt zur bisherigen Schreiboberfläche; „Graphic Novel“ bleibt als Prüfwerkzeug erhalten. Beide Oberflächen verwenden dieselbe Session über `/api/auth/me`, keine zweite Anmeldung. Die HTTP-Anbindung ist aktiv, der Mock bleibt ausschließlich für Tests auswählbar.

Das Studio stellt bestehende Kapitel als Comic-Projekte dar und speichert Seiten, Panels, Sprechblasen sowie freie Bilder über die vorhandenen Einzelrouten. Arbeitsflächen, Doppelseiten und Bundwarnung sind im Editor verfügbar. Die vorhandene Leserichtung wird beim Speichern beibehalten; umstellen lässt sie sich im Prüfwerkzeug „Graphic Novel“. Exporte unterstützen PDF, CBZ, PNG und EPUB; mehrere PNG-Seiten werden im Browser zu ZIP gepackt. „Ist das mein Bild?“ zeigt die tatsächliche Wasserzeichenprüfung. Ohne konfigurierten Worker meldet die Schutzschicht ehrlich „nicht verfügbar“.

Veröffentlichen, Shop, Merch und Portfolio lesen die vorhandenen Routen und bieten einfache Exporte beziehungsweise Anfragen. Noch fehlende Verwaltungsfunktionen sind als „Kommt bald“ sichtbar. Echte Anbieterzugänge und ein Deployment werden dadurch nicht eingerichtet. Bilder liegen lokal unter `public/comic-assets/`, das Theme ist auf `.comic-root` begrenzt.

## Neue Import-, Export- und Prüfmodule

- `modules/kra/`: begrenzter KRA-ZIP-Import, Composite und unterstützte Paint-Layer. Schutz und Grenzen: [modules/INTEGRATION.md](modules/INTEGRATION.md).
- `modules/epub/`: Fixed-Layout-EPUB aus geschützten Seiten, einschließlich Doppelseiten.
- `modules/print-specs/`: Druckdateiprüfung. Anbieterwerte sind bis zum vollständigen Quellenbeleg **ungeprüft** und ersetzen keine produktbezogene Druckfreigabe.
- `workers/scrambler/`: separater Python-Worker mit echten Vision-Encodern, PGD, SSIM-Grenze und signierten Jobs; Einrichtung und CPU-Messungen in [workers/scrambler/INTEGRATION.md](workers/scrambler/INTEGRATION.md).
- `workers/scrambler/eval/`: Bildpaar-Auswertung; Mock-Messungen sind ausdrücklich keine Schutzwirksamkeit gegen echte Modelle. `tests/eval/` läuft ohne Python oder Netzwerk.
- `e2e/`: eigenständiges Playwright-Projekt; Installation und Ausführung in [e2e/INTEGRATION.md](e2e/INTEGRATION.md).

Der kritische Lieferbericht steht in [REVIEW-AISTUDIO.md](REVIEW-AISTUDIO.md). Frühere Arbeitsaufträge und Generierungsprompts liegen unter `docs/prompts/`.

## Tests

```bash
# Vollständige Prüfung (Typecheck, Vitest, Production-Build)
npm run check

# Alle Tests einzeln ausführen
npm test

# Production-Build prüfen
npm run build
```

## Lizenz

Alle Rechte vorbehalten. Die Nutzung ist nur nach Absprache mit Friedrich Börner (Dehl und Börner Systems GbR) erlaubt.
