# demo-assets/audio

Hier können Hörproben für die Demo abgelegt werden.

**Benennung:** `<Track-ID>.<Endung>`, zum Beispiel `trk-101.mp3`.
Erlaubte Endungen: `.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`.

Der Server liefert eine Datei nur über den Empfängerlink aus
(`/api/l/:token/audio/:trackId`) und nur, wenn der Track zu diesem Link gehört.
Liegt keine Datei vor, zeigt der Player den ehrlichen Hinweis
„Hörprobe in der Demo nicht verfügbar".

Es werden bewusst keine Audiodateien mitgeliefert oder erzeugt.
