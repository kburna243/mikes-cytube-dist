# Prüfbericht zur AI-Studio-Lieferung

Stand: 23. Oktober 2026. Übernommen wurden ausschließlich `modules/`, `tests/modules/`, `workers/scrambler/`, `tests/eval/` und `e2e/`. Der veraltete Hauptcode und mitgelieferte Python-Caches wurden nicht übernommen.

## Krita und Archive

Der ursprüngliche Schutz war unzureichend: `JSZip.loadAsync(checkCRC32: true)` dekomprimierte vor den Größenprüfungen sämtliche Einträge. Jetzt werden Central Directory und lokale Header vorab geprüft, gefährliche Pfade einschließlich Unicode-Pfadextras und doppelte Namen abgelehnt sowie komprimierte und tatsächlich entpackte Größen begrenzt. CRC-Prüfung erfolgt nach begrenzter selektiver Extraktion. ZIP64, verschlüsselte und mehrteilige Archive werden nicht unterstützt.

`extractKraLayers` war kein vollständiger Krita-Renderer. Fehlerhafte Kacheln konnten stille Leerbilder erzeugen; bei LZF fehlte die Rekonstruktion der Farbkanäle. Korrigiert und durch Vergleiche dekodierter RGBA-Pixel geprüft. Unterstützt sind begrenzte 8-Bit-RGBA-Paint-Layer, PNG und VERSION-2-Kacheln. Gruppen, Masken, Vektoren, CMYK und HDR werden nicht vollständig gerendert. Der Test verwendet eine quellenbasierte Binärfixture, keine aus Krita exportierte Beispieldatei. Der Upload speichert das Original unverändert; Bildvarianten entstehen aus dem Composite.

## EPUB und Druckdaten

EPUB ist am bestehenden Export nach der Schutzpipeline angeschlossen. Tests prüfen ZIP-Anordnung, unkomprimiertes `mimetype`, OPF, Navigation und Spine. Ein EPUBCheck sowie Prüfungen in konkreten Lesegeräten stehen aus.

Alle nicht vollständig belegten `geprueft`-Markierungen wurden auf `false` gesetzt. Die offizielle Printful-Postkartenquelle nennt beispielsweise 4 × 6 Zoll und belegt die behauptete DIN-A6-Vorlage nicht. Die Vorlagen sind Arbeitsvorgaben, keine bestätigten Bestellparameter. Merch prüft Dateien gegen die tatsächlichen Produktmaße und meldet ungeprüfte Vorgaben sichtbar.

## Scrambler

Der gelieferte Worker konnte ohne echtes Modell auf einen deterministischen Ersatzencoder zurückfallen. Das ist kein Wirksamkeitsnachweis. Dieser Produktionsfallback wurde entfernt; Testencoder sind ausschließlich für Tests erlaubt. HMAC und optionaler Bearer-Token werden getrennt geprüft. Der Server signiert die exakten Request-Bytes und akzeptiert nur PNG-Ergebnisse in Originalgröße mit gemeldeter SSIM ≥ 0,97.

Python 3.11 und die gepinnten CPU-Abhängigkeiten wurden in einer lokalen venv auf I: installiert. **10 pytest-Prüfungen bestanden.** Der echte Offline-CPU-Lauf verwendete vortrainiertes CLIP ViT-B-32 und SigLIP auf einem 48 × 48 Pixel großen Testbild mit sechs PGD-Schritten: SSIM **0,9886283363**, PSNR **39,1098 dB**, Ziel-Kosinus **1 → 0,55434**, Transfer-Kosinus **1 → 0,91605**. Verarbeitung **2,563 s**, Gesamtlauf einschließlich Modellladen **50,609 s**, gemessener Peak-RAM **1.653.829.632 Byte**. Vollständige Messdaten und Grenzen: [workers/scrambler/INTEGRATION.md](workers/scrambler/INTEGRATION.md) und `cpu-measurements.json`. Ein kleines Bild ist kein allgemeiner Wirksamkeitsnachweis; GPU/4-GB-VRAM wurden nicht geprüft.

## Auswertung und Playwright

Die TypeScript-Auswertung läuft in `npm test` ohne Python und Netzwerk. Ihre mitgelieferten Encoder sind als Mock gekennzeichnet; daraus darf keine CLIP-/SigLIP-Wirksamkeit abgeleitet werden.

Die E2E-Lieferung enthielt echte Playwright-Aufrufe, aber auch selbstgeschriebene Ersatztypen und mehrere falsche Erwartungen: Asset-Hülle, Sprechblasenroute, Scramblerroute sowie ein Zugriff auf localStorage vor der Navigation. Das wurde korrigiert. `e2e/` hat eine eigene `package.json` und echte Playwright-Abhängigkeiten; es ist vom Typecheck und Testlauf des Hauptprojekts getrennt. Die alte Shim-Datei enthält keine Ersatztypen mehr.

## Prüfstand

Die abschließende Prüfung `npm run check` bestand: TypeScript, **93 Vitest-Tests in zwölf Dateien** und Produktionsbuild. **Zwölf echte Playwright-Tests** bestanden in **24,7 Sekunden**, jeweils auf Desktop (1440 × 900) und Tablet mit Touch (1194 × 834). Darunter: vorhandene Anmeldung, Assets, Doppelseite, tatsächliche Sprechblasengeometrie, PDF, Bilddaten-Verbot, Scrambler-503, alle Studio-Bereiche, Rückkehr zu Federführer und Speichern beim Seitenwechsel vor Ablauf des Autosave-Intervalls. Nach der letzten Korrektur des Projekte-Knopfs bestanden die beiden Studio-Browserprüfungen erneut (**50,8 Sekunden** einschließlich Serverstart). Die E2E-Typprüfung bestand ebenfalls. Der von Playwright gestartete Entwicklungsserver wurde beendet; `/api/health` ist danach nicht mehr erreichbar.

Der erste parallele Lauf überlastete die PGlite-Initialisierung. Vitest läuft jetzt seriell mit einem Worker. Der Build meldet lediglich die bestehende Größenwarnung für das Hauptbundle. Es wurden keine Tests übersprungen und keine Ersatztests als echte Browser- oder Modellmessung ausgegeben.

Unabhängige Codeprüfung durch getrennte Agenten: Modulprüfung, Frontend-Verträge und Speicherung, Worker-HMAC/echte Encoder sowie E2E-Abgrenzung. Dabei gefundene Fehler (EPUB-Flexlayout, Exporttransformationen, Autosave-Abbruch und Duplikate nach teilweise erfolgreichem Speichern) wurden korrigiert und durch passende Regressionen abgesichert.

Der Browserlauf fand außerdem einen bestehenden Absturz nach Anmeldung: Die alte Oberfläche fragte `/entities/undefined/facts` ab. `getFacts()` verwendet jetzt die authentifizierte Gesamtroute `/api/v1/facts`; ungültige Entitäts-UUIDs werden mit 400 abgelehnt, ohne den Prozess zu beenden. Der E2E-Test prüft danach weiterhin den Healthcheck.

Serverbetrieb und Deployment aus HANDOFF Abschnitt E wurden nicht ausgeführt.
