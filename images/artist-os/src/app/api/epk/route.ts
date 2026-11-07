import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildZip, type ZipEntry } from "@/lib/zip";
import { CONTACTS } from "@/lib/data";

export const runtime = "nodejs";

const PHOTOS = [
  "photo-01-cratedigging-record-store.webp",
  "photo-02-studio-mpc-beatmaking.webp",
  "photo-03-live-dj-set-turntables.webp",
  "photo-04-berlin-night-record-bag.webp",
  "photo-05-backstage-greenroom-talk.webp",
  "photo-06-portrait-backstage-moody.webp",
  "photo-07-venue-outdoor-crate-check.webp",
  "photo-08-street-club-entrance-night.webp",
  "photo-09-backstage-vinyl-selection.webp",
];

const FACT_SHEET = `DJ NOIZY NEIGHBOR, EPK / FACT SHEET
=====================================

Artist:        DJ Noizy Neighbor
Based:         Berlin-Friedrichshain, Germany
Genres:        Rare Funk / Soul / Beats / Hip Hop / Lo-Fi
Live formats:  Vinyl-only DJ Sets · Hybrid MPC Live Sets · B2B
Making beats:  since the early 2000s (started on an MPC 2000XL)
Crate:         record collection built over 20+ years
Album:         Back on 16 pads (17.02.2023, NoizyNeighborProductions),
               12 beats + bonus, mixed and mastered by the artist

Releases:
  01  Berlin Funk Groove (Original Mix), 94 BPM, F minor, 3:23
  02  Kater Night Session (Dub Edit), 105 BPM, D minor, 3:21
  03  Neighborhood Lo-Fi Beats, 88 BPM, A minor, 3:26

Rig:           2x Technics MK, Vestax PMC-06 Pro, Stanton STX,
               Akai MPC One, SSL BiG SiX, SSL Fusion

Contact:
  Booking  ${CONTACTS.booking}
  Press    ${CONTACTS.press}
  Fans     ${CONTACTS.fan}
  Mgmt     ${CONTACTS.mgmt}

Contents of this pack:
  branding/logo-transparent.webp , primary sticker logo (1249x1198)
  branding/brandboard.webp       , full brand styleboard (1536x1024)
  photos/*.webp                  , 9 hi-res press photos (1696x2528)

All images (c) DJ Noizy Neighbor.
Usage allowed with credit "DJ Noizy Neighbor" for editorial coverage.
`;

export async function GET() {
  try {
    const pub = path.join(process.cwd(), "public", "assets");
    const entries: ZipEntry[] = [];
    for (const p of PHOTOS) {
      entries.push({ name: `noizy-epk/photos/${p}`, data: await readFile(path.join(pub, "photos", p)) });
    }
    entries.push({ name: "noizy-epk/branding/logo-transparent.webp", data: await readFile(path.join(pub, "branding", "logo-transparent.webp")) });
    entries.push({ name: "noizy-epk/branding/brandboard.webp", data: await readFile(path.join(pub, "branding", "brandboard.webp")) });
    entries.push({ name: "noizy-epk/FACT-SHEET.txt", data: Buffer.from(FACT_SHEET, "utf8") });

    const zip = buildZip(entries);
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="noizy-neighbor-epk.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("epk error", err);
    return NextResponse.json({ ok: false, message: "EPK konnte nicht gebaut werden." }, { status: 500 });
  }
}
