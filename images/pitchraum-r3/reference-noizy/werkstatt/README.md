# Marken-Werkstatt

Eigenstaendiges React-19-Client-Modul. Keine Laufzeitabhaengigkeiten ausser React,
React DOM und lucide-react. Rendering ausschliesslich mit Canvas 2D.

## Integration

1. Den gesamten Ordner `werkstatt/` in das Next.js-Projekt kopieren.
2. Den Default-Export aus `werkstatt/Werkstatt` einbinden. Der Import bringt das
   kleine, auf `.noizy-werkstatt` begrenzte Stylesheet mit.
3. `assetBase`, `gigs`, `gems`, `release` und gegebenenfalls `fonts` entsprechend
   den unveraenderten Typen in `types.ts` uebergeben.
4. Bei next/font die tatsaechlichen CSS-Familiennamen uebergeben, zum Beispiel
   `archivo.style.fontFamily` und `spaceMono.style.fontFamily`. Beide Fonts muessen
   auf der Zielseite eingebunden sein. Es wird keine Google-Fonts-Verbindung
   vom Modul selbst aufgebaut.
5. Tailwind v4 muss diesen Ordner scannen. Liegt er ausserhalb des automatischen
   Suchbereichs, den Pfad mit `@source` im Stylesheet der Zielseite registrieren.
6. Die vorhandenen Farb-Tokens sowie `sticker`, `type-condensed` und `font-mono`
   weiterverwenden. `src/index.css` ist nur die Token-Definition der Vorschau.

Mit `assetBase=""` werden alle `/assets/...`- und `/api/media/...`-Pfade direkt
von der Zielseite geladen. Ein Unterpfad kann als `assetBase` uebergeben werden.
Alle Asset-Pfade in `library.ts` stammen aus dem originalen Manifest.
Nur eigene, lokale Bilder verwenden temporaere `blob:`-URLs.

## Rendering Und Export

- Jede Vorlage ist eine synchrone Zeichenfunktion in `templates/`.
- `render.ts` wartet auf dekodierte CORS-Bilder und die uebergebenen Fonts.
- Das ausserhalb des DOM erzeugte Canvas hat immer die Exportabmessungen und
  wird unveraendert als Vorschau eingebaut. Der Download stammt aus diesem Canvas.
- Story-Text und Logos bleiben zwischen y=250 und y=1580. Die Hilfsflaechen
  sind separate DOM-Elemente und daher nicht Bestandteil des PNG.
- A5 enthaelt zusaetzlich 150-dpi-pHYs-Metadaten. Diese aendern keine Pixel.
- Bei A5 bleibt ein umlaufender 3-Prozent-Rand auch von Fotos und Mustern frei.
- Batch-Export arbeitet mit einem Snapshot des aktuellen Entwurfs und laedt
  nacheinander sechs PNGs herunter. Der Browser kann dafuer eine Freigabe fuer
  mehrere Downloads verlangen.
- Share-Dateien werden vor dem Klick vorbereitet, damit die Nutzeraktivierung
  fuer das native Share-Sheet erhalten bleibt. Ohne Datei-Sharing folgt Download.
- Native Sharing- und Clipboard-APIs benoetigen HTTPS oder localhost. Bei
  Einbettung in ein iframe sind die entsprechenden Berechtigungen erforderlich.

## Datenschutz Und Zustand

Eigene Fotos werden niemals versendet. Es gibt keinen Router, Server oder globalen
App-State. Der aktuelle Entwurf, die Entwuerfe je Vorlage, Format und Farbwelt
liegen unter `noizy-werkstatt-v1` im localStorage des Browsers, damit nach einem
Reload oder App-Wechsel am Handy nichts verloren geht. Eigene Fotos sind
temporaere `blob:`-URLs, werden nicht gespeichert und beim Unmount entfernt;
nach einem Reload steht dort wieder das Standardbild der Vorlage.

Der gespeicherte Zustand wird schon beim ersten Render gelesen. In Next.js das
Modul deshalb ohne SSR einbinden:
`const Werkstatt = dynamic(() => import("./werkstatt/Werkstatt"), { ssr: false })`.
Image- und Font-Caches dienen nur dazu, erneute Netzwerkzugriffe zu vermeiden.

`App.tsx` und `preview-data.ts` sind ausschliesslich die Vite-Vorschau mit den
echten Inhalten aus dem gelieferten `content.json`. Die klickbare Galerie am
Seitenende rendert jede der sechs Vorlagen im Post-Format, ebenfalls per Canvas.

## Pruefung

Die Vorschau wurde in Chromium bei 1440 px und 390 px geprueft. Die automatisierte
Canvas-Pruefung umfasst 360 Renderings: alle Formate und Themes, alle Logo-Ecken
sowie lange Texte. Alle 36 Vorlage-Format-Kombinationen wurden als PNG dekodiert
und pixelweise mit dem Canvas verglichen; Abmessungen, Safe-Zonen, Logo-Abstand,
Schreibweise und die A5-Druckmetadaten wurden ebenfalls geprueft.

Bedienung, Dateiauswahl, Bildausschnitt per Pointer und Tastatur, Clipboard und
sechs sequenzielle Downloads wurden im Browser ausgefuehrt. Der mobile Share-API-
Aufruf wurde mit einer echten PNG-Datei und aktiver Nutzeraktion per Test-Stub
geprueft. Der native Systemdialog und Instagram als Ziel benoetigen noch einen
Test auf einem echten iOS- oder Android-Geraet.