# START HERE – Charlie Chan in: The Jade Dragon Case

Pixel-art point-and-click detective adventure (San Francisco, 1934). 320×200 canvas, SCUMM-style verbs, four locations, English and German, autosave. Runs entirely in the browser, no server, no external requests.

**This package is for building the landing page.** The game itself is finished and included as a static build in `game/`.

## For Arena

1. Read `ARENA-PROMPT.md` and use it as the brief.
2. `manifest.json` lists every file with its direct raw URL, `localPath`, bytes and SHA256. Download files as binary into `public/<localPath>` and check SHA256. No ZIP.
3. `GUIDE.md` (English) and `ANLEITUNG.md` (German) are the player guides – use them as the source for all landing page copy (story, controls, characters, features).

## Contents

| Folder | Content |
|---|---|
| `game/` | Finished game, static build (`index.html` + one JS file). Embed with an iframe or link to it. Paths are relative (`./`). |
| `screenshots/` | 12 screenshots per language (`en-*`, `de-*`), 1280×800, scaled 4× nearest neighbour from the real game |
| `assets/backgrounds/` | The four locations without characters: `museum`, `alley` (Pagoda Lane), `teahouse`, `office` (Chan's study). Native 320×144 and `@4x` 1280×576 |
| `assets/sprites/` | One sheet per character, transparent: 7 cells of 12×34 px (`front, back, walkRight0–3, talkFront`), `@6x` = 72×204 per cell. Pivot = feet (6, 34). Mirror for walking left. |
| `assets/icons/` | The seven inventory items, 16×14, `@6x` = 96×84, transparent |
| `assets/logo/` | Title logo, transparent, `logo-en` / `logo-de`, native 240×58 and `@4x` |
| `assets/palette.json` | The game's colour palette (use it for the page design) |
| `assets/assets-meta.json` | Sizes, frame order and pivots |

Characters: `chan` (Charlie Chan), `thorne` (curator Dr. Kenneth Thorne), `lee` (night guard Lee Chen), `lin` (Madame Lin, tea house), `evelyn` (Miss Evelyn Vance), `sterling` (Inspector Harold Sterling).

## Pixel rules

- Always scale pixel art by whole numbers with `image-rendering: pixelated` (CSS) or `imageSmoothingEnabled = false` (canvas). Never smooth, never resample to odd sizes.
- Sprite animation = switching cells over time (`steps()` in CSS or a timer), not stretching.

## Origin and rights

All graphics, music and sound effects are generated procedurally in the game's own code (no AI images, no third-party assets). Story, dialogue and the supporting cast are original. Charlie Chan is the detective created by Earl Derr Biggers (first novel 1925); this game is an original homage and not affiliated with any film or TV rights holder. No real persons, no real brands.
