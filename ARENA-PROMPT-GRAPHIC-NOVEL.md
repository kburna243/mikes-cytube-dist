# Arena-Prompt: Federführer → Graphic-Novel-Studio

> Für den Einsatz in einer Coding-Arena bzw. bei einem Coding-Agenten. Den Platzhalter `<REPO-URL>` vor dem Einfügen ersetzen.

---

Du baust auf einem bestehenden Open-Source-Projekt auf: **Federführer** (`<REPO-URL>`), einem barrierefreien Schreib- und Weltbau-Studio als PWA. Stack: React 19 + Vite + Tailwind 4 (Frontend), Express + TypeScript (`server.ts`), PostgreSQL 16 über Drizzle (`drizzle/schema.ts`), Vitest, eigener Login (`lib/auth.ts`, `requireUser`), KI nur serverseitig über eine OpenAI-kompatible Schnittstelle (`lib/llm.ts`, fail-closed). Es gibt schon Projekte, Kapitel, Szenen, Figuren, Orte, Weltfakten, Beziehungsgraph, Zeitleiste, Recherche, Export und Ideen-Sprachnotizen. **Fang nicht bei null an.** Lies zuerst `README.md` und `drizzle/schema.ts` und erweitere das Bestehende.

## Ziel
Mach Federführer zu einem Studio für **Graphic Novels und Comics**, das eine einzelne Illustratorin auf Tablet (Stift) und Desktop nutzt. Die Story-Werkzeuge bleiben, dazu kommen Bildverwaltung, Seitenlayout und **Schutz der Kunstwerke**.

## 1. Grafik-Dateiverwaltung (Asset-Bibliothek)
- Upload per Drag & Drop, Dateiauswahl, Kamera und Einfügen aus der Zwischenablage. Formate: PNG, JPEG, WebP, AVIF, SVG (serverseitig bereinigt, keine Skripte), PSD und Krita (`.kra`) mindestens als Vorschau aus dem eingebetteten Composite-Bild, TIFF.
- Originale **unverändert** speichern, in einem Volume (`ASSETS_DIR`) und nicht in der DB. In der DB liegen nur Metadaten: Hash (SHA-256), Maße, DPI, Farbprofil, Farbraum, Größe, MIME-Typ, `owner_id`.
- Prüfen über Magic Bytes statt Dateiendung, Größenlimit konfigurierbar, EXIF/GPS beim Erzeugen abgeleiteter Dateien entfernen (Original bleibt unangetastet).
- Abgeleitete Varianten serverseitig mit `sharp`: Thumbnail, Arbeitsvorschau, Druckversion. Farbprofil (sRGB/ICC) korrekt behandeln.
- Ordnung: Ordner, Tags, Verknüpfung mit Figur/Ort/Szene aus der bestehenden Weltdatenbank (z. B. Charakterblätter, Model Sheets, Referenzen), Versionen einer Datei mit Vergleichsansicht.
- Suche nach Tag, Figur und Datum, Dubletten über den Hash erkennen.

## 2. Comic-Seiten erstellen
- Datenmodell: `comic_pages` (gehört zu Kapitel/Szene), `panels` (Polygon/Rechteck, z-Reihenfolge, Rahmen, Rinnsteinbreite), `panel_layers` (Asset-Referenz, Transformation, Deckkraft, Maske), `balloons` (Sprech-, Denk-, Schrei-, Flüsterblase, Erzählkasten, Soundeffekt; Schwanzposition, Text, Schrift, Lesereihenfolge).
- Editor auf Canvas (Konva oder Fabric, eines davon begründet wählen): Panel-Vorlagen (Raster 2×3, 3×3, Splash, Doppelseite), Panels frei zuschneiden, Bilder einsetzen, skalieren und beschneiden, Hilfslinien für Anschnitt, Satzspiegel und Sicherheitsrand.
- Seitenformate: US-Comic, A4, B5 (Manga), Webtoon (vertikaler Endlos-Scroll). Einheiten in mm, Druck mit 300/600 DPI.
- Lettering: Text bleibt **editierbar** (nicht gerastert), lokal mitgelieferte Comic-Schriften (Lizenz prüfen, keine CDNs), automatische Lesereihenfolge mit Korrekturmöglichkeit.
- Thumbnail-/Storyboard-Ansicht: alle Seiten als Raster, Seiten per Drag & Drop umsortieren, Doppelseiten-Vorschau.
- Brücke zum Skript: Szenentext aus dem bestehenden Kapitel-Editor lässt sich in Panelbeschreibungen und Dialoge aufteilen. Die KI darf dabei *vorschlagen*, nie automatisch übernehmen. Bestehendes Muster dafür: `assistant/proposals`.
- Stifteingabe: Pointer Events mit Druckstärke für einfache Skizzen und Markierungen auf einer eigenen Ebene (kein volles Malprogramm).
- Undo/Redo, Autosave, Offline-Bearbeitung über den vorhandenen Service Worker und IndexedDB.
- Export: PDF/X für den Druck (Anschnitt, Schnittmarken), CBZ, Webtoon-Streifen als PNG/WebP-Folge, Einzelseiten. Export immer mit Wasserzeichen nach Abschnitt 3, außer die Künstlerin wählt ausdrücklich „Druckdatei für die Druckerei“.

## 3. Schutz der Kunstwerke
Ehrlich bauen und ehrlich beschriften: **Kein Verfahren macht Bilder garantiert unlesbar für KI.** Die Oberfläche verspricht nichts, was nicht gemessen wurde.

### 3a. Wasserzeichen
- **Sichtbar:** frei konfigurierbar (Text/Logo, Deckkraft, Kachelung, Position), wird beim Export und bei Freigabe-Links angewendet, nie auf dem Original.
- **Unsichtbar und robust:** Frequenzraum-Wasserzeichen (DWT-DCT oder DWT-DCT-SVD) mit einer Nutzlast aus Künstler-ID, Asset-ID und Zeitstempel, signiert mit einem serverseitigen Schlüssel (HMAC). Ein Prüfwerkzeug „Ist das mein Bild?“ liest das Zeichen aus einer hochgeladenen Datei aus.
- Robustheitstests als Vitest-Suite: JPEG-Qualität 50–90, Skalierung 50 %, Beschnitt 10 %, leichte Drehung, Screenshot-Simulation. Die Erkennungsrate wird je Angriff protokolliert und in der App angezeigt.
- **Herkunftsnachweis:** C2PA-Manifest (Content Credentials) beim Export einbetten, sofern sich eine Bibliothek ohne Cloud-Zwang findet; zusätzlich IPTC/XMP-Felder für Urheberin, Rechte und `Data Mining: prohibited` (IPTC-Feld „Data Mining“, Wert „Prohibited“). Dazu einen Perceptual Hash (pHash) je Export in einem lokalen Register, damit Kopien wiedergefunden werden.

### 3b. „Scrambler“: Schutzschicht gegen KI-Auswertung
- Als **eigenes, austauschbares Modul** `lib/protect/` mit einer Schnittstelle `protect(image, { strength }) → image` umsetzen, damit bessere Verfahren später nachgerüstet werden können.
- Verfahren: adversariale Störung im Stil von Glaze/Mist/PhotoGuard, also kleine, für Menschen kaum sichtbare Pixeländerungen, die die Bild-Encoder gängiger offener Vision-Modelle (z. B. CLIP/SigLIP) gezielt in die Irre führen. Optimiert per PGD gegen ein lokal laufendes Open-Source-Modell, mit Wahrnehmungsgrenze (LPIPS oder SSIM) als Nebenbedingung. Läuft als separater Python-Worker (Job-Queue in Postgres, kein Cloud-Dienst), weil das GPU/CPU-lastig ist; ohne Worker meldet die App fail-closed „Schutz gerade nicht verfügbar“.
- Stufen „leicht / mittel / stark“ mit Vorher/Nachher-Vergleich und Lupe, damit die Künstlerin die sichtbare Veränderung selbst beurteilt.
- **Messen statt behaupten:** Ein Evaluationsskript vergleicht geschütztes und ungeschütztes Bild bei offenen Vision-Modellen (Ähnlichkeit der Einbettungen, Captioning-Qualität) und zeigt das Ergebnis an. In der Oberfläche steht klar: Wirkt gegen die getesteten Modelle, kann durch Weichzeichnen, Neu-Kodieren oder neuere Modelle abgeschwächt werden, und ist kein Ersatz für Wasserzeichen und Rechtehinweis.
- Reihenfolge beim Export: Schutzschicht → unsichtbares Wasserzeichen → sichtbares Wasserzeichen → Metadaten/C2PA. Ein Test stellt sicher, dass das unsichtbare Wasserzeichen nach der Schutzschicht noch lesbar ist.
- Die eigene KI-Funktion der App sendet **nie** Originalbilder an ein Sprachmodell, höchstens Text (Panelbeschreibungen). Das wird als Test abgesichert.

## Rahmen
- Jede Abfrage filtert auf `owner_id`. Keine Secrets im Code, `.env.example` mit Variablennamen pflegen.
- Barrierefreiheit WCAG 2.2 AA, Touch-Ziele ≥ 48 px, Tastaturbedienung im Seiteneditor, Alt-Texte pro Panel (auch für barrierefreien Export).
- Keine externen Laufzeit-Ressourcen (Schriften lokal, keine CDNs), strenge CSP.
- Neue Abhängigkeiten nur, wenn sie echte Arbeit sparen (z. B. `sharp`, eine Canvas-Bibliothek, `pdf-lib`), und jede wird im README begründet.
- Deutsch in Oberfläche und Commits, freundlich und ohne Fachjargon.

## Abgabe
1. Kurzer Architekturplan (Datenmodell, Module, Ablauf beim Export) **vor** dem Code.
2. Drizzle-Migrationen, API-Routen, UI, Tests. `npm test` und `npm run build` grün.
3. README-Abschnitte „Graphic Novel“, „Schutz der Kunstwerke (was es kann und was nicht)“ und „Offen“.
4. Nichts vortäuschen: Was nicht fertig ist, steht unter „Offen“, nicht als Platzhalter im Code.
