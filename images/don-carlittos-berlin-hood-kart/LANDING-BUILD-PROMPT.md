# Kopierfertiger Bau-Prompt

Baue eine außergewöhnlich hochwertige, interaktive 3D-Landingpage für **Don Carlittos Berlin Hood Kart**. Liefere die funktionierende Seite einschließlich aller Assets und Build-Dateien. Der visuelle Anspruch ist eine große Spieleveröffentlichung: präzise Typografie, starke Kameraführung, physisch nachvollziehbare Materialien und wenige, bewusst inszenierte Bewegungen. Vermeide austauschbare Dashboard-Karten, zufällige Effekte, generische Stockfotos und Platzhalter-Geometrie.

## Vorhandene Grundlage

Dieses Paket enthält dist/assets mit echten GLB-Modellen, zwölf Map-Icons in zwei Größen, zwölf Map-Vorschauen, Logo und Kart-Poster. asset-manifest.json inventarisiert die tatsächlich vorhandenen Dateien einschließlich Hashes. Nutze diese Dateien. Kontrolliere vor dem Implementieren jedes referenzierte Asset. Erfinde keine Assets, URLs oder Spielmechaniken. Die Map-Bausteine sind stilisierte Landmark-Interpretationen; die Vorschauen zeigen weder geografische Anordnung noch vollständige spielbare Levels.

Lies SPIELANLEITUNG.md, TECHNICAL-HANDOFF.md und dist/landing-story.json. Die Datei dist/index.html ist eine Asset-Übersicht zur Prüfung, keine fertige Landingpage. Ersetze sie erst im separaten Landingprojekt. Das bestehende Spiel bleibt ein eigenes Deployment.

## Art Direction

Grundfarbe #0B1217, warme Schrift #F6F0DF, Signalfarbe #FFD35B, Petrol #42D9CD, punktuell Koralle #FF675D. Dunkle Studiobühne mit weichem Goldlicht und kühlem Kantenlicht. Große, sehr gut gesetzte Headlines, klare deutsche Sprache und viel kontrollierter Leerraum. Verwende das vorhandene transparente Logo. Selbst gehostete, lizenzierte Schrift oder gute Systemfonts; keine ungeprüften Font-Downloads. Keine erfundenen Auszeichnungen, Rezensionen, Verkaufszahlen, Release-Termine oder Multiplayer-Versprechen.

## Dramaturgie

1. **Hero: „Dein Berlin. Dein Rennen.“** Eine echte, große 3D-Kart-Präsentation rechts; links Headline, ein kurzer Satz und „Jetzt spielen“. Oberhalb die vollständige Marke. Verwende assets/models/hero-kart.glb auf Desktop, hero-kart-mobile.glb auf schwächeren Geräten. Das Kart langsam in Dreiviertelansicht enthüllen. Nutze das Poster als sofort sichtbares Ladebild. Wenn assets/images/hero-key-art.png vorhanden ist, verwende es als atmosphärische Werbeillustration, nicht als Gameplay-Nachweis. Ein kleiner Scrollhinweis genügt.
2. **Garage: „Dein Kart. Dein Stil.“** Eine kurze, maximal etwa 160vh lange Scrollsequenz: Kamera von Dreiviertelansicht zu Rad/Body-Detail und zurück. In drei kurzen HTML-Texten auf Lack, Material und Form eingehen. Kein Explosionsdiagramm ohne tatsächlich getrennte Modellteile. Zusätzlich ein aktivierbarer „Kart drehen“-Modus mit Drag und zwei Tastatur-Buttons. Scrollen bleibt immer möglich.
3. **Kiez-Auswahl: „Zwölf Maps. Berlin im Blick.“** Alle zwölf Map-Icons als zugängliche Auswahl; Titel immer als HTML, nicht in Bildern. Beim Auswählen ein großes Map-Poster und, nach bewusstem Laden, den ersten Landmark als drehbare 3D-Vorschau zeigen. Nur eine Map-3D-Vorschau gleichzeitig laden. Alle Assets aus assets/maps/<map-id>/ verwenden. Pfeiltasten und Buttons ermöglichen dieselbe Auswahl wie Maus und Touch. Die Karte ist ein Showcase; behaupte keine Gameplay-Navigation.
4. **So spielst du.** Drei visuelle Schritte: Starten, Driften, Item einsetzen. Sichtbare Kurzsteuerung W/A/S/D, Leertaste/Umschalt, E/Enter, R, Esc, C. Vollständige Anleitung verlinken. Texte aus SPIELANLEITUNG.md übernehmen, ohne unbestätigte Features zu ergänzen.
5. **Finale: „Dein Kiez wartet.“** Kamera fährt zurück in die ursprüngliche Hero-Komposition; ein klarer Spiel-CTA. Optionaler Abschnitt „Für Pascal“ ausschließlich über Konfiguration aktivierbar. Geburtstag 24. Oktober 2026; öffentliche Standardseite ohne private Widmung, Geschenkmode mit „Alles Gute zum Geburtstag, Pascal!“.

## Technische Umsetzung

Nutze einen konsistenten Stack, bevorzugt React/TypeScript, Three.js oder React Three Fiber und GSAP ScrollTrigger. Verwende kompatible, im Zielprojekt tatsächlich installierte Versionen. Keine zweite Scroll-Engine und keine konkurrierenden Animationssysteme auf derselben Kamera. Ein Canvas, eine koordinierte Render-Schleife. DOM für Texte und Interaktionen; kein Text im Canvas. Kartenwahlzustand in React, kontinuierliche Kamerabewegung über Refs. Registrierung und Cleanup für Events, Timelines und ScrollTrigger vollständig umsetzen.

GLBs sind unkomprimiert und benötigen keinen Draco-Decoder. Hero-LOD1 ungefähr 1,5 MB, Mobile-LOD2 ungefähr 0,7 MB; exakte Bytezahlen aus dem Manifest lesen. Meshes dynamisch über BoundingBox zentrieren und einrahmen statt ungeprüfte Kamerakoordinaten festzuschreiben. Modelle verwenden Y oben und Meter. Schatten sparsam, korrekte Farbverwaltung, passendes Environment-Licht für Metallic-Materialien und einheitliches Tone Mapping. Kein teures SSAO, Tiefenunschärfe oder Bloom als Voraussetzung. DPR auf 1,5 begrenzen, mobil ggf. 1. Animationsrendering bei verborgenem Tab pausieren. Nur bei Bedarf rendern, sofern keine aktive Bewegung läuft.

## Ladeverhalten und Ausfallsicherheit

HTML und Poster zuerst; 3D erst danach. Ein Hero-Modell initial, Map-Modelle erst bei Auswahl. Keine 36 Modelle beim Seitenstart vorladen. Fehler bei GLB, fehlendes WebGL und Kontextverlust müssen in eine hochwertige statische Darstellung übergehen; Navigation und CTA bleiben nutzbar. prefers-reduced-motion respektieren: keine gepinnten Kamerafahrten und keine automatische Drehung, statische Perspektive und optionale Benutzerinteraktion. Mobil darf es keine blockierende Scrollstrecke geben. Native Scrollleiste erhalten.

## Distribution und URLs

Setze ASSET_BASE_URL und GAME_URL als zentrale Konfiguration. Nutze bei GitHub Pages den tatsächlichen Repository-Unterpfad, keine pauschalen Root-URLs wie /assets. Beispiel nur nach Einsetzen echter Werte: https://<owner>.github.io/<repository>/assets/. GitHub-Weboberflächen-Links mit /blob/ liefern keine Asset-Dateien und dürfen nicht als GLB-URL dienen. Repository und Branch nicht erraten. Das mitgelieferte dist ist eine reine Asset-Distribution und darf nicht den Build des bestehenden Spiels überschreiben. Kopiere das Asset-Verzeichnis in den öffentlichen Ordner des Landingprojekts oder hoste den gesamten Distributionsinhalt unter einem eigenen Pfad. Cross-Origin-Assets nur mit funktionierendem CORS, GLB-MIME-Type und HTTPS ausliefern.

Der Spiel-CTA nutzt ausschließlich die echte konfigurierte GAME_URL. Fehlt diese, kennzeichne den Preview-Modus ehrlich und deaktiviere den CTA mit Erklärung. Kein stiller Link auf # und keine erfundene Live-Adresse.

## Abnahme

Prüfe Desktop 1440px, Tablet 768px und Mobil 390px. Keine horizontale Scrollbar. Alle zwölf Map-Icons und Vorschauen laden. Kart und mindestens zwei Landmark-Modelle sichtbar und sinnvoll gerahmt. Tastaturbedienung, sichtbarer Fokus, Reduced Motion, WebGL-Ausfall und GLB-Ladefehler prüfen. Bei Touch kein Scrollkonflikt mit dem Modell. Keine Console-Fehler oder fehlenden Requests. Produktionsbuild muss erfolgreich sein. Berichte gemessene Performance und Tests ehrlich; keine erfundenen Lighthouse-Werte. Liefere README mit echten Start-, Build- und Deployment-Schritten, Liste geänderter Dateien und Screenshots der tatsächlichen Seite.

Erstelle jetzt die Seite vollständig und teste sie. Gib kein bloßes Konzept zurück.
