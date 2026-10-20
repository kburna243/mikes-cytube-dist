# Level 3 – Asset-Übersicht

Neapel-Fahrt bis zum fiktiv dargestellten Stadion. Die vier Hintergrundplatten sind vollständige Fernen; transparente Props, Fahrzeuge, Gegner und Bosskomponenten bleiben unabhängige Ebenen. `zwischenbild` ist eine vollflächige Zwischensequenz.

| Datei | Rolle / Verwendung | Layout / Hinweise |
|---|---|---|
| `l3a-hintergrund.png` | Quartieri-Spagnoli-Straßenzug | Vollflächige Hintergrundplatte |
| `l3b-hintergrund.png` | Lungomare und Küstenkulisse | Vollflächige Hintergrundplatte |
| `l3c-hintergrund.png` | Anfahrt zum Stadion | Vollflächige Hintergrundplatte |
| `l3d-hintergrund.png` | Fiktives Stadion-Innenbild | Vollflächige Hintergrundplatte; Fotos aus `station` nur als Architekturvorlage, keine Vereinsmarken |
| `l3-kulissen.png` | Laterne, geparkter Roller, Abfallkorb, Schrein, Palme, Straßensperre | Transparenter 3×2-Atlasabsicht; Zellgrenzen visuell prüfen |
| `l3-waescheleine.png` | Intakte und zerrissene Wäscheleine | Transparente 2-Zustands-Komposition |
| `l3-motorhaube.png` | Fahrzeughaube als Vordergrundebene | Transparenter Vordergrund; fiktives Fahrzeug ohne Marke |
| `l3-vespa-fahrzeug.png` | Roller in vier Größen/Zuständen | Transparenter 2×2-Atlasabsicht: klein, mittel, groß, Crash; nicht als echte Marke verwenden |
| `l3-ape-fahrzeug.png` | Dreirad-Nutzfahrzeug in vier Größen/Zuständen | Transparenter 2×2-Atlasabsicht; fiktive Form ohne Marke |
| `l3-strasse.png` | Asphalt-/Fahrbahntextur für pseudo-Mode-7-Streifenboden | Opaque Top-down-Textur mit Fahrbahnmarkierung; Kachelnaht und Scrollrichtung vor Verwendung visuell prüfen |
| `proll-zombie-posen.png` | Proll-Zombie-Posen | Transparenter Figurenbogen |
| `proll-zombie-sprung.png` | Proll-Zombie-Angriff/Sprung | Transparenter Aktionsbogen |
| `pizzaiolo-zombie-posen.png` | Pizzaiolo-Zombie-Posen | Transparenter Figurenbogen; Zubehör getrennt halten |
| `pizzaiolo-zombie-sprung.png` | Pizzaiolo-Zombie-Angriff/Sprung | Transparenter Aktionsbogen |
| `ultras-zombie-posen.png` | Fiktive Ultras-Zombie-Posen | Transparenter Figurenbogen ohne Vereinszeichen |
| `ultras-zombie-sprung.png` | Ultras-Zombie-Angriff/Sprung | Transparenter Aktionsbogen |
| `boss-eldiez-koerper.png` | El-Diez-Bosskörper, Normal- und Phase-2-Zustand | Zwei Körper nebeneinander, kopf- und armlos; fiktives generisches Nummer-10-Trikot |
| `boss-eldiez-arm.png` | Bossarme für Schuss- und Phase-2-Posen | Separate transparente Arme; Hand-Aura als Teil der Phase-2-Hand |
| `boss-eldiez-kopf.png` | Vier Bosskopf-Zustände | 2×2-Kompositionsabsicht: ruhig, Angriff, Treffer, Phase 2; Konturen/Pivots prüfen |
| `l3-zwischenbild-ampulle.png` | Boss lässt Ampulle fallen, Fluchtweg weist zum Hafen | Vollflächige Zwischensequenz |

Alle Straßen- und Stadionfotos dienten als Architektur-/Kompositionsreferenz. Figuren sind fiktiv; keine realen Spieler, Vereine oder Logos. Stil: kräftige Tintenlinien, satte Pixelcluster, Magenta/Limette und handgesetztes Dithering. Rasterabsichten garantieren keine sauberen Zellen oder fertigen Rig-Pivots; Bildgrenzen vor dem Einbau prüfen.

`UEBERSICHT.jpg` zeigt eine Kontaktübersicht. Nativerzeugte PNG-Größen und Alpha-Prüfungen sind im Paketmanifest dokumentiert.
