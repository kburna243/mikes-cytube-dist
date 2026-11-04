# Erlebnisregie – vom Plattenkoffer in die Berliner Nacht

## Gestaltungsentscheidung

Filmische Launch-Landingpage für musik- und adventureaffine Menschen. Visuelle Eigenständigkeit 9/10, erzählerische Motion 7/10, Textdichte 3/10. Der bestätigte Druckstil bleibt verbindlich: Papiercreme, Druckschwarz, Petrol, Rostorange. Technische Tiefe entsteht durch räumliche Komposition, Reaktion auf Eingaben, Bildübergänge und echten Klang.

## Eine zusammenhängende Reise

1. **Der Koffer öffnet sich.** Auf Anhieb stehen Logo, Leitsatz und Spiel-CTA lesbar im HTML. Dahinter ein räumlicher, mit Pointer und Touch reagierender Plattenkoffer: einfache hochwertige Geometrie für Koffer, Hüllen und Vinyl; Spielgrafiken als bewusst flache bedruckte Flächen. Eine Platte lässt sich nach vorne ziehen. Keine Ladepflicht vor Inhalt und CTA.
2. **Aus dem Label wird Berlin.** Beim Weiterblättern durch die Seite wird die kreisförmige Platte zum grafischen Übergang in die Karte. Diese Form lässt sich als separate CSS/SVG-Maske führen. Die vorhandene flache Karte wird dabei nicht in angeblich vorhandene 3D-Geometrie verwandelt. Namen und Routen liegen als klare interaktive Ebene darüber.
3. **Von der Karte auf die Straße.** Kreuzberg anwählen oder weiterscrollen führt über denselben markierten Ort zur neuen Straßenkulisse. Eine zusammenhängende Kamerabewegung präsentiert die Türen zu Mansarde, Otto und Kalter Fritte. Desktop kann einen begrenzten horizontalen Abschnitt nutzen; Mobile bekommt native horizontale Wischbewegung und sichtbare Weiter-Schaltflächen. Kein Scroll-Lock.
4. **Eine Platte finden.** Ein spielerischer Plattenkoffer zeigt wenige auswählbare Hüllen. Ziehen oder Schaltflächen holen eine Platte heraus; die Detailansicht zeigt echte Metadaten. Ein klarer Knopf startet eine Audiovorschau. Das Vinyl und eine kleine Anzeige reagieren auf den tatsächlich abgespielten Ton. Rückwärtsnavigation und Tastatur funktionieren gleichwertig.
5. **Aus der Rille wird die Nacht.** Ein kreisförmiger Übergang verbindet die ausgewählte Platte mit der Kalten Fritte. Die Szene zeigt Mona und Schnüffler, eine kurze Spielaufnahme und den Weg ins eigentliche Spiel. Texte bleiben knapp; die Seite bildet keine zweite Karriere-Engine.
6. **Ab an die Decks.** Abschließender Spiel-CTA mit ehrlichem Verfügbarkeitszustand und sichtbaren Musik-/Bildcredits.

## Motion-Regeln

| Auslöser | Dauer/Verhalten | Zweck |
| --- | --- | --- |
| erster Hero-Eintritt | 700–1100 ms, einmal pro Besuch, direkt überspringbar | Koffer, Logo und Raum etablieren |
| Scroll-Abschnitt | über einen begrenzten echten Scrollbereich; kein Zeit-Zwang | Karte, Straße und Bühne verbinden |
| Pointer-Neigung | höchstens etwa 4° und kleiner Tiefenversatz, fein reagierend | Material räumlich erfahrbar machen |
| Platte auswählen | 300–500 ms, sofort abbrechbar/ersetzbar | gewählte Platte und Fokus verständlich wechseln |
| Hover | 120–180 ms | klare Reaktion |
| Tastatur-/Fokuswechsel | sofortiger Zustand, kein Fokus-Warten und kein Kameraflug | direkte Bedienung |
| Tonreaktion | nur bei bewusst gestarteter Wiedergabe und sichtbarem Modul | Musik sichtbar machen |
| reduzierte Bewegung | statische Komposition, direkte Auswahl, keine Scroll-Pins oder Kamerafahrten | dasselbe Angebot ruhig benutzbar halten |

Text steht vor seiner Animation bereits lesbar im Dokument. Kein dauerhaftes Wippen, zufälliges Glitchen oder animiertes Rauschen über allem. Der Mauszeiger bleibt ein nutzbarer Standardzeiger; auf Touch gibt es echte Schaltflächen. Escape schließt Details, Videos und Tonmodule zuverlässig.

## Raum aus dem vorhandenen Material

Die Hintergründe sind abgeflachte Bilder. Echte separate Mittel-/Vordergrundmasken und 3D-Modelle werden nicht mitgeliefert. Mehr Tiefe entsteht aus getrennten Figuren, maßvollen Bildkarten im Raum und separat konstruierten Platten/Kofferteilen. Keine sichtbaren rechteckigen Ausschnitte als angeblich freigestellte Architektur. Kameraneigung bei flachen Bildern klein halten, damit keine leeren Ränder aufreißen.

Die Grafik bleibt matt und gezeichnet. Geometrie darf als bedruckte Pappe, abgenutztes Holz und schwarzes Vinyl erscheinen; keine polierte Science-Fiction-Welt. Ein dezenter Papier-/Druckrastereffekt kann den Wechsel zwischen DOM und GPU-Flächen verbinden. Der Text bleibt davon frei.

## Qualitätsstufen

**Voll:** ein gemeinsam verwalteter GPU-Canvas, räumlicher Koffer, ausgewählte Kamerabewegungen, Tonvisualisierung nach Nutzereingabe. **Reduziert:** wenige bewegte Bildkarten, kleinere Texturen, kein permanentes Postprocessing. **Basis:** vollständige HTML-Seite mit allen Motiven, Auswahlknöpfen, Audio-Bedienung und Spiel-CTA. Der Wechsel der Stufe bewahrt aktuelle Auswahl und Fokus.
