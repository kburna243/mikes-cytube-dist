# Arena-Auftrag: BUNKERHAIN Launch-Website mit spielbarem Shooter

Baue eine echte, lokal lauffähige Präsentations- und Start-Website für **BUNKERHAIN**, und integriere den vorhandenen Shooter so, dass man ihn direkt auf der Website spielen kann. Liefere die implementierte Website samt Spielintegration. Ein Konzept, Mock-up oder weiterer Asset-Ordner allein erfüllt den Auftrag nicht.

## Verbindliche Ausgangsbasis

Verwende ausschließlich die aktuelle Shooter-Version A aus diesem vollständigen Snapshot:

- Projekt samt Quellcode, Tests und Assets: <https://github.com/kburna243/mikes-cytube-dist/tree/main/images/bunkerhain/current-shooter>
- Projektdateiliste mit Raw-URLs, SHA-256 und lokalen Zielpfaden: <https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/bunkerhain/current-shooter/project-files.json>
- Ergänzungsmanifest für die Animations- und Erweiterungs-Assets: <https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/bunkerhain/expansion-v2/manifest.json>

Lies zuerst Dateiliste und Manifeste. Hole Projektdateien und 22 PNGs in ihre dokumentierten lokalen Pfade und prüfe beim Übernehmen die SHA-256-Werte. Bilder müssen zur Laufzeit aus dem lokalen Projekt geladen werden; GitHub-Raw-URLs dürfen keine Runtime-Abhängigkeit sein. Exportiere alle benötigten Dateien aus `public/` mit der Website. Verwende die bestehenden Sprites, Hintergründe und Sheets unverändert. Zeichne die Spielgrafik nicht nach.

Die Basis ist **Version A des Shooters**: React und TypeScript für Menü/Oberfläche, Canvas 2D für das Spiel; Level 1 im Bunker und Level 2 am Boxhagener Platz mit drei Szenen, Fledermäusen, Handtaschen-Oma, separaten Handtaschen-Projektilen, Health, Schild und Shotgun/SMG/Basskanone. Es gibt 20 bestehende Tests; Testlauf, TypeScript-Prüfung und Build waren bereits erfolgreich. Ein vollständiger natürlicher Spieldurchlauf wurde noch nicht geprüft. Stelle die vorhandenen Version-A-Tests als Ausgangspunkt dar, ohne daraus vollständige Spielfertigstellung abzuleiten. Die alte Lauf- und Dialogversion 2 sowie die alte reine Shooter-Baseline sind **keine** Implementierungsgrundlage.

## Gestaltungsziel

Erzeuge eine filmische, vollflächige, redaktionell gestaltete Game-Launch-Seite — wie ein eigenständiges Clubposter, das sich in eine spielbare Nacht öffnet. Dunkler Beton, Körnung und harte Kanten treffen auf Neon-Pink `#ff2d78`, Giftgrün `#7dff5a` und sparsam eingesetztes Gold aus dem Spiel. Setze große, eigenständige Typografie, dramatische Ausschnitte der echten Hintergründe und Figuren, kurze kräftige Textmomente und klare Spiel-CTAs ein.

Keine SaaS-Landingpage mit drei Standardkarten, generische Verlaufskacheln oder austauschbare Dashboard-Optik. Keine erfundenen Pressestimmen, Awards, Teamnamen, Ratings oder Behauptungen über einen fertigen Vollrelease. Schreibe knapp und lebendig auf Deutsch. Mache Fried und die Rollen „Prompt-Lieferant“ und „Asset-Lieferant“ als Mitwirkende sichtbar, ohne ihnen Unternehmen oder erfundene Identitäten zuzuschreiben. Erkläre knapp: Idee/Richtung → Prompt → zusammenhängende Assets → Shooter-Umsetzung.

## Seiteninhalt und Intro

Baue mindestens diese verbundenen Abschnitte: Hero mit Titel und **JETZT SPIELEN**; knappe Entstehungsgeschichte; die Bunkernacht mit Level 1; der Übergang zum Boxhagener Platz und Level 2; Gegner und zivile Clubgäste; Health, Schild und die drei Sonderwaffen; klare technische Kurzinfo und Credits. Verwende die realen Assets und benenne geplante oder ungeprüfte Dinge korrekt. Das Spiel muss aus der Website erreichbar sein — zum Beispiel über einen Gameplay-Abschnitt oder einen eindeutig anwählbaren Spielmodus. **JETZT SPIELEN** springt direkt dorthin.

Optionales Intro: insgesamt 2–4 Sekunden, pro Sitzung höchstens einmal, jederzeit überspringbar und ohne blockierenden Countdown. Ein kurzer Tür-/Neon-Moment mit wenigen kinetischen Texten genügt; danach steht das Hero still. Bei `prefers-reduced-motion` nur ein statisches Bild zeigen. Kein automatisch startender Ton. Stroboskop standardmäßig aus; falls in einer expliziten Spieleinstellung vorhanden, auf höchstens 3 Hz begrenzen. Setze beim Scrollen dezente Bewegungen ein, keine langen Wort-für-Wort-Reveals und kein Scroll-Jacking. Sprites animieren nur anhand der konkreten Frame-Rechtecke und Clips im Manifest; interpretiere Raster oder Idle-/Hit-Pose nicht blind.


### Konkrete Motion-Regie

Im Hero darf der Titel einmal aus zwei bis drei großen maskierten Wortgruppen erscheinen: etwa 600–900 ms insgesamt, mit kurzem Versatz. Danach bleibt er lesbar stehen. Eine zweite kurze Zeile darf sich von „DIE NACHT IST NICHT VORBEI.“ zu „DER MORGEN AUCH NICHT.“ umschalten, bevor die Boxi-Sektion folgt; keine Endlosschleife mit ständig wechselnden Texten. Animierter Text behält eine verständliche vollständige Screenreader-Beschriftung. Reserviere seine Fläche, damit sich der Seiteninhalt nicht verschiebt.

Sektionen bekommen höchstens einen zurückhaltenden Einblend-/Versatz-Moment beim ersten Sichtbarwerden. Maximal ein bis zwei Sprite-Gesten gleichzeitig als Charakter-Spotlight; kein permanentes Zappeln aller Figuren. Verwende Idle-/Warn-/Flugclips passend zum Motiv und niemals eine Trefferpose als Dauerschleife. Die Website ist kein automatisch laufender Gegnerkampf. Hover-Feedback an Maus-Buttons kurz, etwa 120–180 ms; Tastaturaktionen ohne inszenierte Warteanimation. Bei reduzierter Bewegung alles sofort im endgültigen Zustand zeigen.

Die Website muss vor Spielstart nur ihre tatsächlich sichtbaren Bilder laden. Nicht alle 22 PNGs und die Engine als blockierenden Landingpage-Preloader starten. Keine Video-/3D-/Shader-Abhängigkeit nur für einen Nebeleffekt einführen. Wenn Framework-Animation verwendet wird, lokal installieren statt CDN, aber CSS/kleine vorhandene Bausteine bevorzugen.

## Shooter integrieren, bestehende Logik erhalten

Integriere den echten Version-A-Shooter, kein nachgebautes Showcase-Minispiel. Erhalte Gegner- und Bosslogik, Treffer, Projektile, Waffen und Munition, Health/Schild, Levelübergänge, Pause, Nachladen, Audio, Touch-Steuerung, Ladefehler mit Dateiname, Timeout und Retry. Baue eine klare Rückkehr zur Website ein. Der Spielbereich braucht Canvas, sichtbares DOM-HUD, Pause/Resume, Responsive-Skalierung und auf Wunsch Vollbild nach einer Nutzeraktion.

Initialisiere Assets und Engine erst, wenn der Gameplay-Bereich geöffnet wird. Vorher bleibt die Website sofort sichtbar und benutzbar. Montiere beim Spieleinstieg zuerst das sichtbare Canvas und erzeuge erst danach die Engine mit dem echten Canvas-Element; ein noch nicht vorhandenes Canvas darf keinen scheinbar gestarteten Spielmodus ergeben. Vermeide Engine-Neustarts bei normalen React-Rendern; beim Verlassen des Spiels sauber Animation-Loop, Tastatur-/Pointer-Listener und Audio stoppen und Ressourcen freigeben. Pausiere bei verborgenem Tab und berücksichtige ein Rückkehren in den pausierten Spielzustand. Beim Rückweg zur Website darf kein Ton oder Input-Listener weiterlaufen. Zeige Ladefortschritt sowie die vorhandene verständliche Ladefehlermeldung mit erneuter Ladeaktion.

Die Spiel-CSS setzt global `body { overflow: hidden }`; kapsle diese Regel auf den Spielmodus. Die Website muss normal scrollen. Aktiviere globale Pointer- und Tastatursteuerung nur während aktiven Gameplays. Menü-HUD, Buttons und Website-Controls dürfen keine unbeabsichtigten Schüsse auslösen. Der normale Website-Cursor bleibt erhalten; das Fadenkreuz gehört nur auf die Spielfläche. Fange Leertaste/Pfeile nicht ab, wenn ein Formularfeld oder fokussierter Button sie benötigt. Hash/Route oder klarer React-Modus müssen Zurücknavigation und Deep-Link in Gameplay erlauben, ohne einen zweiten Game-Engine-Einstieg zu bauen.

## Responsive, zugänglich, glaubwürdig

Gestalte reale Breiten von 360 bis 1920 Pixeln. Touchziele mindestens 44×44 px; Canvas und HUD dürfen auf Mobilgeräten weder abgeschnitten noch mit Seitencontent überlagert werden. Nutze semantische Überschriften, Alt-Texte, sichtbare Fokuszustände, ausreichenden Kontrast und verständliche Beschriftungen. Motion respektiert die reduzierte Bewegung. Kein Audio-Autoplay. Bestehende Spielsteuerung muss mit Touch, Maus und Tastatur erreichbar sein.

## Prüfungen und Lieferumfang

Erhalte bestehende Test- und Check-Skripte sowie alle 20 Tests. Ergänze gezielte Integrationstests für neue Navigation, Lazy-Initialisierung und Engine-Cleanup, wenn sie die neuen Risiken wirklich prüfen. Führe den bestehenden Check aus und behebe Regressionen. Prüfe die Seite im Browser auf Desktop und Mobilbreite: Einstieg, Scrollen, Start L1 und L2, Nachladen, Pause/Weiter, Rückkehr zur Website und dreimaliges Starten/Verlassen ohne doppelte Loops, Audio-Reste oder Listener-Leaks. Prüfe auch fehlende Assets/Retry und dass sämtliche benötigten Assets lokal eingebunden sind. Ein Test, der intern Spielzustände erzwingt, ersetzt keinen natürlichen manuellen Spieldurchlauf; kennzeichne dessen Status ehrlich.

Arbeite in dieser Reihenfolge: **(1)** Hero und echte Website-Struktur, **(2)** vorhandenen Shooter korrekt integrieren, **(3)** responsive Details und Feinschliff. Halte Implementierung klein und überprüfbar. Nutze höchstens zwei gezielte Reparaturversuche je blockierendem Fehler. Wenn danach etwas Wesentliches scheitert, stoppe und melde den konkreten Fehler, statt Fortschritt vorzutäuschen.

Implementiere Website und Spielintegration in deiner Arena-Projektkopie. Die GitHub-Ordner sind die herunterzuladende Referenz, nicht die Zielstruktur einer zweiten verschachtelten App. Ändere in deiner Kopie die nötigen React-Einstiegspunkte und kapsle den bisherigen App-Spielbildschirm beispielsweise als GameShell, ohne die bewährte Engine neu zu schreiben. Keine eigenmächtigen Änderungen am GitHub-Referenzstand zurückpushen. Liefere die tatsächlich laufende Website und nenne am Ende Änderungen, reale Prüfergebnisse, verwendete Dateien und offene Einschränkungen.
