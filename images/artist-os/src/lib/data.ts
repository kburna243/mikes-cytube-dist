import { withBase } from "@/lib/base";
import type { Lang } from "@/lib/i18n";
/**
 * Single source of truth for site content, DJ Noizy Neighbor.
 * Asset paths mirror the verified files in /public/assets (see manifest.json).
 */

export const BRAND = {
  name: "DJ Noizy Neighbor",
  tagline: "Rare Funk, Soul, Beats, Hip Hop, Lo-Fi",
  city: "Berlin",
  logo: withBase("/assets/branding/logo-transparent.webp"),
  heroBanner: withBase("/assets/ui/hero-skyline-banner.webp"),
  genres: ["Rare Funk", "Soul", "Beats", "Hip Hop", "Lo-Fi"],
};

export type Track = {
  id: string;
  no: string;
  title: string;
  mix: string;
  src: string;
  duration: string;
  seconds: number;
  bpm: number;
  key: string;
  genre: string;
};

export const TRACKS: Track[] = [
  {
    id: "track-01",
    no: "01",
    title: "Berlin Funk Groove",
    mix: "Original Mix",
    src: withBase("/assets/audio/track-01-berlin-funk-groove.mp3"),
    duration: "3:23",
    seconds: 203,
    bpm: 94,
    key: "F minor",
    genre: "Rare Funk / Hip Hop",
  },
  {
    id: "track-02",
    no: "02",
    title: "Kater Night Session",
    mix: "Dub Edit",
    src: withBase("/assets/audio/track-02-kater-night-session.mp3"),
    duration: "3:21",
    seconds: 201,
    bpm: 105,
    key: "D minor",
    genre: "Soul / Deep Groove",
  },
  {
    id: "track-03",
    no: "03",
    title: "Neighborhood Lo-Fi Beats",
    mix: "",
    src: withBase("/assets/audio/track-03-neighbourhood-lofi-beats.mp3"),
    duration: "3:26",
    seconds: 206,
    bpm: 88,
    key: "A minor",
    genre: "Lo-Fi Hip Hop / Chill",
  },
];

/**
 * Real releases (as distributed under "DJ Noizy Neighbor", US spelling, on the streaming platforms).
 * Verified 04.11.2026 on YouTube, Spotify, Apple Music and Deezer.
 */
export const ALBUM = {
  title: "Back on 16 pads",
  artist: "DJ Noizy Neighbor",
  year: "2023",
  released: "17.02.2023",
  label: "NoizyNeighborProductions",
  blurb: "Nach über 13 Jahren zurück an den 16 Pads: 12 rohe, dreckige Beats und Instrumentals plus Bonustrack. Selbst gemischt und gemastert, über analoge Hardware und Band, das Vinyl-Knistern bleibt drin.",
  blurbEn: "Back on the 16 pads after more than 13 years: 12 raw and dirty beats and instrumentals plus a bonus track. Mixed and mastered by himself through analog hardware and tape, vinyl crackle included.",
  cover: withBase("/assets/releases/back-on-16-pads.webp"),
  youtubePlaylist: "OLAK5uy_lvGHSv5Rd1btTCI6pfdfQ05X-oMkeHx7o",
  links: [
    { name: "YouTube", url: "https://www.youtube.com/playlist?list=OLAK5uy_lvGHSv5Rd1btTCI6pfdfQ05X-oMkeHx7o" },
    { name: "Spotify", url: "https://open.spotify.com/album/0eJsuqLHECjeVnqHQlfu1Y" },
    { name: "Apple Music", url: "https://music.apple.com/de/album/back-on-16-pads/1672490942" },
    { name: "Deezer", url: "https://www.deezer.com/album/408632207" },
  ],
  tracks: [
    ["HEY FELLOWS", "3:58"],
    ["HIT IT HIT IT", "5:08"],
    ["BESSY'S CHOP", "2:07"],
    ["BLUE LOVE", "5:13"],
    ["ELECTROLD", "5:18"],
    ["THAT'S FAT", "1:38"],
    ["SPANISH SUN", "2:15"],
    ["WHAT U SAY", "4:17"],
    ["MEMORY LANE", "5:27"],
    ["THE STORM", "7:19"],
    ["GOOD OL' TIMES", "4:12"],
    ["LIGHTS OF 77", "5:02"],
    ["AND STILL NOT THE END (Bonus)", "3:57"],
  ] as [string, string][],
};

/** Detektiv Funk Schnüffler: the browser adventure starring Noizy, built in its own project and served at /funk. */
export const GAME = {
  title: "Detektiv Funk Schnüffler",
  subtitle: "Rare Groove Hustle",
  claim: "Dein Koffer ist klein. Dein Sound ist groß.",
  claimEn: "Your record bag is small. Your sound is big.",
  playUrl: "https://servermitte.tailecbf0f.ts.net/funk/spiel/",
  landingUrl: "https://servermitte.tailecbf0f.ts.net/funk/",
  soundtrackLandingUrl: "https://servermitte.tailecbf0f.ts.net/funk/#soundtrack",
  logo: withBase("/assets/game/logo.webp"),
  stills: {
    home: withBase("/assets/game/home-desktop.webp"),
    otto: withBase("/assets/game/otto-dialogue-desktop.webp"),
    fritte: withBase("/assets/game/fritte-standing-desktop.webp"),
  },
  soundtrack: {
    title: "Rare Groove Hustle (Original Soundtrack)",
    artist: "Detektiv Funk Schnüffler und seine Tornados",
    released: "2023 / 2026",
    duration: "45 Min.",
    trackCount: 10,
    lineup: "Komponiert, eingespielt und produziert von Detektiv Funk Schnüffler · Saxophon und mehr: Anni (Pushykraut Queen aka PShy Princess)",
    lineupEn: "Composed, recorded and produced by Detektiv Funk Schnüffler · Saxophone and more: Anni (Pushykraut Queen aka PShy Princess)",
    blurb: "Das offizielle Album zum Point-and-Click-Adventure: 10 Instrumental-Tracks, 45 Minuten handgemachter Raw Funk und Soul ohne Samples. Jeder Kiez und Schauplatz in Berlin hat sein eigenes Thema im Spiel.",
    blurbEn: "The official soundtrack album to the point-and-click adventure: 10 instrumental tracks, 45 minutes of handmade raw funk and soul without samples. Every district and venue in Berlin has its dedicated theme in the game.",
    cover: withBase("/assets/game/rare-groove-hustle-cover-500.webp"),
    coverLarge: withBase("/assets/game/rare-groove-hustle-cover-1000.webp"),
    backCover: withBase("/assets/game/rare-groove-hustle-back-500.webp"),
    backCoverLarge: withBase("/assets/game/rare-groove-hustle-back-1000.webp"),
    previewAudio: withBase("/assets/audio/ost-05-thema.m4a"),
    tracks: [
      { no: "01", side: "A1", title: "Kalte Fritte, heißer Groove (Teil 2)", duration: "4:06", scene: "Kalte Fritte", district: "Friedrichshain" },
      { no: "02", side: "A2", title: "Trödelmarkt am Wasserturm (Teil 1 & 2)", duration: "4:47", scene: "Trödelmarkt", district: "Friedrichshain" },
      { no: "03", side: "A3", title: "Kesselhaus Soulexplosion", duration: "4:00", scene: "Kesselhaus", district: "Friedrichshain" },
      { no: "04", side: "A4", title: "Samtpfote Soul", duration: "5:30", scene: "Samt-Foyer & Velours", district: "Mitte" },
      { no: "05", side: "A5", title: "Thema für den Funk Schnüffler", duration: "5:32", scene: "Titelthema & Kreuzberg", district: "Kreuzberg", isTheme: true },
      { no: "06", side: "B1", title: "Schichtwechsel · Die letzte Bahn", duration: "3:31", scene: "Gleis 9 & Schichtwechsel", district: "Wedding" },
      { no: "07", side: "B2", title: "Rostige Nadel Breakdown", duration: "4:29", scene: "Rostige Nadel", district: "Neukölln" },
      { no: "08", side: "B3", title: "Ottos Staubkeller (live)", duration: "3:58", scene: "Ottos Kellerarchiv", district: "Kreuzberg" },
      { no: "09", side: "B4", title: "Mansarde um Mitternacht", duration: "4:32", scene: "Schnüfflers Mansarde", district: "Kreuzberg" },
      { no: "10", side: "B5", title: "B-Seiten am Wasser", duration: "4:59", scene: "Kanalsalon & Brückendeck", district: "Kreuzberg" },
    ],
  },
};

/**
 * Diggin' Gems: records from Noizy's crates, plus two of his own clips that close the loop crate → pad.
 * Facts only as read off sleeve, label or his own messages (04.11.2026); unread fields stay empty.
 * Clips are cut to 30 s on purpose: a digging moment, not a full track.
 * This list is only the seed: the live list lives in the `gems` table and is edited in /admin.
 * Paths are stored without basePath, components apply withBase().
 */
export type Gem = {
  id: string;
  title: string;
  artist?: string;
  label: string;
  country?: string;
  img: string;
  video?: string;
  badge: string;
  badgeEn: string;
  story: string;
  storyEn: string;
  own?: boolean;
};

const gem = (f: string) => `/assets/gems/${f}`;

export const GEMS: Gem[] = [
  {
    id: "yuen-biao",
    title: "Themes From The Movies Starring Yuen Biao",
    artist: "Various",
    label: "Victor VIP-28111",
    country: "Japan",
    img: gem("yuen-biao.webp"),
    badge: "Discogs: 1.337 €",
    badgeEn: "Discogs: €1,337",
    story: "Kung-Fu-Kino-Themes auf japanischem Victor. Auf Discogs wird die Platte für 1.337 € angeboten, bei Noizy steht sie in der Kiste.",
    storyEn: "Kung fu movie themes on Japanese Victor. Listed on Discogs for €1,337, in Noizy's crate it's just another record.",
  },
  {
    id: "shaolin",
    title: "三大少林寺映画 Original Soundtrack",
    label: "Japan-Pressung",
    country: "Japan",
    img: gem("shaolin.webp"),
    badge: "Wu-Tang-Quelle",
    badgeEn: "Wu-Tang source",
    story: "Die Soundtracks zu drei Shaolin-Filmen, darunter Die 36 Kammern der Shaolin. Der Stoff, aus dem der Wu-Tang Clan seine Welt gebaut hat.",
    storyEn: "Soundtracks to three Shaolin films, including The 36th Chamber of Shaolin. The stuff the Wu-Tang Clan built its world from.",
  },
  {
    id: "arita-shintaro",
    title: "Arita Shintaro",
    artist: "Arita Shintaro",
    label: "Crown",
    country: "Japan",
    img: gem("arita-shintaro.webp"),
    video: gem("arita-shintaro.mp4"),
    badge: "Nicht im Netz",
    badgeEn: "Not online",
    story: "Japanischer Drummer auf Crown. Im Netz ist die Scheibe nicht zu finden, also hier: 30 Sekunden direkt vom Plattenteller.",
    storyEn: "Japanese drummer on Crown. You won't find this one online, so here are 30 seconds straight off the deck.",
  },
  {
    id: "drum-break",
    title: "Woman!!",
    artist: "Monica Lassen & The Sounds",
    label: "Columbia",
    country: "Japan",
    img: gem("drum-break.webp"),
    video: gem("drum-break.mp4"),
    badge: "Drum Break",
    badgeEn: "Drum break",
    story: "Der krasseste japanische Drum Break, den Noizy gerade in der Kiste hat. Lauter drehen.",
    storyEn: "The hardest Japanese drum break in Noizy's crate right now. Turn it up.",
  },
  {
    id: "polydor",
    title: "あのままだよ",
    artist: "Kenji Sawada",
    label: "Polydor",
    country: "Japan",
    img: gem("polydor.webp"),
    video: gem("polydor.mp4"),
    badge: "Japan-Pressung",
    badgeEn: "Japanese press",
    story: "Noch ein Fund vom Plattenteller...",
    storyEn: "Another find off the deck...",
  },
  {
    id: "crate-to-pad",
    title: "Von der Kiste auf die Pads",
    label: "Studio Noizy",
    img: gem("crate-to-pad.webp"),
    video: gem("crate-to-pad.mp4"),
    badge: "Eigener Beat",
    badgeEn: "Own beat",
    story: "So wird aus Platten ein Beat: MPC, Mischpult, Plattenkiste. Ein Blick ins Studio.",
    storyEn: "How records turn into a beat: MPC, mixing desk, record crate. A look inside the studio.",
    own: true,
  },
  {
    id: "noizy-in-space",
    title: "Noizy in Space",
    artist: "DJ Noizy Neighbor",
    label: "NoizyNeighborProductions",
    img: gem("noizy-in-space.webp"),
    video: gem("noizy-in-space.mp4"),
    badge: "Coming soon",
    badgeEn: "Coming soon",
    story: "Das nächste Album, mit analogen Synths selbst eingespielt und über einen originalen Fairchild-Kompressor und eine Studer-A80-Bandmaschine gemastert.",
    storyEn: "The next album, played in on analogue synths and mastered through an original Fairchild compressor and a Studer A80 tape machine.",
    own: true,
  },
];

export const gemBadge = (g: Gem, lang: Lang) => (lang === "en" && g.badgeEn ? g.badgeEn : g.badge);
export const gemStory = (g: Gem, lang: Lang) => (lang === "en" && g.storyEn ? g.storyEn : g.story);

export type Product = {
  id: string;
  name: string;
  price: number;
  compareAt?: number;
  img: string;
  desc: string;
  descEn: string;
  badge?: "new" | "live" | "album" | "ep" | "event";
  sizes?: string[];
  tag: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "snapback",
    name: "Noizy Berlin Snapback Cap",
    price: 34,
    compareAt: 42,
    img: withBase("/assets/merch/merch-snapback-cap.webp"),
    desc: "Schwarze Wollmischung, gestickter Fernsehturm-Sunset-Patch. One size, snap closure.",
    descEn: "Black wool blend with an embroidered TV-tower sunset patch. One size, snap closure.",
    badge: "new",
    tag: "HEADWEAR",
  },
  {
    id: "ringer-tee",
    name: "Vintage Ringer T-Shirt",
    price: 38,
    img: withBase("/assets/merch/merch-ringer-tee.webp"),
    desc: "Cremefarben mit olivgrünem Kragen, weicher Vintage-Siebdruck, 100% Baumwolle.",
    descEn: "Cream with an olive collar, soft vintage screen print, 100% cotton.",
    sizes: ["S", "M", "L", "XL"],
    tag: "APPAREL",
  },
  {
    id: "denim-jacket",
    name: "Limited Edition Denim Trucker Jacket",
    price: 120,
    compareAt: 150,
    img: withBase("/assets/merch/merch-denim-jacket.webp"),
    desc: "Gewaschener schwarzer Denim, großflächiger Rückenstick. Limitiert auf 100 Stück.",
    descEn: "Washed black denim with a large embroidered back. Limited to 100 pieces.",
    badge: "new",
    sizes: ["S", "M", "L", "XL"],
    tag: "LIMITED",
  },
  {
    id: "vinyl-lp",
    name: "Neighbor Grooves LP (12\" Vinyl)",
    price: 28,
    img: withBase("/assets/merch/merch-vinyl-lp.webp"),
    desc: "180g audiophiles Vinyl, Gatefold-Cover, inkl. Download-Code & Sticker.",
    descEn: "180 g audiophile vinyl, gatefold sleeve, download code and sticker included.",
    badge: "album",
    tag: "WAX",
  },
  {
    id: "hangtag",
    name: "Crate-Digger Hangtag & Sticker Set",
    price: 5,
    img: withBase("/assets/merch/merch-hangtag.webp"),
    desc: "Sammler-Tag aus Pappe mit 5 wetterfesten Outdoor-Vinyl-Stickern.",
    descEn: "Cardboard collector tag with 5 weatherproof outdoor vinyl stickers.",
    tag: "ACCESSORY",
  },
];

export type Gig = {
  id: number;
  date: string;
  city: string;
  venue: string;
  country: string;
  status: "SOLD OUT" | "CONFIRMED" | "TICKETS";
  note: string;
  noteEn?: string;
};

/** Static fallback, mirrored by the `tour_dates` table (DB wins when seeded). */
export const FALLBACK_GIGS: Gig[] = [
  { id: 1, date: "2026-02-14", city: "Berlin", venue: "Kater Blau", country: "DE", status: "SOLD OUT", note: "Vinyl-only All Night Set" },
  { id: 2, date: "2026-02-28", city: "Berlin", venue: "Watergate", country: "DE", status: "TICKETS", note: "w/ Soul Summit Crew" },
  { id: 3, date: "2026-03-13", city: "Berlin", venue: "Cassiopeia", country: "DE", status: "TICKETS", note: "Funk Nacht auf dem RAW-Gelände", noteEn: "Funk night at the RAW grounds" },
  { id: 4, date: "2026-03-21", city: "Berlin", venue: "Gretchen", country: "DE", status: "CONFIRMED", note: "Beats & Lo-Fi Special" },
  { id: 5, date: "2026-04-11", city: "Hamburg", venue: "Golden Pudel Club", country: "DE", status: "TICKETS", note: "Harbour Funk Session" },
  { id: 6, date: "2026-06-26", city: "Lärz", venue: "Fusion Festival", country: "DE", status: "CONFIRMED", note: "Turmbühne, Day Set", noteEn: "Tower stage, day set" },
  { id: 7, date: "2025-12-31", city: "Berlin", venue: "://about blank", country: "DE", status: "SOLD OUT", note: "NYE, gespielt", noteEn: "NYE, played" },
  { id: 8, date: "2025-11-08", city: "Leipzig", venue: "Distillery", country: "DE", status: "SOLD OUT", note: "Gespielt", noteEn: "Played" },
];

export const GEAR = [
  {
    name: "Akai MPC One",
    qty: "1×",
    spec: "16 Pads · Standalone Sampling · Sequencer",
    role: "Sampler / Sequencer",
  },
  {
    name: "SSL BiG SiX",
    qty: "1×",
    spec: "SuperAnalogue Mischpult · Bus-Kompressor",
    role: "Studio Mixer",
  },
  {
    name: "SSL Fusion",
    qty: "1×",
    spec: "Analoger Stereo-Master · Vintage Drive · Violet EQ",
    role: "Master Processor",
  },
  {
    name: "Technics MK",
    qty: "2×",
    spec: "Direct Drive Turntables",
    role: "Turntables",
  },
  {
    name: "Vestax PMC-06 Pro",
    qty: "1×",
    spec: "Battle Mixer · Scratch-Crossfader",
    role: "DJ Mixer",
  },
  {
    name: "Stanton STX",
    qty: "1×",
    spec: "Portabler Scratch-Turntable · Akku",
    role: "Portable Scratch",
  },
];

export const SOCIALS = [
  { id: "instagram", label: "Instagram", handle: "@djnoizyneighbor", url: "https://instagram.com/djnoizyneighbor", blurb: "Plattenfunde, Gig-Flyer, Studio-Schnipsel", blurbEn: "Crate finds, gig flyers, studio snippets" },
  { id: "tiktok", label: "TikTok", handle: "@noizyneighbor", url: "https://tiktok.com/@noizyneighbor", blurb: "60-Sekunden-Beats und Scratch-Clips", blurbEn: "60-second beat cook-ups and scratch clips" },
  { id: "youtube", label: "YouTube", handle: "@officialdjnoizyneighbor", url: "https://www.youtube.com/@officialdjnoizyneighbor", blurb: "Das Album Back on 16 pads komplett", blurbEn: "The full Back on 16 pads album" },
  { id: "soundcloud", label: "SoundCloud", handle: "/noizyneighbor", url: "https://soundcloud.com/noizyneighbor", blurb: "Mixtapes, Dubs und unveröffentlichte Edits", blurbEn: "Mixtapes, dubs and unreleased edits" },
  { id: "spotify", label: "Spotify", handle: "DJ Noizy Neighbor", url: "https://open.spotify.com/artist/4VdvOFJE7lz9Fs1JqdzeK4", blurb: "Back on 16 pads und alles Neue", blurbEn: "Back on 16 pads and everything new" },
  { id: "residentadvisor", label: "Resident Advisor", handle: "DJ Noizy Neighbor", url: "https://ra.co/dj/noizyneighbor", blurb: "Termine und Club-Listings", blurbEn: "Tour dates and club listings" },
];

export const CONTACTS = {
  booking: "djnoizyneighbor@gmail.com",
  press: "djnoizyneighbor@gmail.com",
  fan: "djnoizyneighbor@gmail.com",
  mgmt: "Direkt über DJ Noizy Neighbor",
};

/**
 * Pflichtangaben für Impressum und Datenschutz. Alles in [eckigen Klammern] ist Platzhalter
 * und muss vor dem echten Livegang ersetzt werden (siehe CONTENT-VORLAGE.md, Abschnitt 9).
 */
export const LEGAL = {
  name: "Martin Schulz",
  artistName: "DJ Noizy Neighbor",
  street: "Scharfestraße 21",
  zip: "14169",
  city: "Berlin",
  email: "djnoizyneighbor@gmail.com",
  phone: "[Telefonnummer, optional]",
  vatId: "", // USt-IdNr., nur falls vorhanden
  hosting: "[Name und Anschrift des Server-Betreibers]",
  updated: "November 2026",
};

export const UI_ASSETS = {
  dividerSkyline: withBase("/assets/ui/divider-berlin-skyline.webp"),
  dividerTonearm: withBase("/assets/ui/divider-tonearm-needle.webp"),
  illuHeadphones: withBase("/assets/ui/illu-headphones.webp"),
  illuCrate: withBase("/assets/ui/illu-record-crate.webp"),
  illuSpraycan: withBase("/assets/ui/illu-spraycan.webp"),
  illuVinyl: withBase("/assets/ui/illu-vinyl-record.webp"),
  patternWaves: withBase("/assets/ui/pattern-70s-waves.webp"),
  patternSkyline: withBase("/assets/ui/pattern-berlin-skyline.webp"),
  patternVinyl: withBase("/assets/ui/pattern-vinyl-stacks.webp"),
  grooves: withBase("/assets/ui/ui-grooves-texture.webp"),
  vinylTex: withBase("/assets/ui/ui-vinyl-texture.webp"),
  paperTex: withBase("/assets/ui/ui-vintage-paper-texture.webp"),
  badges: {
    new: withBase("/assets/ui/badge-new.webp"),
    live: withBase("/assets/ui/badge-live.webp"),
    album: withBase("/assets/ui/badge-album.webp"),
    ep: withBase("/assets/ui/badge-ep.webp"),
    event: withBase("/assets/ui/badge-event.webp"),
  },
};

export const PHOTOS = {
  crateDigging: withBase("/assets/photos/photo-01-cratedigging-record-store.webp"),
  studioMpc: withBase("/assets/photos/photo-02-studio-mpc-beatmaking.webp"),
  liveDj: withBase("/assets/photos/photo-03-live-dj-set-turntables.webp"),
  berlinNight: withBase("/assets/photos/photo-04-berlin-night-record-bag.webp"),
  greenroom: withBase("/assets/photos/photo-05-backstage-greenroom-talk.webp"),
  portrait: withBase("/assets/photos/photo-06-portrait-backstage-moody.webp"),
  outdoorCrate: withBase("/assets/photos/photo-07-venue-outdoor-crate-check.webp"),
  clubEntrance: withBase("/assets/photos/photo-08-street-club-entrance-night.webp"),
  vinylSelection: withBase("/assets/photos/photo-09-backstage-vinyl-selection.webp"),
};

export const SAMPLE_LOOPS = {
  on: withBase("/assets/audio/sample-loop-on.mp3"),
  ts: withBase("/assets/audio/sample-loop-ts.mp3"),
  ve: withBase("/assets/audio/sample-loop-ve.mp3"),
};

const LOCALE: Record<Lang, string> = { de: "de-DE", en: "en-GB" };

export const fmtEUR = (n: number, lang: Lang = "de") =>
  n.toLocaleString(LOCALE[lang], { style: "currency", currency: "EUR" });

/** Per-language text fields with German fallback. */
export const productDesc = (p: Product, lang: Lang) => (lang === "en" ? p.descEn : p.desc);
export const gigNote = (g: Gig, lang: Lang) => (lang === "en" && g.noteEn ? g.noteEn : g.note);

export const fmtDate = (iso: string, lang: Lang = "de") => {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  const loc = LOCALE[lang];
  return {
    day: d.toLocaleDateString(loc, { day: "2-digit" }),
    month: d.toLocaleDateString(loc, { month: "short" }).replace(".", "").toUpperCase(),
    full: d.toLocaleDateString(loc, { weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
    year: String(d.getFullYear()),
  };
};
