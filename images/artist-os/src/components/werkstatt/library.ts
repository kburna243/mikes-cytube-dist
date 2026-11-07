import type { LibraryAsset, TextureId } from "./types";

// Relative paths and dimensions from the supplied brandkit manifest.
export const LIBRARY: readonly LibraryAsset[] = [
  {
    "path": "/assets/brandkit/logo-badge-flat.png",
    "role": "logo",
    "width": 1249,
    "height": 1198,
    "name": "Hauptlogo ohne Schlagschatten"
  },
  {
    "path": "/assets/brandkit/logo-badge.png",
    "role": "logo",
    "width": 1280,
    "height": 1229,
    "name": "Hauptlogo (Sticker-Badge), Neighbor-Schreibweise"
  },
  {
    "path": "/assets/brandkit/skyline-ink.png",
    "role": "logo",
    "width": 865,
    "height": 530,
    "name": "Berliner Skyline mit Fernsehturm, eingefärbt"
  },
  {
    "path": "/assets/brandkit/skyline-paper.png",
    "role": "logo",
    "width": 865,
    "height": 530,
    "name": "Berliner Skyline mit Fernsehturm, eingefärbt"
  },
  {
    "path": "/assets/brandkit/skyline-sunburst.png",
    "role": "logo",
    "width": 865,
    "height": 530,
    "name": "Berliner Skyline mit Fernsehturm, eingefärbt"
  },
  {
    "path": "/assets/brandkit/skyline-vinyl.png",
    "role": "logo",
    "width": 865,
    "height": 530,
    "name": "Berliner Skyline mit Fernsehturm, eingefärbt"
  },
  {
    "path": "/assets/brandkit/wordmark-ink.png",
    "role": "logo",
    "width": 986,
    "height": 525,
    "name": "Schriftzug DJ Noizy Neighbor, eingefärbt"
  },
  {
    "path": "/assets/brandkit/wordmark-paper.png",
    "role": "logo",
    "width": 986,
    "height": 525,
    "name": "Schriftzug DJ Noizy Neighbor, eingefärbt"
  },
  {
    "path": "/assets/brandkit/wordmark-sunburst.png",
    "role": "logo",
    "width": 986,
    "height": 525,
    "name": "Schriftzug DJ Noizy Neighbor, eingefärbt"
  },
  {
    "path": "/assets/brandkit/wordmark-vinyl.png",
    "role": "logo",
    "width": 986,
    "height": 525,
    "name": "Schriftzug DJ Noizy Neighbor, eingefärbt"
  },
  {
    "path": "/assets/ui/badge-album.webp",
    "role": "ui",
    "width": 103,
    "height": 35,
    "name": "Label-Sticker (alt, mit Schrift im Bild)"
  },
  {
    "path": "/assets/ui/badge-ep.webp",
    "role": "ui",
    "width": 66,
    "height": 35,
    "name": "Label-Sticker (alt, mit Schrift im Bild)"
  },
  {
    "path": "/assets/ui/badge-event.webp",
    "role": "ui",
    "width": 102,
    "height": 35,
    "name": "Label-Sticker (alt, mit Schrift im Bild)"
  },
  {
    "path": "/assets/ui/badge-live.webp",
    "role": "ui",
    "width": 83,
    "height": 35,
    "name": "Label-Sticker (alt, mit Schrift im Bild)"
  },
  {
    "path": "/assets/ui/badge-new.webp",
    "role": "ui",
    "width": 85,
    "height": 35,
    "name": "Label-Sticker (alt, mit Schrift im Bild)"
  },
  {
    "path": "/assets/ui/divider-berlin-skyline.webp",
    "role": "ui",
    "width": 335,
    "height": 40,
    "name": "Trenner-Grafik"
  },
  {
    "path": "/assets/ui/divider-tonearm-needle.webp",
    "role": "ui",
    "width": 310,
    "height": 40,
    "name": "Trenner-Grafik"
  },
  {
    "path": "/assets/ui/hero-skyline-banner.webp",
    "role": "ui",
    "width": 743,
    "height": 143,
    "name": "Banner Skyline-Sonnenuntergang"
  },
  {
    "path": "/assets/ui/illu-headphones.webp",
    "role": "ui",
    "width": 117,
    "height": 135,
    "name": "Illustration (Strich, einfarbig)"
  },
  {
    "path": "/assets/ui/illu-record-crate.webp",
    "role": "ui",
    "width": 123,
    "height": 135,
    "name": "Illustration (Strich, einfarbig)"
  },
  {
    "path": "/assets/ui/illu-spraycan.webp",
    "role": "ui",
    "width": 125,
    "height": 135,
    "name": "Illustration (Strich, einfarbig)"
  },
  {
    "path": "/assets/ui/illu-vinyl-record.webp",
    "role": "ui",
    "width": 120,
    "height": 135,
    "name": "Illustration (Strich, einfarbig)"
  },
  {
    "path": "/assets/ui/pattern-70s-waves.webp",
    "role": "ui",
    "width": 191,
    "height": 115,
    "name": "70er-Wellen"
  },
  {
    "path": "/assets/ui/pattern-berlin-skyline.webp",
    "role": "ui",
    "width": 165,
    "height": 115,
    "name": "Berlin-Skyline"
  },
  {
    "path": "/assets/ui/pattern-vinyl-stacks.webp",
    "role": "ui",
    "width": 189,
    "height": 115,
    "name": "Vinyl-Stapel"
  },
  {
    "path": "/assets/ui/ui-grooves-texture.webp",
    "role": "ui",
    "width": 129,
    "height": 143,
    "name": "Textur-Overlay (Papier, Rillen, Vinyl)"
  },
  {
    "path": "/assets/ui/ui-vintage-paper-texture.webp",
    "role": "ui",
    "width": 115,
    "height": 143,
    "name": "Textur-Overlay (Papier, Rillen, Vinyl)"
  },
  {
    "path": "/assets/ui/ui-vinyl-texture.webp",
    "role": "ui",
    "width": 129,
    "height": 143,
    "name": "Textur-Overlay (Papier, Rillen, Vinyl)"
  },
  {
    "path": "/assets/brandkit/hintergruende/berlin-nacht-1080x1920.jpg",
    "role": "photo",
    "width": 1080,
    "height": 1920,
    "name": "Hintergrund Berlin bei Nacht"
  },
  {
    "path": "/assets/brandkit/hintergruende/plattenladen-1080x1920.jpg",
    "role": "photo",
    "width": 1080,
    "height": 1920,
    "name": "Hintergrund Plattenladen"
  },
  {
    "path": "/assets/brandkit/hintergruende/studio-1080x1920.jpg",
    "role": "photo",
    "width": 1080,
    "height": 1920,
    "name": "Hintergrund Studio"
  },
  {
    "path": "/assets/photos/photo-01-cratedigging-record-store.webp",
    "role": "photo",
    "width": 1696,
    "height": 2528,
    "name": "Crate Digging"
  },
  {
    "path": "/assets/photos/photo-02-studio-mpc-beatmaking.webp",
    "role": "photo",
    "width": 1696,
    "height": 2528,
    "name": "An den 16 Pads"
  },
  {
    "path": "/assets/photos/photo-03-live-dj-set-turntables.webp",
    "role": "photo",
    "width": 1696,
    "height": 2528,
    "name": "Live an den Turntables"
  },
  {
    "path": "/assets/photos/photo-04-berlin-night-record-bag.webp",
    "role": "photo",
    "width": 1696,
    "height": 2528,
    "name": "Berliner Nacht"
  },
  {
    "path": "/assets/photos/photo-05-backstage-greenroom-talk.webp",
    "role": "photo",
    "width": 1696,
    "height": 2528,
    "name": "Backstage-Gespräche"
  },
  {
    "path": "/assets/photos/photo-06-portrait-backstage-moody.webp",
    "role": "photo",
    "width": 1696,
    "height": 2528,
    "name": "Backstage-Porträt"
  },
  {
    "path": "/assets/photos/photo-07-venue-outdoor-crate-check.webp",
    "role": "photo",
    "width": 1696,
    "height": 2528,
    "name": "Vor dem Gig"
  },
  {
    "path": "/assets/photos/photo-08-street-club-entrance-night.webp",
    "role": "photo",
    "width": 1696,
    "height": 2528,
    "name": "Vor dem Club"
  },
  {
    "path": "/assets/photos/photo-09-backstage-vinyl-selection.webp",
    "role": "photo",
    "width": 1696,
    "height": 2528,
    "name": "Vinyl-Auswahl"
  },
  {
    "path": "/assets/releases/back-on-16-pads.webp",
    "role": "release-cover",
    "width": 1000,
    "height": 1000,
    "name": "Back on 16 pads"
  },
  {
    "path": "/assets/gems/arita-shintaro.webp",
    "role": "gem-cover",
    "width": 480,
    "height": 480,
    "name": "Arita Shintaro"
  },
  {
    "path": "/assets/gems/crate-to-pad.webp",
    "role": "gem-cover",
    "width": 368,
    "height": 368,
    "name": "Crate to Pad"
  },
  {
    "path": "/assets/gems/drum-break.webp",
    "role": "gem-cover",
    "width": 480,
    "height": 480,
    "name": "Drum Break"
  },
  {
    "path": "/assets/gems/noizy-in-space.webp",
    "role": "gem-cover",
    "width": 720,
    "height": 406,
    "name": "Noizy in Space"
  },
  {
    "path": "/assets/gems/polydor.webp",
    "role": "gem-cover",
    "width": 368,
    "height": 368,
    "name": "Polydor"
  },
  {
    "path": "/assets/gems/shaolin.webp",
    "role": "gem-cover",
    "width": 1000,
    "height": 1000,
    "name": "Shaolin Soundtrack"
  },
  {
    "path": "/assets/gems/yuen-biao.webp",
    "role": "gem-cover",
    "width": 1000,
    "height": 1334,
    "name": "Yuen Biao"
  },
  {
    "path": "/assets/merch/merch-denim-jacket.webp",
    "role": "merch",
    "width": 328,
    "height": 315,
    "name": "merch-denim-jacket"
  },
  {
    "path": "/assets/merch/merch-hangtag.webp",
    "role": "merch",
    "width": 175,
    "height": 315,
    "name": "merch-hangtag"
  },
  {
    "path": "/assets/merch/merch-ringer-tee.webp",
    "role": "merch",
    "width": 300,
    "height": 315,
    "name": "merch-ringer-tee"
  },
  {
    "path": "/assets/merch/merch-snapback-cap.webp",
    "role": "merch",
    "width": 320,
    "height": 315,
    "name": "merch-snapback-cap"
  },
  {
    "path": "/assets/merch/merch-vinyl-lp.webp",
    "role": "merch",
    "width": 363,
    "height": 315,
    "name": "merch-vinyl-lp"
  }
];

export const MEDIA_LIBRARY = LIBRARY.filter((asset) => ["photo", "gem-cover", "release-cover"].includes(asset.role) || asset.path.includes("/pattern-")).sort((a, b) => {
  const priority = (asset: LibraryAsset) => asset.role === "photo" ? 0 : asset.role === "release-cover" ? 1 : asset.role === "gem-cover" ? 2 : 3;
  return priority(a) - priority(b);
});

// Seamless tiles from brand-kit/texturen, multiplied over the finished artwork.
export const TEXTURES: readonly { id: TextureId; name: string; path: string; alpha: number }[] = [
  { id: "papier", name: "Papier", path: "/assets/brandkit/texturen/papier-kachel.png", alpha: 0.35 },
  { id: "riso", name: "Riso-Korn", path: "/assets/brandkit/texturen/riso-korn-kachel.png", alpha: 0.5 },
  { id: "raster", name: "Raster", path: "/assets/brandkit/texturen/raster-kachel.png", alpha: 0.12 },
];

// Icons from brand-kit/icons, placed beside the logo.
export const STICKERS: readonly { path: string; name: string }[] = [
  ["platte", "Platte"], ["single-7inch", "Single 7\""], ["plattenspieler", "Plattenspieler"], ["tonarm", "Tonarm"],
  ["plattenkiste", "Plattenkiste"], ["mpc", "MPC"], ["mischpult", "Mischpult"], ["battle-mixer", "Battle-Mixer"],
  ["bandmaschine", "Bandmaschine"], ["kassette", "Kassette"], ["kopfhoerer", "Kopfhörer"], ["lautsprecher", "Lautsprecher"],
  ["mikrofon", "Mikrofon"], ["kalender", "Kalender"], ["fernsehturm", "Fernsehturm"], ["spaeti", "Späti"],
].map(([file, name]) => ({ path: `/assets/brandkit/icons/${file}.png`, name }));

export function assetUrl(assetBase: string, path: string): string {
  if (path.startsWith("blob:")) return path;
  return assetBase.replace(/\/$/, "") + (path.startsWith("/") ? path : "/" + path);
}
