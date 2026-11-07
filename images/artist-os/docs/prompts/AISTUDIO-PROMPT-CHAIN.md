# Prompt-Kette für Google AI Studio — Artist OS (Noizy Neighbor Flagship & Music Business SaaS)

> **Wichtige Bedienungsanleitung für Google AI Studio (Erfahrungswerte aus Comicfeder):**
> 1. **Ein Sprint pro Chat-Turn / Neuer Chat bei langem Verlauf:** Sende immer **genau einen Prompt** aus dieser Kette und warte, bis AI Studio alle Dateien des Sprints vollständig ausgegeben und geprüft hat. Wenn der Kontext nach 2–3 Sprints groß wird, starte einen frischen Chat, um `internal error` zu vermeiden.
> 2. **Bestehenden Code schützen:** Die öffentliche DJ-Noizy-Neighbor-Seite (`src/app/(de)/*`, `src/views/*`, `src/components/three/*`, `src/components/werkstatt/*`, `src/components/schleuder/*`) ist live (`1.6.2`) und darf **niemals kaputtgemacht oder durch Platzhalter ersetzt** werden.
> 3. **Kleine, modulare Sprints mit `INTEGRATION.md`:** Jeder Sprint legt klar abgegrenzte Module unter `src/lib/artist-os/`, `src/components/artist-os/`, `src/app/studio/`, `src/app/vault/` bzw. `workers/audio-scrambler/` sowie eigene Vitest-Tests an.

---

## Prompt 0 — System Instruction (In das Feld „System Instructions“ von Google AI Studio kopieren)

```markdown
Du bist Lead Full-Stack & Audio-Security Architect für **Artist OS** (Flagship-Instanz: **DJ Noizy Neighbor**, Berlin).
Du entwickelst die bestehende, produktive Next.js 16 / React 19 / TypeScript / Drizzle-ORM / PostgreSQL Applikation (`dj-noizy-neighbour-web-application_musterb`) schrittweise zum modularen **Music Business Operating System (Artist OS)** weiter und nutzt dabei den bewährten Schutz- und Infrastruktur-Code aus `comicfeder-reference/`.

### Verbindlicher Hausstandard (Answer 42 / D&B Gesetze — OHNE AUSNAHME)
1. **Schreibweise & Sprache:**
   - Der Flagship-Künstler heißt IMMER **DJ Noizy Neighbor** (US-Schreibweise **ohne u**, niemals „Neighbour“).
   - Oberfläche, Fehlermeldungen (RFC 9457 Problem Details) und Dokumentation sind auf **Deutsch** mit korrekten Umlauten (ä, ö, ü, ß), zweisprachige Public-Views (`de`/`en`) bleiben erhalten.
2. **Strikte Mandanten- & Owner-Isolation (`owner_id`):**
   - Jede neue Tabelle in `src/db/schema.ts` besitzt ein Feld `ownerId` (`uuid('owner_id').notNull()`) bzw. `organizationId`.
   - Jede Datenbankabfrage (`SELECT`, `UPDATE`, `DELETE`) filtert zwingend auf `ownerId`.
3. **KI-Schranke & Anti-LLM-Schutz (`assertNoMediaContent`):**
   - KI-Textfunktionen laufen ausschließlich serverseitig über OmniRoute (`OMNIR_URL`, `OMNIR_KEY`, `OMNIR_MODELS` mit Präfix `bailian-coding-plan/*`). Kein Gemini-SDK im App-Code!
   - **Weder Bilder (`image/*`) noch Musik-/Master-/Stem-Audiodateien (`audio/*`) dürfen jemals an ein Sprachmodell gesendet werden!** `assertNoMediaContent()` in `src/lib/llm.ts` und die API-Middleware lehnen Bild- und Audiodaten (Data-URLs, Magic-Bytes für PNG/JPG/WAV/MP3/FLAC/OGG/M4A/AIFF, Buffer-Felder) sofort mit HTTP 400 (`LLMContentRejectedError`) ab.
   - Einzige Ausnahme für Audio ist der dedizierte Sprachnotiz-Endpunkt (`src/lib/asr.ts`) ausschließlich für kurze eingesprochene Ideen-Memos aus `IDEAS_DIR`.
4. **Ehrlicher Schutz & Fail-Closed (Nichts vortäuschen):**
   - Fehlen `OMNIR_URL`, `ASR_URL` oder `SCRAMBLER_WORKER_URL`, antwortet der Server sauber fail-closed mit **HTTP 503** (`"Dienst / Schutzschicht gerade nicht verfügbar"`).
   - **Verboten:** Zufallsrauschen oder ungeprüfte Filter als „KI-Schutzschicht“ auszugeben oder erfundene Metriken anzuzeigen. Alle Wasserzeichen- und Scrambler-Metriken (Bit-Agreement, SNR, LSD, SSIM, pHash/aHash) müssen echt berechnet sein.
   - Ohne hinterlegte Drittanbieter-Zugangsdaten (Spotify, Meta, TikTok, DistroKid, Stripe) meldet jeder Connector ehrlich `status: "nicht_verbunden"` und bietet sofort den lokalen Export (ZIP, CSV, ICS, PDF) bzw. CSV-Import an.
5. **Original-Unversehrtheit:**
   - Originale Master-Tracks, Stems und Originalfotos werden niemals überschrieben. Öffentliche Streams, Supervisor-Links und Exporte durchlaufen zwingend die Schutz-Pipeline.
6. **Keine externen CDNs & Design-System:**
   - Keine externen Google-Fonts oder Skript-CDNs. Nutze die lokalen Schriften (`Archivo`, `Space Mono`) und die Noizy-Design-Tokens (`ink #141311`, `page #f1e4cf`, `paper #f6ead9`, `surface #e9dbc3`, `vinyl #e85c0d`, `vinyl-deep #b8450a`, `sunburst #f6b436`, `olive #4b5b3b`, `dark-page #111111`), 2px harte Rahmen (`border-2 border-fg`), harte Schatten (`4px 4px 0 var(--color-fg)`), keine weichen Verläufe, kein Glassmorphism.
7. **Vollständiger Code:**
   - Schreibe niemals Platzhalter wie `// ... rest of code` oder `TODO`. Liefere jede geänderte oder neue Datei vollständig und kompilierbar (`tsc --noEmit` grün).
```

---

## Sprint 1 — Fundament, DB-Schema für alle 6 Nutzerwelten, Auth/RBAC & Anti-LLM Media-Guard

**Ziel:** Übernahme der Kern-Infrastruktur aus `comicfeder-reference/` (`auth.ts`, `db.ts`, `env.ts`, `llm.ts`, `asr.ts`, `magicBytes.ts`) in die Next.js-App und Erweiterung des Drizzle-Schemas für das gesamte Artist OS, ohne die bestehenden Tabellen (`gems`, `tourDates`, `campaigns`, `contentCheck`, `bookingRequests`, `orders`, `newsletterSubscribers`) zu brechen.

### Prompt für Sprint 1 (in AI Studio senden):

```markdown
Lies zuerst `docs/ARCHITEKTUR-ARTIST-OS.md`, `src/db/schema.ts`, `src/lib/adminAuth.ts` sowie die Referenzdateien in `comicfeder-reference/lib/` (`auth.ts`, `db.ts`, `env.ts`, `llm.ts`, `aiRoutes.ts`, `asr.ts`, `assets/magicBytes.ts`, `publish/crypto.ts`).

Setze jetzt **Sprint 1 (Core Foundation, DB-Schema, Multi-Role Auth & Anti-LLM Media-Guard)** vollständig um:

1. **Datenbank-Schema erweitern (`src/db/schema.ts` + Initialisierungs-SQL in `src/db/initArtistOs.ts`):**
   - Behalte alle 7 bestehenden Tabellen (`newsletterSubscribers`, `bookingRequests`, `orders`, `tourDates`, `gems`, `contentCheck`, `campaigns`) 1:1 kompatibel bei!
   - Ergänze die Artist-OS-Tabellen (alle mit `ownerId: uuid('owner_id').notNull()`):
     - **Core & Rollen (6 Nutzerwelten):** `users` (mit `role`: `'artist' | 'producer' | 'manager' | 'client' | 'supervisor' | 'admin'`), `sessions` (aus `comicfeder`), `organizations`, `memberships`, `artistProfiles` (Name, Bio, Genre, Brand-Kit-JSON, Social-Links, Presskit-Config; Seed für `DJ Noizy Neighbor`).
     - **Vault & Katalog (Modul C):** `tracks` (Titel, Artist, BPM, Key, Genre, Mood, DurationSec, ISRC, UPC, CopyrightStatus, SampleStatus, ClearanceStatus, ReleaseStatus: `'private' | 'demo' | 'ready_for_artists' | 'ready_for_sync' | 'exclusive_available' | 'leased' | 'sold_exclusive' | 'placed_in_project' | 'blocked_for_samples' | 'under_review'`), `trackVersions` (`'main' | 'instrumental' | 'acapella' | 'tv_mix' | 'underscore' | 'loop' | 'trailer_edit' | 'stem'`, `originalPath`, `previewPath`, `sha256`, `bytes`, `mimeType`, `durationSec`, `loudnessLufs`), `vaultShares` (Token, Titel, Rolle `'supervisor' | 'client' | 'label'`, PasswortHash optional, `expiresAt`, `allowDownload`, `allowStemRequest`, `trackIds` JSONB), `vaultAccessLogs` (`shareId`, `trackId`, `action`: `'stream' | 'download_preview' | 'request_stems' | 'request_license'`, `recipientInfo`, `watermarkFingerprintId`, `createdAt`).
     - **Audio- & Bild-Schutz (`protect`):** `exportFingerprints` (Bild-pHash + Watermark-Payload aus Comicfeder), `audioExportFingerprints` (`trackId`, `versionId`, `shareId`, `recipientContactId`, `format`, `spectralHash`, `sha256`, `watermarkPayload`, `metadataJson`, `createdAt`), `protectionJobs` (für Bild & Audio Scrambler, `kind`: `'image' | 'audio'`, `strength`, `status`, `ssim`, `snrDb`, `lsdDb`, `outputPath`).
     - **CRM, Deals, Rights & Splits (Modul C & F):** `contacts` (`name`, `company`, `role`: `'artist' | 'producer' | 'label' | 'manager' | 'supervisor' | 'agency' | 'game_studio' | 'film_production' | 'club' | 'curator' | 'press'`, `email`, `socialsJson`, `tags`, `budgetRange`, `preferredGenres`, `lastInteractionAt`, `nextTask`, `notes`), `deals` (`title`, `contactId`, `trackId`, `stage`: `'lead' | 'first_contact' | 'track_sent' | 'feedback' | 'negotiation' | 'contract' | 'approval' | 'delivery' | 'invoice' | 'paid' | 'live' | 'reporting'`, `valueCents`, `currency`, `licenseType`, `notes`), `rightsSplits` (`trackId`, `collaboratorName`, `role`, `masterSharePct`, `publishingSharePct`, `ipiNumber`, `confirmed`), `contracts` (`dealId`, `trackId`, `templateType`: `'non_exclusive_lease' | 'exclusive_license' | 'sync_license' | 'split_sheet' | 'work_for_hire' | 'invoice'`, `status`, `payloadJson`).
     - **Analytics, Release Hub & Connectoren (Modul D & E):** `releases` (`title`, `kind`, `releaseDate`, `upc`, `label`, `distributorStatus`, `checklistJson`, `smartLinkSlug`, `campaignId`), `metricSnapshots` (`source`: `'spotify' | 'apple_music' | 'youtube' | 'instagram' | 'tiktok' | 'beatstars' | 'sync' | 'manual_csv'`, `metricDate`, `streams`, `Saves`, `followers`, `revenueCents`, `payloadJson`), `connectorAccounts` (AES-256-GCM verschlüsselt aus `comicfeder`), `ideaNotes` (Sprachnotizen mit `audioPath`, `transcript`, `transcriptStatus`).

2. **Auth & RBAC Brücke (`src/lib/auth.ts` + Kompatibilität in `src/lib/adminAuth.ts`):**
   - Portiere `comicfeder-reference/lib/auth.ts` nach `src/lib/auth.ts` für Next.js App Router (`getSessionFromCookies()`, `requireRole(allowedRoles)`, `verifyShareToken(token, password?)`).
   - Halte `isAdmin()` in `src/lib/adminAuth.ts` abwärtskompatibel: Entweder gültiges `noizy_admin` Cookie ODER eingeloggte Session mit Rolle `'artist' | 'manager' | 'admin'`.
   - Erstelle einen automatischen Dev-/Seed-Nutzer für DJ Noizy Neighbor (`username: "noizy"`, Rolle `"artist"`, fester Owner-UUID-Seed), sofern die Tabelle leer ist, damit alle bestehenden und neuen Daten sofort unter derselben `ownerId` verknüpft sind.

3. **Audio- & Bild-Magic-Bytes (`src/lib/magicBytes.ts`):**
   - Übernimm `comicfeder-reference/lib/assets/magicBytes.ts` und erweitere `detectFormatByMagicBytes(buffer)` um echte binäre Signaturprüfung für Audio:
     - `wav`: `RIFF` (0..3) + `WAVE` (8..11) -> `audio/wav`
     - `flac`: `fLaC` (0..3) -> `audio/flac`
     - `mp3`: `ID3` (0..2) oder Frame-Sync `0xFF` + `(b[1] & 0xE0) === 0xE0` -> `audio/mpeg`
     - `ogg`: `OggS` (0..3) -> `audio/ogg`
     - `m4a`: `ftyp` (4..7) mit `M4A `, `mp42`, `isom` -> `audio/mp4`
     - `aiff`: `FORM` (0..3) + `AIFF` oder `AIFC` (8..11) -> `audio/aiff`

4. **OmniRoute KI-Client mit striktem Anti-LLM Bild- & Audio-Blocker (`src/lib/llm.ts`):**
   - Portiere `comicfeder-reference/lib/llm.ts` nach `src/lib/llm.ts`.
   - Erweitere `containsImageData` zu `containsMediaData(input)` und `assertNoMediaContent(input)` (`LLMContentRejectedError`, HTTP 400):
     - Lehnt neben `data:image/*` und Bild-Magic-Bytes auch `data:audio/*`, `data:video/*`, alle Audio-Magic-Bytes (`RIFF..WAVE`, `fLaC`, `ID3`, `OggS`, `FORM..AIFF`) sowie verbotene Objekt-Keys (`audio`, `audioUrl`, `audioBase64`, `audioBuffer`, `stemBuffer`, `masterBuffer`, `trackBuffer`, `fileBuffer`, `image`, `imageBase64`, `image_url`) kompromisslos ab!

5. **Tests (`src/lib/__tests__/sprint1-foundation.test.ts`):**
   - Schreibe Unit-Tests für `detectFormatByMagicBytes` (alle Bild- & Audio-Formate + Ablehnung gefälschter Dateiendungen), `containsMediaData` / `assertNoMediaContent` (blockiert Bilder UND Audio zuverlässig, lässt normalen Text durch) und `encryptCredentials` / `decryptCredentials` (`src/lib/crypto.ts`).

Gib am Ende von Sprint 1 alle neu erstellten/aktualisierten Dateien vollständig aus und fasse den Stand zusammen. Stoppe danach und warte auf „Weiter mit Sprint 2“.
```

---

## Sprint 2 — Die 4-stufige Audio- & Bild-Schutz-Pipeline (`src/lib/protect/`)

**Ziel:** Portierung der Bild-Wasserzeichen-Pipeline aus `comicfeder` UND Neubau der **4-stufigen Audio-Schutz-Pipeline** (Unsichtbares 1D-DCT Spread-Spectrum Audio-Watermark mit 22-Byte HMAC-SHA256 Payload, Hörbares Producer-Tagging, TDM-Opt-Out Audio-Metadaten + Spektraler 64-Bit `aHash` sowie Audio-Scrambler-Client + Python-Worker-Erweiterung).

### Prompt für Sprint 2 (in AI Studio senden):

```markdown
Lies `docs/ARCHITEKTUR-ARTIST-OS.md` (Abschnitt 4) sowie `comicfeder-reference/lib/protect/` (`index.ts`, `invisibleWatermark.ts`, `visibleWatermark.ts`, `metadata.ts`, `scrambler.ts`) und `comicfeder-reference/workers/scrambler/app.py`.

Setze jetzt **Sprint 2 (Audio & Image Protection Engine + Anti-AI Scrambler)** vollständig um:

1. **Bild-Schutz übernehmen (`src/lib/protect/imageProtect.ts`):**
   - Portiere das 8×8-DCT Luminanz-Wasserzeichen (`embedInvisibleWatermark`, `extractInvisibleWatermark`), das sichtbare Wasserzeichen (`applyVisibleWatermark`), `computePHash` und `embedPngProtectionMetadata` (`Data Mining: Prohibited`) für Cover-Artworks, EPK-Fotos und Marken-Werkstatt-Exporte.

2. **Schicht 1 Audio: Unsichtbares Frequenzraum-Wasserzeichen (`src/lib/protect/invisibleAudioWatermark.ts`):**
   - Nutze exakt denselben 22-Byte signierten Payload wie beim Bild (`Magic 0xFE41` + `4B ownerShortId` + `4B assetShortId` + `4B timestampSec` + `8B HMAC-SHA256` mit `WATERMARK_SECRET` = 176 Bits, `REDUNDANCY = 5` => 880 Fenster, deterministische Permutation `getBlockPermutation(secret)`).
   - Implementiere einen reinen TypeScript 16-Bit PCM WAV Codec (`parseWavPcm16` / `encodeWavPcm16`) plus optionalen FFmpeg-Konverter für MP3/FLAC/M4A -> WAV PCM, sodass das Einbetten und Auslesen auf WAV-Buffern komplett ohne externe Abhängigkeiten in Millisekunden deterministisch funktioniert!
   - **Algorithmus (1D-DCT Spread-Spectrum im Mid-Band):**
     - Teile das Signal in 880 nicht-überlappende Fenster à $N = 256$ oder $512$ Samples (bzw. adaptiv über die Tracklänge verteilt).
     - Berechne pro Fenster die 1D-DCT der mittleren Frequenzkoeffizienten (entspricht ca. 1,5 kHz – 6 kHz bei 44,1 kHz, robust gegen MP3-Kompression).
     - Moduliere zwei benachbarte Frequenz-Paare differentiell (`cA - cB >= delta` für Bit `1`, `cB - cA >= delta` für Bit `0`), wobei `delta` psychoakustisch an die lokale RMS-Energie des Fensters gekoppelt ist (in Stille minimal, bei lauten Beats stärker maskiert) und Soft-Clipping (`[-32760, 32760]`) eingehalten wird.
     - Implementiere `embedInvisibleAudioWatermark(audioBuffer, payloadInput)` (liefert `{ buffer, ownerShortId, assetShortId, timestampSec, payloadHex, snrDb }`) und `extractInvisibleAudioWatermark(audioBuffer, secret?)` (liefert `{ found, signatureValid, ownerShortId, assetShortId, timestampSec, timestampIso, bitAgreement }` per 5-fachem Mehrheitsentscheid und `timingSafeEqual`).

3. **Schicht 2 Audio: Hörbares Producer-Tagging & Preview-Generator (`src/lib/protect/audibleWatermark.ts`):**
   - Implementiere `applyAudibleWatermarkAndPreview(audioBuffer, options)`:
     - Generiert im Pure-TS-PCM-Pfad (und optional über `ffmpeg` bei MP3-Ausgabe) ein periodisches akustisches Wasserzeichen-Signet (z. B. dezentes Vinyl-Crackle-/Chord-Signet oder hochgeladener Producer-Voice-Tag Buffer alle `intervalSec = 20` Sekunden bei `-14 dB` relativ zum Hauptsignal) sowie optionales Kürzen auf `maxDurationSec` (z. B. 30 s oder 45 s) mit sanftem 2-Sekunden-Fade-Out am Ende.
     - Originaldateien im Vault werden niemals verändert!

4. **Schicht 3 Audio: Anti-LLM / TDM-Opt-Out Metadaten & Spektraler Hash (`src/lib/protect/audioMetadata.ts`):**
   - Implementiere `computeAudioSpectralHash(audioBuffer)`: Berechnet über 32 Zeit-Segmente × 8 Frequenzbänder per DCT einen 64-Bit Perceptual Audio Hash (`aHash`, 16 Hex-Zeichen) + `hammingDistanceHex(a, b)`.
   - Implementiere `embedAudioProtectionMetadata(wavOrMp3Buffer, meta)`:
     - Schreibt in WAV-Dateien einen standardkonformen `LIST/INFO`-Chunk (`IART`, `ICOP`, `ISRC`, `ICMT: "TDM-Reservation: 1 | Data Mining: Prohibited"`) und einen `iXML`/`ID3 `-Chunk mit XMP-Paket (`plus:DataMining="DMI-PROHIBITED"`, `tdm:reservation="1"`, `ownerShortId`, `aHash`).
     - Liefert außerdem `getAntiAiHttpHeaders()` (`X-Robots-Tag: noai, noimageai, noaudioai`, `TDM-Reservation: 1`, `Permissions-Policy: browsing-topics=()`).

5. **Schicht 4 Audio: Anti-AI Audio-Scrambler (`src/lib/protect/audioScrambler.ts` + `workers/scrambler/audio_scrambler.py`):**
   - Baue das Gegenstück zu `scrambler.ts` für Audio:
     - Sendet HMAC-SHA256-signierte Requests an `POST {SCRAMBLER_WORKER_URL}/v1/scramble-audio` mit `constraints: { algorithm: 'pgd_psychoacoustic', minSnrDb: 32.0, maxLsdDb: 1.0 }`.
     - Antwortet strikt **fail-closed mit HTTP 503 (`"Audio-Schutzschicht gerade nicht verfügbar"`)**, wenn `SCRAMBLER_WORKER_URL` oder `SCRAMBLER_HMAC_SECRET` nicht gesetzt sind.
     - Erweitere den Python-Worker (`workers/scrambler/audio_scrambler.py`) um die Route `/v1/scramble-audio`: Psychoakustisch maskierte PGD-Perturbation im STFT/Mel-Spektrum gegen Audio-Embeddings (CLAP / EnCodec) mit echter Messung von `snrDb` (muss ≥ 32 dB sein), `lsdDb` (≤ 1.0 dB) und Kosinus-Distanz vorher/nachher.

6. **Gesamt-Pipeline & API-Routen (`src/lib/protect/index.ts` & `src/app/api/v1/protect/[...slug]/route.ts`):**
   - `applyAudioProtectionPipeline(input)` führt alle Stufen in der verbindlichen Reihenfolge aus und speichert den Datensatz in `audioExportFingerprints`.
   - `verifyWatermarkedAudioForOwner(ownerId, audioBuffer)` („Ist das mein Track?“) prüft unsichtbares Wasserzeichen, `aHash`-Distanz gegen `audioExportFingerprints` (inkl. Anzeige, über welchen `vaultShare`-Link und an welchen Kontakt die Datei ging!) und TDM-Metadaten.
   - Stelle die API-Endpunkte `/api/v1/protect/verify-audio`, `/api/v1/protect/verify-image`, `/api/v1/protect/scramble-audio`, `/api/v1/protect/fingerprints` bereit.

7. **Tests (`src/lib/__tests__/sprint2-audio-protect.test.ts`):**
   - Teste:
     - Einbetten & Extrahieren des unsichtbaren Audio-Wasserzeichens auf einem synthetischen Stereo-Funk-Groove-WAV (100% Bit-Agreement, `signatureValid === true`, `ownerShortId` und `assetShortId` stimmen exakt, `snrDb >= 30`).
     - Robustheit gegen Lautstärke-Skalierung (z. B. 80% Pegel) und leichtes Rauschen.
     - Ablehnung bei falschem `WATERMARK_SECRET` (`signatureValid === false`).
     - `computeAudioSpectralHash` (identischer Track hat Distanz 0, anderer Track hat hohe Distanz) + `embedAudioProtectionMetadata` / `extractAudioProtectionMetadata` (`hasDataMiningProhibited === true`).
     - Fail-Closed 503 von `protectAudioWithScrambler`, wenn kein Worker konfiguriert ist.

Gib alle Dateien vollständig aus, zeige die Testergebnisse und warte auf „Weiter mit Sprint 3“.
```

---

## Sprint 3 — Producer & Beat-Lab Vault World + Music Supervisor Pitch Portal (Nutzerwelten 3 & 4)

**Ziel:** Umsetzung von **Modul C (Vault / Katalog / Rechte-Archiv / Audio-Protection-Lab)** für den Artist/Producer (`/studio/vault`) und der externen **Music Supervisor & Sync Pitch World** (`/vault/share/[token]`).

### Prompt für Sprint 3 (in AI Studio senden):

```markdown
Lies `docs/KONZEPT-ARTIST-OS.md` (Modul C: Vault + CRM & Rollen 2, 4, 5) sowie `docs/ARCHITEKTUR-ARTIST-OS.md`.

Setze jetzt **Sprint 3 (Audio Vault, Track/Stem-Katalog, Audio-Protection-Lab & Music Supervisor Pitch Room)** vollständig um:

1. **Seed-Katalog für DJ Noizy Neighbor (`src/lib/artist-os/seedCatalog.ts`):**
   - Befülle den Vault initial (falls leer) mit den echten Tracks und Stems von **DJ Noizy Neighbor**:
     - Die 3 Haupttracks aus `src/lib/data.ts` (`Berlin Funk Groove` 94 BPM F-Moll, `Kater Night Session` 105 BPM D-Moll, `Neighborhood Lo-Fi Beats` 88 BPM A-Moll) inkl. den Loops (`sample-loop-on.mp3`, `sample-loop-ts.mp3`, `sample-loop-ve.mp3`) als Versionen (`main`, `instrumental`, `loop`, `stem`).
     - Die 10 Original-Soundtrack-Tracks aus *Detektiv Funk Schnüffler — Rare Groove Hustle* (`Thema für den Funk Schnüffler`, `Kalte Fritte, heißer Groove`, `Kesselhaus Soulexplosion` etc., Status: `ready_for_sync`, Sample-Status: `100% Original / Sample-Free`, Clearance: `Cleared for Sync & Game`).
     - Ausgewählte Tracks vom Album *Back on 16 pads* (`HEY FELLOWS`, `BESSY'S CHOP`, `MEMORY LANE`, `THE STORM`).

2. **Vault Backend & Geschützte Streaming-Routen (`src/app/api/v1/vault/...`):**
   - `GET / POST / PATCH / DELETE /api/v1/vault/tracks` (mit Versionen-Verwaltung: `main`, `instrumental`, `acapella`, `tv_mix`, `underscore`, `loop`, `trailer_edit`, `stem`; Filter nach BPM-Range, Key, Mood, Genre, Status, Sample-Clearance).
   - `GET /api/v1/vault/stream/[versionId]`:
     - Liefert niemals das ungeschützte Master!
     - Bettet on-the-fly (mit Caching im geschützten Derivate-Ordner) das **unsichtbare Audio-Wasserzeichen** (inkl. `shareId` / Empfänger-Kontext), **TDM-Opt-Out-Metadaten** und bei unlizenzierten Zugriffen das **hörbare Preview-Tag** ein, setzt die Anti-AI-HTTP-Header (`X-Robots-Tag: noai, noaudioai`, `TDM-Reservation: 1`) und schreibt einen Eintrag in `vaultAccessLogs` + `audioExportFingerprints`.
   - `POST / GET / DELETE /api/v1/vault/shares`:
     - Erzeugt kuratierte Freigabe-Links (`/vault/share/[token]`) für Music Supervisors, Labels oder Game-Studios mit Ablaufdatum, optionalem Passwort, erlaubten Aktionen (`allowPreviewDownload`, `allowStemRequest`, `allowSyncInquiry`) und zugeordnetem CRM-Kontakt.
   - `GET /api/v1/vault/one-sheet/[trackId]`:
     - Generiert ein druckfertiges, im Noizy-Plattencover-Look gestaltetes **Sync One-Sheet / Beat-Sheet** (HTML/SVG/PDF mit Titel, BPM, Key, Mood, Story/Szene, Clearance-Bestätigung, Master/Publishing-Splits, Kontakt & QR/Link).

3. **Producer & Beat-Lab Vault UI (`src/components/artist-os/vault/VaultWorkspace.tsx`):**
   - Integrierter **Waveform- & Stem-Player** (Umschalten zwischen *Main*, *Instrumental*, *TV Mix*, *Underscore*, *Loop* an derselben Abspielposition!).
   - **Track- & Rechte-Inspektor:** BPM, Key, Mood-Tags, ISRC/UPC, Sample-Clearance-Ampel (`Grün: Sample-Free / Cleared`, `Gelb: Under Review`, `Rot: Blocked for Samples`), Lizenzstatus-Badge.
   - **Audio-Protection-Lab Tab („Schutz & Wasserzeichen“):**
     - Konfiguration von hörbarem Tag (Intervall, Pegel), unsichtbarem Spektral-Watermark (Live-Anzeige von `ownerShortId`, `assetShortId`, `HMAC-Signatur`), TDM-Opt-Out-Status und Anti-AI-Scrambler-Job.
     - **„Ist das mein Track?“ / „Ist das mein Bild?“ Verifikations-Dropzone:** Datei hineinziehen -> zeigt sofort kryptografischen Wasserzeichen-Nachweis, Bit-Agreement in %, `aHash`/`pHash`-Abgleich und aus den `audioExportFingerprints`, **welcher Empfänger / Share-Link** diese Kopie erhalten hat!

4. **Music Supervisor & Sync Pitch World (`src/app/vault/share/[token]/page.tsx`):**
   - Eigenständige, repräsentative B2B-Ansicht im Noizy-Studio-Look für externe Music Supervisors, Film-/Game-Studios und Labels:
     - Schneller Filter nach Mood, BPM, „100% Sample-Cleared“ und Instrumentierung.
     - Waveform-Player mit hör-/unsichtbar geschütztem Stream und Umschalter auf Instrumental/TV-Mix.
     - 1-Klick-Buttons: **„Stems / Alternates anfragen“**, **„Sync-One-Sheet laden“** und **„Lizenz / Hold anfragen“** (öffnet kompaktes B2B-Modal für Projektart, Territorium, Laufzeit, Budget und legt automatisch einen Deal in der CRM-Pipeline an!).

Stoppe nach Sprint 3, liste alle neuen Dateien und API-Routen auf und warte auf „Weiter mit Sprint 4“.
```

---

## Sprint 4 — B2B CRM, 12-Stufen Deal-Pipeline, Rights/Splits & Vertrags-Generator (Nutzerwelten 5 & 6a)

**Ziel:** Umsetzung von **Modul C (CRM & Pipeline)**, **Modul F (Rights, Splits & Contracts)** und der **Client / Agency Review World** (`/portal/[projectToken]`).

### Prompt für Sprint 4 (in AI Studio senden):

```markdown
Lies `docs/KONZEPT-ARTIST-OS.md` (Modul C: CRM-Funktionen & Deal-Pipeline, Modul F: Rights, Splits & Contracts, Abschnitt 12: Rechtliche Punkte) sowie `docs/ARCHITEKTUR-ARTIST-OS.md`.

Setze jetzt **Sprint 4 (Music CRM, 12-Stage Deal Pipeline, Split-Sheets, Contract Generator & Client Review Portal)** vollständig um:

1. **CRM & 12-Stufen Deal-Pipeline (`src/components/artist-os/crm/CrmWorkspace.tsx` + `/api/v1/crm/...`):**
   - **Kontakte-Verwaltung** für die 13 Musikbranchen-Rollen (`Artist`, `Rapper/Singer`, `Producer`, `Label`, `Manager`, `Music Supervisor`, `Agency`, `Game Studio`, `Film Production`, `Podcast`, `Venue/Club`, `Playlist Curator`, `Press/Blog`) mit Budgetrange, bevorzugten Genres/Moods, Lizenzhistorie und Follow-up-Aufgaben.
   - **Sinnvolle Seed-Kontakte für Noizy:** u.a. *Anni (Pushykraut Queen / Saxophon — Collaborator)*, *Detektiv Funk Schnüffler Game Studio (Sync Client)*, *Kater Blau Booking*, *Tokyo Crate Imports*, *Berlin Indie Film Supervision*.
   - **Kanban- & Tabellen-Pipeline über alle 12 Stufen:**
     `1. Lead` → `2. Erstkontakt` → `3. Track geschickt` → `4. Feedback erhalten` → `5. Verhandlung` → `6. Lizenzvertrag` → `7. Nutzungsfreigabe` → `8. Auslieferung` → `9. Rechnung` → `10. Zahlung` → `11. Platzierung live` → `12. Reporting`.
   - Verknüpfe bestehende `bookingRequests` von der öffentlichen Webseite automatisch als eingehende Live-/Booking-Deals!

2. **Rights, Splits & Dokumenten-Generator (`src/components/artist-os/rights/RightsWorkspace.tsx` + `src/lib/artist-os/contracts.ts`):**
   - **Split-Sheet-Rechner pro Track:** Master-Anteile (%) und Publishing/Kompositions-Anteile (%) müssen jeweils exakt 100 % ergeben (visuelle Validierung, IPI/GEMA-Nummer, Rolle, Freigabestatus; z. B. bei *Rare Groove Hustle*: DJ Noizy Neighbor + Anni / Pushykraut Queen).
   - **Muster-Dokumenten-Generator (HTML/Druck-PDF & Markdown-Export):**
     Erzeugt aus Track + Kontakt + Deal automatisch vorausgefüllte Entwürfe für:
     1. `Non-Exclusive Beat Lease`
     2. `Exclusive Master & Publishing License`
     3. `Sync & Master Use License (Film / Game / Trailer)`
     4. `Co-Write & Producer Split Sheet`
     5. `Custom Scoring / Auftragsproduktion Angebot`
     6. `Rechnung / Invoice (inkl. Lizenzumfang & Zeitstempel)`
   - **Wichtige Hausstandard-Regel (Abschnitt 12 Konzept):** Jedes generierte Vertragsdokument trägt einen klaren, unübersehbaren Hinweis: *„Unverbindlicher Vertragsentwurf (Muster-Vorlage zur Abstimmung) — ersetzt keine Rechts- oder Steuerberatung. Sample-Clearance-Status laut Vault-Protokoll.“*

3. **Client / Agency Review Portal (`src/app/portal/[projectToken]/page.tsx`):**
   - Eigene Nutzerwelt für Auftraggeber (z. B. Game-Studio oder Filmproduktion bei Custom Scoring):
     - Zeigt den Projektstatus in der Pipeline, erlaubt das Gegenhören der hochgeladenen Cue-Versionen (mit Wasserzeichen), das Schreiben von **zeitcodiertem Feedback** (z. B. *„Bei 01:14 bitte Saxophon lauter“*) und den Button **„Version abnehmen / Freigabe erteilen“**.
     - Erst wenn der Deal-Status auf `Auslieferung` / `Zahlung bestätigt` steht, wird der geschützte Download der ungetaggten WAV-Master/Stems (weiterhin mit unsichtbarem Empfänger-Watermark!) freigeschaltet.

Stoppe nach Sprint 4, dokumentiere alle neuen Dateien und Tests und warte auf „Weiter mit Sprint 5“.
```

---

## Sprint 5 — Multi-Artist Brand-Kit Engine, 30-Tage Campaign Generator (OmniRoute) & Release Hub (Nutzerwelten 2 & 6b)

**Ziel:** Weiterentwicklung der bestehenden **Marken-Werkstatt (`src/components/werkstatt/`)** und **Content-Schleuder (`src/components/schleuder/`)** mit **Modul D (Release Hub / DistroKid-Begleiter)**, **Modul E (Analytics Dashboard & CSV-Importer)** und der **OmniRoute Text-KI** (ohne jemals Bilder oder Audio an das LLM zu senden).

### Prompt für Sprint 5 (in AI Studio senden):

```markdown
Lies `docs/KONZEPT-ARTIST-OS.md` (Module A, B, D, E) sowie `src/components/werkstatt/`, `src/components/schleuder/` und `comicfeder-reference/lib/publish/`.

Setze jetzt **Sprint 5 (Brand-Kit One-Sheets, 30-Day Campaign Engine mit OmniRoute, Release Hub & Analytics Cockpit)** vollständig um:

1. **Marken-Werkstatt & Brand-Kit Ausbau (Modul A):**
   - Lass die bestehende `Werkstatt.tsx` unter `/admin/werkstatt` voll funktionsfähig und ergänze für Artist OS:
     - **EPK / Press-Kit & Booking-One-Pager Generator:** Erzeugt aus dem `artistProfile`, den Top-Tracks, den bestätigten Fakten (`contentCheck`), den Pressefotos und dem Tech-Rider (`GEAR` aus `src/lib/data.ts`) ein komplettes **Electronic Press Kit (EPK)** sowie ein **Sync-/Beat-One-Sheet** im Noizy-Look.
     - **Multi-Brand-Token-Profil:** Speichert Logo, Farbpalette (`ink`, `page`, `vinyl`, `sunburst`, `olive`), Fonts (`Archivo`, `Space Mono`), Tonalität („Berliner Plattenkiste, ehrlich, knapp“) und Verbote („NIEMALS Neighbour mit u“) als wiederverwendbares `BrandKit`-Profil in der DB, sodass ein Manager/Label zwischen mehreren Artist-Profilen wechseln kann (Default: `DJ Noizy Neighbor` und sein Alter Ego `Detektiv Funk Schnüffler`).

2. **Content-Schleuder + OmniRoute KI-Textassistent (Modul B):**
   - Erweitere die bestehende Content-Schleuder (`src/components/schleuder/`) um:
     - **30-Tage-Release-Blueprint (T−30 bis T+30 laut Konzept):** Automatische Generierung der Slots von *Tag -30 (Studio/Behind the Scenes)*, *Tag -25 (Hook 1)*, *Tag -20 (Pre-Save)*, *Tag -14 (Track-Snippet)*, *Tag -7 (Countdown)*, *Release-Day (Out Now + Bio + Newsletter)* bis *Tag +30 (Recap)*.
     - **OmniRoute KI-Pitch & Caption Generator (`/api/v1/ai/campaign-copy`):**
       - Nutzt `chatCompletion` aus `src/lib/llm.ts` (geschützt durch `assertNoMediaContent` — sendet **nur** Text-Metadaten wie Titel, BPM, Key, Genre, Mood, Story und Brand-Voice, **niemals** Audio oder Bilder!).
       - Generiert auf Knopfdruck: Instagram/TikTok Reel-Hooks, Story-Sequenzen, Spotify-for-Artists Editorial Pitch-Text (max. 500 Zeichen), Blog/Label-Pitch-Mail und Newsletter-Text im exakten Noizy-Tonfall.
       - **Fail-Closed & Lokaler Fallback:** Ist OmniRoute (`OMNIR_URL`) nicht konfiguriert, liefert ein deterministischer deutscher Template-Generator im Noizy-Stil sofort hochwertige, editierbare Vorschläge, ohne dass die UI blockiert!

3. **Release Hub / „DistroKid-Companion“ (Modul D — `src/components/artist-os/releases/ReleaseHub.tsx`):**
   - Da wir DistroKid nicht ersetzen, sondern alles vor, neben und nach DistroKid professionalisieren:
     - **Release-Checkliste & Metadaten-Safe:** ISRC, UPC/EAN, Master-WAV-Prüfung (Samplerate, Bit-Tiefe, True-Peak), Cover-Prüfung (3000×3000 px, sRGB, kein verbotener Text), Split-Sheet-Freigabe-Check, Sample-Clearance-Check, DSP-Links (Spotify, Apple Music, YouTube, Bandcamp, Deezer).
     - **Smart-Link / Pre-Save Generator (`/release/[slug]`):** Öffentliche Mini-Landingpage im Noizy-Vinyl-Look für jedes Release (mit wasserzeichen-geschütztem 30s-Audio-Teaser, Cover-Flip, Links zu allen Plattformen und Klick-Tracking in `metricSnapshots`).
     - **DistroKid / Vertriebs-CSV-Importer:** Drag-and-Drop Import für DistroKid/Spotify/Bandcamp CSV-Abrechnungen und Metadaten.

4. **Analytics & Revenue Cockpit (Modul E — `src/components/artist-os/analytics/AnalyticsWorkspace.tsx`):**
   - Bündelt die 3 KPI-Säulen aus dem Konzept auf einer übersichtlichen Dashboard-Ansicht (reine CSS/SVG-Charts im Noizy-Print-Look, keine externen Chart-CDNs!):
     1. **Artist & Social KPIs:** Streams nach Plattform, Save-Rate, Pre-Saves, Smart-Link-Klicks, beste Hook-Varianten, Newsletter-Zuwachs (`newsletterSubscribers`).
     2. **Producer & Beat-Selling KPIs:** Previews vs. Downloads im Vault, Conversion-Rate, Umsatz pro Beat/Track, erfolgreichste BPM/Moods.
     3. **Sync & B2B KPIs:** Gepitchte Tracks (`vaultShares`), Supervisor-Streams (`vaultAccessLogs`), License-Requests, Abschlussquote und Pipeline-Wert aus dem CRM.
   - **Connectoren-Status (`comicfeder`-Pattern):** Zeigt für Spotify, Apple Music, YouTube, Meta/Instagram, TikTok, Postiz, Stripe und DistroKid ehrlich den Status (`"Verbunden"` oder `"Noch nicht verbunden – CSV-Import & Paket-Export jederzeit nutzbar"`) an.

Stoppe nach Sprint 5, liste alle erstellten Dateien auf und warte auf „Weiter mit Sprint 6“.
```

---

## Sprint 6 — Das vereinte Artist OS Command Center (`/studio`), Rollen-Switcher & End-to-End Integration

**Ziel:** Zusammenführung aller 6 Nutzerwelten und aller 6 Module (A–F) unter einer nahtlosen Navigation (`/studio` bzw. `/admin`), ohne dass ein einziger bestehender Link auf der DJ-Noizy-Neighbor-Seite verloren geht, plus Abschluss-Testsuite.

### Prompt für Sprint 6 (in AI Studio senden):

```markdown
Prüfe alle bisherigen Sprints und führe jetzt **Sprint 6 (Unified Artist Command Center, Role-World Switcher & Full Verification)** aus:

1. **Unified Artist Command Center (`/studio` & Upgrade von `/admin`):**
   - Erstelle unter `/studio` (und verlinkt direkt aus der bestehenden `/admin`-Kopfzeile) die zentrale **Artist OS Steuerzentrale** mit schnellem Modul-Wechsel:
     - **Übersicht / Golden Path Assistent:** Der 9-Schritte-Flow aus dem Konzept (*1. Artist-Profil -> 2. Track in Vault -> 3. Audio-Schutz & Watermark -> 4. Brand-Kit -> 5. 30-Tage-Kampagne -> 6. Grafiken/One-Sheet -> 7. Supervisor-Share-Link -> 8. Deal im CRM -> 9. Analytics*).
     - **Modul A:** Brand-Kit, Marken-Werkstatt (`/admin/werkstatt`) & EPK/One-Sheet Generator
     - **Modul B:** Release Campaign Engine / Content-Schleuder (`/admin/schleuder`) + KI-Copywriter
     - **Modul C1:** Audio-Vault, Stems & **Audio-Protection-Lab** („Ist das mein Track?“)
     - **Modul C2:** B2B CRM & 12-Stufen Deal-Pipeline
     - **Modul D:** Release Hub (DistroKid-Checkliste, Smart-Links `/release/[slug]`, CSV-Import)
     - **Modul E:** Analytics & Revenue Cockpit (Artist / Producer / Sync KPIs + Connectoren)
     - **Modul F:** Rights, Split-Sheets & Vertrags-/Rechnungs-Generator
     - **Webseiten-Pflege (Bestand):** Diggin' Gems, Tour-Termine & Fragenkatalog („Inhalte prüfen“)
2. **Interaktiver Nutzerwelten-Umschalter (Role & Perspective Preview Bar):**
   - Baue oben im Artist Command Center einen **„Nutzerwelt wechseln (Vorschau)“-Umschalter**, mit dem Friedrich und Martin mit einem Klick live zwischen allen **6 Nutzerwelten** wechseln und deren exakte Perspektive testen können:
     1. 🌍 *Welt 1: Public Fan & Showcase (`/`, 3D-Turntable, 3D-MPC, Game-OST, Shop)*
     2. 🎛️ *Welt 2: Artist Studio (DJ Noizy Neighbor — Brand, Kampagnen, Releases)*
     3. 🔒 *Welt 3: Producer & Beat-Lab Vault (Masters, Stems, Audio-Watermarking & Anti-AI)*
     4. 🎬 *Welt 4: Music Supervisor Pitch Room (`/vault/share/demo-sync-berlin` — gefilterter B2B-Zugang mit Watermark-Stream & 1-Klick-Hold)*
     5. 🤝 *Welt 5: Manager & Label CRM (12-Stufen-Pipeline, Split-Sheets, Verträge)*
     6. 🎯 *Welt 6: Client Scoring Portal (`/portal/demo-funk-schnueffler` — Abnahme & Timecode-Feedback)*
   - Lege für Welt 4 (`demo-sync-berlin`) und Welt 6 (`demo-funk-schnueffler`) direkt funktionierende Demo-Share-Tokens im Seed an, sodass der Klick sofort eine reich befüllte, interaktive B2B-Ansicht öffnet!
3. **Qualitätssicherung, Typecheck & Dokumentation:**
   - Stelle sicher, dass `npx tsc --noEmit` und alle Vitest-Tests (`sprint1`, `sprint2`, und ein neuer Integrationstest `sprint6-golden-path.test.ts` für den Golden Path: *Track -> Audio-Watermark -> Verify -> Share-Link -> Lizenzanfrage -> CRM-Deal -> Split-Sheet -> Smart-Link*) komplett grün durchlaufen.
   - Aktualisiere `README.md` mit einer Übersicht aller Routen, der 6 Nutzerwelten, der 4-stufigen Audio-Schutz-Pipeline und einer ehrlichen Sektion `## Offen` (was bewusst extern betrieben wird, z. B. GPU-Scrambler-Worker, echte OAuth-Freigaben bei Spotify/Meta).
```
