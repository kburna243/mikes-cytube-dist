# Mikes 420 Grindhouse — Downloads

Verteilung und Update-Feed für **Mikes 420 Grindhouse**, einen nativen Client für den
CyTube-Kanal [420Grindhouse](https://cytu.be/r/420Grindhouse) — gebaut für Fire TV,
Android TV und Mobilgeräte.

**Downloadseite:** https://kburna243.github.io/mikes-cytube-dist/
· [English](https://kburna243.github.io/mikes-cytube-dist/en/)

## Was hier liegt

| Datei | Zweck |
|---|---|
| `version.json` | Update-Feed, den die App beim Start abfragt |
| `index.html`, `en/index.html` | Downloadseite, zweisprachig |
| Release-Assets | die eigentlichen APK-/IPA-Dateien |

Die Binaries liegen bewusst als Release-Assets und nicht im Git-Verlauf — sonst würde
das Repository mit jeder Version um rund 37 MB wachsen.

## Warum dieses Repository existiert

Update-Feed und Downloads lagen zuvor hinter einer Tailscale-Funnel-Adresse. Aus dem
Tailnet war sie erreichbar, von außen brach der TLS-Handshake ab — Geräte ohne Tailscale,
etwa ein Fire TV Stick, meldeten deshalb dauerhaft „Server nicht erreichbar". GitHub ist
aus jedem Netz erreichbar; die alte Adresse bleibt in der App als Zweitquelle bestehen.

## Hinweis

Inoffizielles Fan-Projekt. Nicht mit CyTube verbunden.
