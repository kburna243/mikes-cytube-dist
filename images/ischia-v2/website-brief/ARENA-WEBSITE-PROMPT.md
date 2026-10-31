# Arena-Auftrag: MY CRAZY TRIP TO ISCHIA – Launch-Landingpage

Baue eine echte, lokal lauffähige Launch- und Präsentationsseite für **MY CRAZY TRIP TO ISCHIA – Napoli Zombie Apocalypse**, den Nachfolger von BUNKERHAIN. Liefere die implementierte Website. Ein Konzept, Mock-up oder weiterer Asset-Ordner allein erfüllt den Auftrag nicht.

## Verbindliche Ausgangsbasis

- Website-Assetliste (neues Key-Logo, Share-Bild, kuratierte Spielmotive): <https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia-v2/website-brief/website-assets.json>
- Vollständiges Spiel-Manifest (147 Dateien, Level 1–8, mit `bounds`/`pivot` je Pose): <https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia-v2/manifest.json>
- Inhalte je Level und Story-Karten: <https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia-v2/LEVEL-TRICKS.md>
- Gesamtkonzept: <https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/ischia-v2/PLAN.md>

Lies zuerst Assetliste und Manifest. Lade die benötigten Dateien unter ihren `localPath`, prüfe SHA-256. Zur Laufzeit lädt die Seite alles lokal; GitHub-Raw-URLs dürfen keine Runtime-Abhängigkeit sein. Verwende die Grafik unverändert (zuschneiden, skalieren, maskieren ja – neu zeichnen, umfärben oder KI-ersetzen nein). Das Feld `section` in der Assetliste ist ein Vorschlag, keine Pflicht.

**Das Key-Logo** (`logo/logo-ischia-key.webp`, freigestellt, 1774×862) ist das zentrale Markenbild und ersetzt die älteren SVG-Logos aus dem Spiel-Manifest auf der Website. Nicht nachbauen, nicht als Text setzen, nicht verzerren. Es braucht dunklen oder ruhigen Untergrund.

## Worum es geht (für Texte)

Fried will Urlaub in Italien. Evil Mad Mr. Burna hat nicht vergessen, dass Fried ihm letztes Halloween (BUNKERHAIN) verdorben hat – er manipuliert das Blutwunder von San Gennaro, und statt sich zu verflüssigen, verwandelt es Neapel in Zombies. Burna versteckt sich auf Ischia. Gespielt wird eine Shooting Gallery auf Schienen: Kamera fährt, stoppt, Welle kommt, zielen, schießen, nachladen, weiter. Maus, Touch und Lightgun. Touristen nicht treffen. Den Mönch schon – er lässt Waffen fallen.

Acht Level von Capodichino bis zum Castello Aragonese:

1. **Ankunft Neapel** – Vorfeld, Fluggastbrücke, Passkontrolle, Gepäckband; Boss Zoll-Kommandant
2. **Basis am Zaun** – mit Tonino den Hummer klauen; Boss Sergente
3. **Durch Neapel zum Stadion** – Hummer-Fahrt; Boss „El Diez“ (erfundene Parodie-Figur)
4. **Hafen befreien** – Molo Beverello; Boss Hafenkapitän
5. **Fähre nach Ischia** – schwankendes Deck; Boss Seeungeheuer „Polpo“
6. **Ischia Porto → Ischia Ponte** – Nacht; Bosse Limoncello-Verkäufer, Vespa-Gang-Chef
7. **Pontile → Castello** – der lange Steg; Boss Brückenwächter
8. **Showdown im Castello** – Gefängnis-Nonne, dann Evil Mad Mr. Burna

Gegnergeschosse sind „amerikanisierte“ italienische Fälschungen: Parmesan-Dosen, Ananas-Pizza, Kapsel-Espresso, Spaghetti mit Ketchup. Dieser Humor darf in die Texte, sparsam.

## Gestaltungsziel

Ein 80er-Arcade-Plakat, das in Neapel vor sich hin verrottet. Farben direkt aus dem Logo:

| Token | Wert | Einsatz |
|---|---|---|
| `--nacht` | `#050203` | Grundfläche |
| `--neon-pink` | `#f22588` | Konturen, CTA, Hervorhebung |
| `--koralle` | `#f84a70` | Untertitel-Schrift, Hover |
| `--schleim` | `#2bf202` | tropfende Kanten, Akzente, Fokusring – sparsam |
| `--gold` | `#f8d760` | Sonnenhorizont, Zahlen |
| `--adria` | `#125de7` | Verlaufsbasis, Flächen |
| `--cyan` | `#1799ef` | Himmel-Verlauf, Links |
| `--weiss` | `#f1f5f5` | Fließtext |

Signaturelemente: Sonnenuntergangs-Verlauf Adria → Cyan → Gold wie in den Logo-Buchstaben; Neon-Pink-Doppelkontur um Bildausschnitte; giftgrüner Schleim, der von Abschnittskanten tropft (als CSS/SVG-Form, nicht als neues Bild); Palmen- und Castello-Silhouetten; dezente Pixelkörnung/Scanlines. Typografie: eine sehr kräftige, kondensierte Display-Schrift für Headlines, dazu eine gut lesbare Grotesk für Text – lokal eingebunden (z. B. `@fontsource`). Headlines nie in derselben Fantasie-Optik wie das Logo nachahmen; das Logo bleibt einzigartig.

Keine SaaS-Landingpage mit drei Standardkarten, keine Reisebüro-Optik, keine austauschbaren Verlaufskacheln. Keine erfundenen Pressestimmen, Awards, Ratings, Downloadzahlen, Release-Termine oder Plattformen. Keine echten Marken, Vereine, Airlines, Fährgesellschaften oder Personen nennen; „Burna Air“, „El Diez“ und die Fähre sind erfunden – so bleibt es. Comic-Gewalt ohne Blut. Texte knapp und lebendig auf Deutsch, italienische Einsprengsel erlaubt („Andiamo!“, „Mamma mia“), aber nicht als Dauerwitz.

## Seiteninhalt

Mindestens diese verbundenen Abschnitte:

1. **Hero** – Key-Logo groß über einem Ausschnitt aus `cover-16x9` (abgedunkelt, nicht vom Logo verdeckt wirkend), eine Zeile Tagline, **JETZT SPIELEN** als Primär-CTA, sekundär „Trailer ansehen“ (Intro-Video). Auf Hochformat-Mobil darf `cover-2x3` verwendet werden.
2. **Die Geschichte** – San Gennaro, Burna, Fried; 3–4 Story-Zwischenbilder als filmischer Streifen oder Bildfolge. Kurze Sätze.
3. **Die Reise** – die acht Level als Route von Neapel nach Ischia (Karte, Fahrplan oder Ticket-Abschnitte – eigene Idee), je Level ein echter Hintergrundausschnitt, Name, ein Satz. Level, die im Spiel noch nicht spielbar sind, korrekt als „in Arbeit“ kennzeichnen (siehe unten).
4. **Die Gegner** – Auswahl von Gegnern und Zivilisten aus den `…-posen`-Bögen; Hinweis „Touristen nicht treffen, Mönch schon“.
5. **Die Bosse** – Boss-Köpfe als Steckbrief-/Fahndungsplakat-Reihe, ein Satz je Boss.
6. **So spielst du** – Zielen/Schießen, Nachladen, Chili-Granate, Mönch-Drops; Maus, Touch, Lightgun.
7. **Entstehung & Credits** – knapp: Idee/Richtung → Prompt → zusammenhängende Assets → Spielumsetzung. Fried sowie die Rollen „Prompt-Lieferant“ und „Asset-Lieferant“ sichtbar nennen, ohne Firmen oder erfundene Identitäten. Hinweis: Grafik KI-generiert (GPT-Bildgenerierung, Alibaba Bailian), Stilvorlage BUNKERHAIN, Architektur nach eigenen Reisefotos. Link zu BUNKERHAIN als Vorgänger erlaubt.
8. **Footer** – kurze technische Info, Hinweis auf Parodie/Fiktion.

Share-Metadaten: `og:image` und `twitter:image` = `social/og-image-1200x630.jpg`, sinnvolle `title`/`description`, Favicon aus einem Ausschnitt des Logos (zur Build-Zeit oder einmalig erzeugt, keine Laufzeit-Bildbearbeitung).

## Spiel-Anbindung

Der Spiel-Quellcode ist **nicht** Teil dieses Auftrags. **JETZT SPIELEN** führt auf die spielbare Fassung über eine konfigurierbare URL:

- `VITE_GAME_URL` (Standard: `/play/`). Fehlt sie oder ist sie leer, zeigt der CTA einen ehrlichen Zustand „Demo in Arbeit“ statt eines toten Links.
- Deep-Links je Level im Format `${VITE_GAME_URL}?level=N&skipIntro=1` (N = 1–8). Nur Level verlinken, die in `VITE_PLAYABLE_LEVELS` stehen (Standard: `1,2`); die übrigen als „in Arbeit“ markieren und nicht klickbar machen.
- Öffnen im selben Tab; kein iframe nötig. Keine Engine, kein Minispiel, kein Fake-Gameplay auf der Landingpage bauen.

## Intro und Motion

Optionales Intro: insgesamt 2–4 Sekunden, pro Sitzung höchstens einmal, jederzeit überspringbar, kein blockierender Countdown. Idee: Neon flackert an, Sonne sinkt hinter den Horizont im Logo-Verlauf, Schleim tropft einmal über den Bildrand – danach steht das Hero still. Bei `prefers-reduced-motion` nur das statische Hero. Kein automatisch startender Ton, Videos stumm und nur nach Klick mit Ton. Kein Stroboskop.

Konkrete Motion-Regie:

- Logo erscheint einmal (Skalierung/Maske, 600–900 ms), dann ruhig. Optional ein sehr langsamer Glow-Puls der Pink-Kontur, bei reduzierter Bewegung aus.
- Eine Zeile darf einmal umschalten, z. B. „BENVENUTI A NAPOLI.“ → „PECCATO PER GLI ZOMBIE.“ – keine Endlosschleife. Animierter Text hat eine vollständige Screenreader-Beschriftung und reservierte Fläche (kein Layout-Springen).
- Abschnitte bekommen höchstens einen zurückhaltenden Einblend-Moment beim ersten Sichtbarwerden. Kein Scroll-Jacking, keine Wort-für-Wort-Reveals.
- Sprites animieren nur mit den gemessenen `bounds`/`pivot` aus dem Manifest; Raster nicht blind teilen, viele Posen berühren Zellränder. Höchstens ein bis zwei Figuren gleichzeitig bewegt, keine Trefferpose als Dauerschleife.
- Hover-Feedback 120–180 ms.

## Performance

Nur sichtbare Bilder laden (`loading="lazy"`, passende Größen per `srcset` oder vorab skalierte Varianten). Kein Preloader für alle Assets. Intro-Video erst bei Klick laden (Poster vorher). Keine 3D-, Shader- oder Video-Abhängigkeit für Hintergrundeffekte; CSS und kleine eigene Bausteine bevorzugen, Libraries lokal statt CDN. Ziel: Hero in unter 2,5 s auf mittlerem Mobilgerät sichtbar.

## Technik

Vite + TypeScript, statisch exportierbar (`npm run build` → `dist/`). React erlaubt, aber nicht nötig. Alle Assets unter `public/`. Skripte: `dev`, `build`, `preview`, `check` (Typecheck + Build, plus vorhandene Tests). Ein kleines Skript `npm run assets` darf die Dateien aus `website-assets.json` holen und SHA-256 prüfen.

## Responsive, zugänglich, glaubwürdig

Reale Breiten 360–1920 px. Touchziele mindestens 44×44 px. Semantische Überschriften, Alt-Texte für alle Motive, sichtbare Fokuszustände (Schleimgrün auf Nacht eignet sich), ausreichender Kontrast – Fließtext nie direkt auf unruhigen Bildstellen. Motion respektiert reduzierte Bewegung. Kein Audio-Autoplay. Seite funktioniert ohne JavaScript zumindest lesbar (Inhalte im HTML, Intro als Zusatz).

## Prüfungen und Lieferumfang

Führe `npm run check` aus und prüfe im Browser Desktop (1440) und Mobil (390): Intro einmal/überspringbar, reduzierte Bewegung, Scrollen, alle Bilder lokal geladen, keine 404, CTA mit und ohne `VITE_GAME_URL`, Level-Deep-Links nur für spielbare Level, Share-Metadaten im HTML. Melde ehrlich, was geprüft wurde und was nicht.

Arbeite in dieser Reihenfolge: **(1)** Hero und echte Seitenstruktur, **(2)** Abschnitte mit echten Motiven, **(3)** Responsive, Motion, Feinschliff. Höchstens zwei gezielte Reparaturversuche je blockierendem Fehler; danach stoppen und den konkreten Fehler melden, statt Fortschritt vorzutäuschen. Keine Änderungen an den GitHub-Referenzdateien zurückpushen. Liefere die laufende Website und nenne am Ende Änderungen, reale Prüfergebnisse, verwendete Dateien und offene Einschränkungen.
