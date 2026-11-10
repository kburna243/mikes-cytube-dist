# Auftrag: The Archive – Handy-App fertig machen (PWA, iOS, Android)

## Quelle: zuerst laden
Der Ausgangsstand liegt öffentlich auf GitHub:

- Ordner: https://github.com/kburna243/mikes-cytube-dist/tree/main/images/thearchive-start/base
- Dateiliste mit direkten Links: https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/thearchive-start/manifest.json

Lade alle Einträge unter `files` in die Projektwurzel (`target`). Andere Ordner dieses Repos gehören nicht zum Auftrag, lies und verwende sie nicht. Kannst du die Dateien nicht laden, sage das sofort und baue nichts aus der Beschreibung nach.

Hängen an diesem Chat Bilder (Ablauf- oder Feature-Sheets), gelten sie als Ergänzung. Bei Widerspruch gewinnt das Aussehen der geladenen Basis.

## Worum es geht
The Archive ist ein persönliches Archiv für Sammlerinnen, Sammler und Bewahrer von Dingen mit Geschichte: Kleidung, Sneaker, Konsolen und Spiele, Sammelkarten, Schallplatten, Spielzeug. Man fotografiert ein Stück, die KI schlägt Marke, Modell, Jahrzehnt und Zustand vor, man prüft und übernimmt.

**Aussehen und Aufnahme-Ablauf sind fertig und gut. Baue sie nicht neu.** Typografie (Newsreader, Work Sans), Farben und Tokens in `app/globals.css`, die Startseite mit 3D-Szene und der geführte Ablauf „Stück aufnehmen“ bleiben in Aufbau, Sprache und Bedienung erhalten. Diese Runde macht daraus eine Handy-App, die als PWA installierbar ist und per Capacitor auf **Android und iOS** läuft, und nutzt dabei, was das Handy-OS kann.

## Das ist schon da (behalten, nur verbessern, wo unten verlangt)
- `components/identify/GuidedCapture.tsx`: sechs Kategorien mit eigenen Fotolisten, Kamera über `getUserMedia` mit Ausrichtungsrahmen, Zoom und Taschenlampe, Galerie-Import, Unschärfehinweis, JPEG-Neukodierung über Canvas.
- `app/identify/page.tsx`: sortierbarer Filmstreifen, Upload-Fortschritt je Bild, Fortsetzung nach Verbindungsabbruch (`lib/offline/capture-draft.ts`), Zähler am App-Symbol (`setAppBadge`).
- `components/identify/CaptureSuggestions.tsx`: Vorschläge einzeln übernehmen oder ändern.
- `components/identify/CaptureDeviceActions.tsx`: Barcode über `BarcodeDetector`, Benachrichtigung bei fertiger Bestimmung.
- `components/identify/ShareArchiveItem.tsx`: Teilen eines Stücks.
- `app/manifest.ts` mit Shortcut „Stück aufnehmen“ und `share_target`, `public/capture-worker.js` für geteilte Fotos und Klick auf Benachrichtigungen.

Technik bleibt: Next.js 15, React 19, TypeScript strict, Tailwind 4, @tanstack/react-query, Capacitor 8, three/@react-three/fiber, gsap, lenis. Neu erlaubt sind nur: `@capacitor/ios`, `@capacitor/haptics`, `@capacitor/share`, `@capacitor/app` (Version 8, passend zu den vorhandenen Capacitor-Paketen), `@fontsource/newsreader`, `@fontsource/work-sans`, ein lokal eingebettetes Icon-Paket für Material Symbols (Apache 2.0), `vitest`, `@testing-library/react`, `jsdom`, `fake-indexeddb`. Darüber hinaus keine neuen Abhängigkeiten.

## 1. Reparieren
- **Keine externen Requests.** `app/globals.css` lädt Material Symbols von fonts.googleapis.com, `app/layout.tsx` nutzt `next/font/google`. Beides ersetzen: Icons lokal, Schriften über @fontsource (OFL). Keine CDNs, keine Analyse-Tools. Das Aussehen darf sich dabei nicht ändern.
- **Statischer Export muss bauen** (`BUILD_TARGET=mobile` → `output: "export"`), weil daraus die Capacitor-App wird. Keine Route Handler, keine Server-Funktionen. `/items/[id]` wird zu `/items?id=…`, alle Links und `lib/platform.ts` (`itemPath`) entsprechend. In URLs stehen nur IDs. Den basePath-Mechanismus in `next.config.ts` beibehalten (Web unter `/dubs/vintage`, App am Root).
- **`middleware.ts` entfernen.** Sie prüft ein Cookie `token`, das nie gesetzt wird (die Tokens liegen im Client), und läuft im statischen Export nicht. Schutz der privaten Bereiche nur über den Client-Guard (`components/auth/ProtectedRoute.tsx`), auch im Export.
- **Eine API-Schicht.** `app/identify/page.tsx`, `app/verify-email/page.tsx`, `components/identify/UploadZone.tsx`, `lib/auth-context.tsx` und `lib/hooks/useIdentify.ts` rufen `fetch` direkt auf. Ab jetzt läuft alles über `lib/api.ts`: Bearer-Token, bei 401 genau **ein** Refresh über `POST /api/auth/refresh` (auch bei parallelen Anfragen nur einer), danach Wiederholung; scheitert er: Tokens löschen, zur Anmeldung. Fehler als `ApiError { status, detail }`, im UI als ruhige deutsche Meldung. Uploads mit Fortschritt dürfen XHR nutzen, aber nur innerhalb von `lib/`. **Keine Komponente ruft fetch direkt auf.**
- **Tokens:** im Browser in `localStorage`, in der App über das vorhandene `capacitor-secure-storage-plugin` (iOS Keychain, Android Keystore). Eine Funktion, zwei Umsetzungen.

## 2. Fotos vom iPhone und Datenschutz
Das Backend nimmt nur **JPEG, PNG und WebP bis 10 MB** an. iPhones liefern aus Kamera und Galerie oft HEIC/HEIF.
- Jedes Foto, egal woher (Kamera, Galerie, Teilen-Ziel, native Kamera), läuft durch eine gemeinsame, reine und getestete Funktion: Ausrichtung aus EXIF anwenden, längste Kante auf höchstens 2560 px, als JPEG (Qualität 0,9) neu kodieren, **alle Metadaten inklusive GPS entfernen**, Ergebnis unter 10 MB. Die Canvas-Logik aus `GuidedCapture.tsx` dorthin auslagern, nicht doppeln.
- HEIC/HEIF wird angenommen und umgewandelt, wenn der Browser es dekodieren kann (Safari, iOS-WebView). Kann er es nicht, eine verständliche Meldung („Dieses Format kann dein Browser nicht öffnen, wähle das Foto als JPEG oder mache es direkt in der App“), kein stiller Fehler. Galerie-Import und `share_target` lassen dafür auch `image/heic`/`image/heif` zu, `capture-worker.js` ebenso, die Umwandlung passiert vor dem Upload.

## 3. Native Kamera in der App
- In der Capacitor-App das vorhandene `@capacitor/camera` nutzen (`lib/native/camera.ts`). Umbauen auf `CameraResultType.Uri` statt Base64, damit große Fotos den Speicher nicht sprengen, und das Ergebnis durch die Funktion aus Abschnitt 2 schicken.
- Der geführte Ablauf bleibt gleich: gleicher Rahmen-Hinweis vor dem Auslösen, gleiche Prüfung danach. Wo das Livebild im WebView funktioniert, darf `getUserMedia` bleiben; sonst native Kamera. Eine Entscheidung je Plattform, sauber per Feature-Erkennung.
- Im Browser gilt weiter: Kamera-Livebild nur über HTTPS oder localhost, sonst automatisch `<input type="file" accept="image/*" capture="environment">` als vollwertiger Weg.
- Kamera-Tracks bei Routenwechsel und `visibilitychange: hidden` stoppen, Object-URLs freigeben, Wake Lock (`navigator.wakeLock`) während einer Aufnahmesitzung, wo vorhanden.

## 4. Was das Handy-OS kann, nutzen
Jede Funktion mit Feature-Erkennung und sauberem Rückfall, nie ein toter Knopf. Was ein Gerät nicht kann, wird nicht angezeigt.
- **Haptik** beim Auslösen, beim Abschluss eines Uploads und bei fertiger Bestimmung (`@capacitor/haptics`, im Browser `navigator.vibrate`, wo vorhanden).
- **Teilen hinaus:** `ShareArchiveItem` nutzt in der App `@capacitor/share`, im Browser die Web Share API, sonst „Link kopieren“.
- **Teilen hinein:** PWA über das vorhandene `share_target` (Android). In der Capacitor-App über Android-Intent (`ACTION_SEND`/`ACTION_SEND_MULTIPLE` für Bilder) und unter iOS über das Öffnen per URL (`@capacitor/app` `appUrlOpen`). Eine iOS-Share-Extension ist **nicht** Teil des Auftrags: nenne sie in der Liste am Ende als möglichen nächsten Schritt.
- **Zurück:** Android-Zurück-Taste und iOS-Wischgeste führen sinnvoll zurück, aus der Kamera erst in die Aufnahmeliste, nicht aus der App (`@capacitor/app` `backButton`).
- **App-Symbol:** Zähler wartender Uploads wie bisher, in der App zusätzlich nach Rückkehr aus dem Hintergrund (`appStateChange`) die Warteschlange abarbeiten.
- **Benachrichtigung „Bestimmung fertig“:** Erlaubnis erst im passenden Moment fragen (nach dem Start einer Bestimmung, mit kurzer Erklärung), nie beim ersten Start. Web Push auf iOS gibt es nur in der installierten PWA ab iOS 16.4: das ehrlich sagen. Solange das Backend keinen Push sendet, bleibt es die lokale Benachrichtigung bei geöffneter App.
- **Kein Standort, keine Kontakte, keine Hintergrund-Ortung.**

## 5. PWA
- `capture-worker.js` zu einem vollständigen Service Worker ausbauen (oder einen daneben stellen, aber nur einer ist registriert): App-Shell cache-first mit versioniertem Cache, alte Caches beim Aktivieren löschen, Offline-Seite, die erklärt, was offline geht (Aufnehmen, Warteschlange) und was nicht. **API-Antworten und Bild-URLs nie cachen.** Ziel: Die Aufnahme lässt sich auch offline **starten**, nicht nur fortsetzen, wenn sie schon offen war. Die bestehende Share-Inbox- und Benachrichtigungs-Logik bleibt erhalten. Registrierung nur im Produktions-Build und nicht in der Capacitor-Hülle.
- `app/manifest.ts` ergänzen: maskable Icon, Shortcut „Sammlung“ zusätzlich zu „Stück aufnehmen“, Farben aus den Tokens, basePath beachten.
- Installations-Hinweis: Android über `beforeinstallprompt`, iOS als kurze Anleitung („Teilen → Zum Home-Bildschirm“). Einmal, abweisbar, nicht aufdringlich, nicht in der Capacitor-App.

## 6. iOS bereit machen
- `@capacitor/ios` ergänzen, `capacitor.config.ts` um iOS erweitern (Scheme, Statusleiste und Splash passend zu den Tokens; die heutigen `#1A1A1A`-Werte an das helle Design anpassen).
- `ios/App/App/Info.plist` braucht deutsche Texte: `NSCameraUsageDescription` („The Archive braucht die Kamera, um deine Stücke zu fotografieren.“), `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`, URL-Scheme für das Öffnen per Link. Liefere die Einträge als Datei oder Patch und beschreibe die Schritte (`npx cap add ios`, `npx cap sync ios`, Öffnen in Xcode), denn Xcode läuft nicht bei dir.
- Für iOS-Safari und die installierte PWA: `viewport-fit=cover`, Abstände mit `env(safe-area-inset-*)` für Notch, Home-Leiste und die untere Navigationsleiste (`components/layout/BottomNavBar.tsx`) sowie die Vollbild-Kamera, `100dvh` statt `100vh`, `apple-touch-icon`, `apple-mobile-web-app-capable`, passende Statusleisten-Farbe, keine Zoom-Sperre, Eingabefelder mindestens 16 px (sonst zoomt iOS), `inputmode`/`autocomplete` richtig.
- Android: Kamera-Berechtigung in `AndroidManifest.xml`, WebView-Kamera-Freigabe über `onPermissionRequest`, Intent-Filter für geteilte Bilder. Nur nötige Berechtigungen.

## 7. Bedienung und Zugänglichkeit
- Komplett per Tastatur bedienbar, sichtbarer Fokus, Icon-Knöpfe mit `aria-label`, Ziele mindestens 44 px, auf 375 px ohne seitliches Scrollen, Hauptaktionen in der Daumenzone.
- Kontraste WCAG 2.2 AA, `prefers-reduced-motion` beachten (auch 3D-Szene, gsap, lenis), Systemschriftgröße respektieren (rem statt festem px für Fließtext).
- Leer-, Lade-, Fehler- und Offline-Zustände überall. Ein Serverfehler zeigt eine echte Meldung, nie Beispieldaten.
- Deutsche Texte mit echten Umlauten, „du“. Keine erfundenen Nutzer, Zahlen, Zitate oder Auszeichnungen. Für KI-Ergebnisse nicht „echt“, „verifiziert“, „garantiert“ oder „authentifiziert“ verwenden: Die KI liefert Vorschläge.

## Backend-Vertrag (FastAPI, vorhanden, nicht ändern)
| Methode | Pfad | Zweck |
|---|---|---|
| POST | `/api/auth/register`, `/login`, `/refresh` | Tokens `{access_token, refresh_token, token_type}` |
| GET | `/api/auth/me` | aktueller Nutzer |
| POST | `/api/auth/verify-email`, `/resend-verification`, `/onboarding` | Konto |
| GET / POST | `/api/items/` | Liste (`category`, `status`, `skip`, `limit` ≤ 100), Anlegen |
| GET / PATCH / DELETE | `/api/items/{id}` | Detail mit `images[]` |
| POST | `/api/items/{id}/images` | `multipart/form-data`: `file`, `view_type`, `is_primary`, `capture_position`. Nur JPEG/PNG/WebP, max. 10 MB. 409, wenn die Position anders belegt ist. |
| DELETE | `/api/items/{id}/images/{image_id}` | Bild entfernen |
| POST | `/api/items/{id}/identify` | Bestimmung starten; 400 ohne Bilder, 402 bei erschöpftem Kontingent |
| GET / POST / DELETE | `/api/collections/…` | Sammlungen |
| GET | `/api/dashboard`, `/api/market/price-estimate` | Übersicht, Preisspanne |
| GET / POST | `/api/billing/…` | Tarif |

Der Upload-Ablauf mit `capture_position` funktioniert und ist getestet: Verhalten nicht ändern, nur an die zentrale API-Schicht anschließen. Felder, die hier nicht stehen, optional typisieren, **kein `any`**.

## 8. Tests mit Vitest
Im Frontend gibt es bisher keine Tests. Lege an:
- API-Client: Bearer-Header, genau ein Refresh bei 401 auch bei parallelen Anfragen, Abmelden bei gescheitertem Refresh, `ApiError` bei Fehlern.
- Bildaufbereitung: Ausrichtung, Verkleinerung, JPEG unter 10 MB, **keine EXIF- oder GPS-Daten im Ergebnis**, verständlicher Fehler bei nicht dekodierbarer Datei.
- Unschärfeprüfung erkennt unscharf und scharf.
- Fotolisten: jede Kategorie hat eine Pflichtaufnahme, `view_type` höchstens 30 Zeichen.
- Warteschlange: speichern, bei Online-Ereignis senden, nach Erfolg löschen, Abmelden leert sie.
- Client-Guard leitet ohne Token zur Anmeldung.
- Service Worker: API- und Bild-URLs landen nie im Cache.
Tests prüfen Verträge gegen abgefangene Requests, behaupten aber keine erfolgreiche Live-Anbindung.

## Abnahme
A. Startseite, Anmeldung und Aufnahme sehen aus wie vorher, es gibt keinen Request an einen fremden Host (Netzwerk-Tab).
B. Auf 375 px: Stück aufnehmen, Kategorie Kleidung, drei Fotos, eines als unscharf gewarnt und trotzdem verwendet.
C. Ein HEIC-Foto über die Galerie übernehmen: Es kommt als JPEG ohne GPS-Daten an.
D. Flugmodus: Die Aufnahme lässt sich offline neu starten, Bilder warten sichtbar, nach dem Wiederverbinden gehen sie raus, der Zähler steht auf 0.
E. PWA installieren (Android) bzw. Anleitung sehen (iOS-Safari).
F. `BUILD_TARGET=mobile npm run build` erzeugt `out/` ohne Fehler, `npx cap sync` läuft für Android und iOS, `/items?id=…` öffnet ein Stück.
G. `npm run test` läuft grün.

## Am Ende liefern
Dateiliste der Änderungen, Startbefehle (Web, PWA, Android, iOS), alle Routen, alle angebundenen Endpunkte, Testergebnis und eine ehrliche Liste: was nur auf echten Geräten prüfbar ist (Kamera, Taschenlampe, Haptik, Teilen, Benachrichtigungen, iOS), was auf welchen Geräten nicht geht und was noch Attrappe ist. Schreibe nicht, dass etwas fertig oder sicher sei, wenn du es nicht getestet hast.
