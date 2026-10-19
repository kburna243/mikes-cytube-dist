# START HERE – MY CRAZY TRIP TO ISCHIA

Nachfolger von BUNKERHAIN. Rail-/Lightgun-Shooter (Beast Busters × Zombie Raid), Fake-3D aus 2D, Bunkerhain-Look, PWA mit echtem Vollbild.

**Inhalt:** Grafik für **alle 8 Level** (29 Hintergründe, 32 Sprite-Bögen), Titelbild, Charakterbögen und das Intro-Video „Prologo“. Der Arena-Auftrag ist trotzdem nur **Meilenstein 1** (Level 1 spielbar); Level 2–8 sind danach reine Daten.

## Für Arena

1. `ARENA-PROMPT.md` vollständig lesen und als Auftrag verwenden.
2. `PLAN.md` = Spielkonzept, Technik, alle Level, Kataloge, Meilensteine.
3. `manifest.json` listet jede Datei mit direkter Raw-URL, `localPath`, Bytes und SHA256. Kein ZIP. Dateien als Binärdaten nach `localPath` laden und SHA256 prüfen.
4. `STORYBOARD-INTRO.md` = Ablauf und Dialoge des Intro-Videos.

## Inhalt

| Ordner | Inhalt |
|---|---|
| `assets/backgrounds/` | 29 Stationen (Level 1: 5, Level 2–8: je 3–4), je 1672×941 (= logische Spielauflösung); Zuordnung über `label` im Manifest |
| `assets/sprites/` | 32 Sprite-Bögen mit echtem Alpha: Gegner, Zivilisten, Fahrzeuge, Mönch, Sub-/Endbosse aller Level, 2 Projektilbögen, Items, Waffen, Hummer-Motorhaube (Overlay) |
| `assets/screens/` | Titelbild |
| `assets/story/characters/` | Charakterbögen Fried, Mr. Burna, Fraticello, Tonino (Referenz für spätere Grafik/Zwischensequenzen) |
| `cutscenes/` | `intro-prologo.mp4` (1080p, ~18 MB) und `intro-prologo-720p.mp4` (~9 MB, für Handys und Offline-Cache), H.264/AAC, 50 s, englische Dialoge; Posterbild |

## Sprite-Bögen

- Raster (2×2 bzw. 3×2) = Lesereihenfolge oben links → unten rechts. `frames[].rect` = Zelle, `bounds` = tatsächliche Motivgrenze (Alpha > 16), `pivot` = Fußpunkt (Mitte unten der Motivgrenze).
- Pro Figur **ein** Maßstab über alle Posen; relativ zum `pivot` zeichnen, nicht jede Pose auf dieselbe Höhe strecken.
- `clips` sind Vorschläge (Pose-Indizes), `notes` enthalten verbindliche Hinweise (z. B. wann ein Projektil erzeugt wird).
- `touchesCellEdge: true` heißt: Motiv berührt die Zellgrenze (betrifft: baggage-boss, dock-zombie, hummer-hood, polpo-boss, proll-zombie, sergente-boss, suora-zombie – ausladende Posen wie Tentakel, Haken, Koffer über dem Kopf) – nicht über die Zelle hinaus ausschneiden.

## Herkunft und Rechte

Alle Bilder und Clips sind mit Alibaba Bailian generiert (wan2.7-image, wan3.0-video), Stilvorlage waren die eigenen BUNKERHAIN-Grafiken, Layoutvorlage für einige Hintergründe eigene Reisefotos. Keine echten Personen, keine echten Logos, fiktive Uniformen. Orte (Flughafen Neapel) sind künstlerisch interpretiert, keine maßstabsgetreue Rekonstruktion. Comic-Gewalt ohne Blut.
