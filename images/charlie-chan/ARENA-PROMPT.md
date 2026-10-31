# ARENA-PROMPT – Charlie Chan: The Jade Dragon Case · Landing page

Copy everything below the line into Arena.

---

You are building the **interactive landing page** for a finished browser game: **"Charlie Chan in: The Jade Dragon Case"**, a pixel-art point-and-click detective adventure set in San Francisco, 1934. The game is done and included in the package – your job is the page that makes people want to play it, and lets them play it right there.

You may be a new model without any history. Read these files first (raw links work directly):

- START-HERE: https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/charlie-chan/START-HERE.md
- Asset manifest with direct download links, sizes and SHA256: https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/charlie-chan/manifest.json
- Player guide (English, source for all copy): https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/charlie-chan/GUIDE.md
- Spielanleitung (German, source for all German copy): https://raw.githubusercontent.com/kburna243/mikes-cytube-dist/main/images/charlie-chan/ANLEITUNG.md
- Look at the screenshots in `screenshots/` before you design anything – the page must feel like it belongs to this game.

## Mood

Rainy noir night in 1934 Chinatown: paper lanterns, wet cobblestones, jade green and lantern red against deep indigo, warm lamp light. Witty, warm and a little mysterious – a detective story, not a horror game. Use the game's palette (`assets/palette.json`) as the design system. Treat Chinese culture with respect: no "fortune cookie" clichés, no fake-Asian fonts, no caricature.

## Technical base (binding)

- Vite + TypeScript, plain DOM/CSS/Canvas (React is fine if you prefer it). Output is a **static `dist/`** with `base: './'` so it runs from any sub-path. No backend.
- Download every file from `manifest.json` as **binary** into `public/<localPath>` (not the GitHub HTML page) and check SHA256. Ship them with the build; **no runtime requests to GitHub or any other domain**.
- **No external fonts, CDNs, analytics, cookies or trackers** (GDPR). Fonts only self-hosted via npm `@fontsource/*` with an OFL licence – e.g. `@fontsource/silkscreen` for pixel headings and a readable body font such as `@fontsource/ibm-plex-sans`.
- Pixel art always scaled by whole numbers with `image-rendering: pixelated`; never blurry.
- Respect `prefers-reduced-motion` (turn off rain, parallax and auto-animations, keep everything usable).
- Mobile first, works from 360 px wide; Lighthouse performance and accessibility ≥ 90; keyboard navigable; real `<button>`s and alt texts.

## Languages

- English and German, switchable with a visible toggle (EN | DE) in the header. Default from `navigator.language`, remember the choice in `localStorage`.
- Use the matching screenshots (`en-*` / `de-*`) and logo (`logo-en` / `logo-de`) for the active language.
- All copy comes from `GUIDE.md` / `ANLEITUNG.md` – shorten it, but don't invent features the game doesn't have.

## Page structure

1. **Hero** – full-viewport pixel scene: the Pagoda Lane background (`assets/backgrounds/alley@4x.png`) with an animated rain canvas on top, flickering lantern glows, the logo, and Charlie Chan walking in from the side (sprite sheet `chan@6x.png`, walk cells 2–5, mirror for leftward). One line of story: "San Francisco, 1934. At the stroke of midnight, the Emperor's Jade Dragon vanished." Primary button **Play now** (scrolls to the game), secondary **How to play**.
2. **The case** – short story teaser in a typewriter effect, styled like a 1930s case file (paper, stamp "CONFIDENTIAL"). Show the broken showcase from the museum screenshot.
3. **Interactive scene** – the museum background (`museum@4x.png`) as a small "playable" teaser: invisible hotspots (showcase, glass shard, red smudge, guest book, dragon scroll) that show the game's verb line on hover/tap ("Look at broken showcase") and a short in-character line from the guide. This should feel like the real game for 10 seconds.
4. **Suspects** – six character cards with the animated sprites (`*@6x.png`, idle = cells 0 and 6 alternating, hover = walk cycle), name, role, one-line description from the guide. Cards flip or slide on hover; on mobile a swipe carousel.
5. **Locations** – the four backgrounds as parallax panels while scrolling (museum, Pagoda Lane, tea house, study) with their one-line descriptions.
6. **Screenshots** – gallery with lightbox (keyboard + swipe), active language only.
7. **Play** – section `#play` with the game embedded: `<iframe src="./game/index.html" title="Charlie Chan – The Jade Dragon Case">`, 16:10, letterboxed on dark background, with a **Fullscreen** button (Fullscreen API on the iframe) and a short controls cheat sheet next to it (verbs, right-click = look, M = sound, L = language). Load the iframe only after a click on a big "Start the case" poster (the title screenshot) to keep the page fast.
8. **How to play** – compact version of the guide's controls and the five spoiler-free hints. Put the full walkthrough behind a `<details>` with a spoiler warning.
9. **Footer** – credits: "Game, pixel art, music and code: generated procedurally", "Charlie Chan was created by Earl Derr Biggers (1925). Original story and homage, not affiliated with any rights holder.", placeholders for Impressum and Datenschutz links (just `#impressum`, `#datenschutz`).

## Motion and interaction (make it delightful, keep it light)

- Rain: one canvas, dithered pixel streaks in the palette's blues, ~60 drops, paused when off-screen or tab hidden.
- Lantern glow: CSS animation on pixel-art glows, slight random flicker.
- Scroll-driven reveals for sections (IntersectionObserver), parallax for location panels, the casebook "stamp" landing with a small screen shake.
- Custom pixel crosshair cursor on desktop (from the game: a plus-shaped crosshair, turns gold over interactive things); normal cursor on touch.
- Small sound effects (optional, off by default, toggle in header) synthesised with Web Audio like the game: soft bleeps on hover, a chime on the stamp. No audio files needed.
- No heavy libraries: no GSAP/Three.js/Lottie. CSS + a few small TypeScript modules.

## Marrying the game

The game is the static build in `game/` (from the package). It must keep working unchanged when copied to `public/game/`. Don't modify, re-bundle or restyle it – only embed it. We will later replace `public/game/` with newer builds, so treat it as an opaque folder.

## Deliverable

- Project with `npm run dev`, `npm run build` (→ `dist/`), `npm run preview`.
- README with: how assets were pulled (script that reads `manifest.json` and verifies SHA256), structure, how to swap the game build.
- Acceptance: page loads with zero network requests outside its own origin; works in EN and DE; the embedded game starts, runs and can go fullscreen; reduced-motion mode works; no blurry pixels anywhere.
