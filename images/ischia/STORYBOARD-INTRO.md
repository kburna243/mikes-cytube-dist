# Intro „Prologo“ – Storyboard

Ziel: ca. 45–50 s, 16:9 fürs Spiel; später 9:16-Schnitt für Reels/TikTok (Italien).
Technik: Standbild (`bl image edit`, wan2.7-image, mit Charakterbögen als Referenz) → `bl video generate` (wan3.0-video, Bild-zu-Video, 1080p, 5 s, mit Ton) → ffmpeg-Schnitt mit Titelkarte. Skripte: `_gen/batch_cut.sh`, `_gen/batch_vid.sh`, `_gen/edit_intro.sh`.
Sprache: **vorerst Englisch** (Frieds Entscheidung 19.10.); Stimmen kommen aus der Tonspur von wan3.0-video, jede Figur mit fester Stimmbeschreibung (Fried: tief, warm, leichter deutscher Akzent · Burna: kratzig, theatralisch · Mönch: fröhlich, starker italienischer Akzent). Italienische Fassung später (Sprachsynthese im Token-Plan nicht freigeschaltet).

Respekt-Regel: Der Heilige und das Wunder werden nicht verspottet. Der Schurke **sabotiert** das Wunder; die Kathedrale nur als generisches neapolitanisches Gotteshaus von außen, Reliquiar frei erfunden. Keine echten Personen, keine echten Logos.

| # | Einstellung | Dialog / Ton | Datei |
|---|---|---|---|
| 1 | Rückblick Halloween, Berlin: zerstörter Rave-Bunker (Bunkerhain), Mr. Burna kriecht aus dem Schutt, Faust zum Himmel | Burna: „Fried! This is not over!“ | shot01 |
| 2 | Burnas Versteck: Karte von Neapel an der Wand, Foto von Fried mit rotem Kreuz, grüne Reagenzgläser | Burna: „You ruined my Halloween… now I will ruin your vacation!“ | shot02 |
| 3 | Neapel nachts, Kathedralenfassade, Burna schleicht mit grün leuchtender Ampulle die Treppe hoch | Glocken, Wind | shot03 |
| 4 | Nahaufnahme: Burnas Handschuhe tauschen in einem prunkvollen, erfundenen Reliquiar die alte Ampulle gegen eine giftgrüne | Burna flüstert: „A little miracle… all mine.“ | shot04 |
| 5 | Morgen, Platz voller Menschen, das Reliquiar wird gehoben, es leuchtet GRÜN, grüner Nebel – Nonna, Pizzaiolo, Carabiniere werden zu Comic-Zombies | Menge: „A miracle!“ – „Wait… why is it green?!“ | shot05 |
| 6 | Fried im Flieger, Espresso, Golf von Neapel im Sonnenuntergang, Zwinkern | Fried (seufzt): „Finally… vacation.“ | shot06 (Test fertig) |
| 7 | Landung: ein Zombie im Warnwestenoutfit klatscht von außen gegen das Fenster, Fried prustet den Espresso aus | Fried: „Mamma mia!!“ | shot07 |
| 8 | Fluggastbrücke: der kleine Mönch springt hinter einem Koffer hervor und wirft Fried Pistole und Glücks-Chili zu | Mönch: „Take this, my son! For good luck!“ | shot08 |
| 9 | Fried fängt beides, Sonnenbrille fällt auf die Nase, lädt durch, grinst in die Kamera | Fried: „Ischia… here I come!“ → Titelkarte | shot09 |

Musik: Tarantella-Rhythmus trifft Rave-Bass (Bunkerhain-Vorgänger). Später eigener Track; bis dahin Modellton + synthetisches Bett.
