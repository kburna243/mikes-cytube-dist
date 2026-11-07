import { NextResponse } from "next/server";
import { buildPdf } from "@/lib/pdf";
import { CONTACTS } from "@/lib/data";

export const runtime = "nodejs";

type Line = { text: string; size: number; bold?: boolean; gap?: number };

const TECHNICAL: Line[] = [
  { text: "DJ NOIZY NEIGHBOR", size: 26, bold: true, gap: 34 },
  { text: "TECHNICAL RIDER, 2026", size: 13, gap: 30 },
  { text: "DJ-SETUP", size: 13, bold: true, gap: 20 },
  { text: "- 2x Technics direct drive turntables (MK series)", size: 11 },
  { text: "- Vestax PMC-06 Pro battle mixer (artist-owned) OR Pioneer DJM-S series", size: 11 },
  { text: "- Akai MPC One for hybrid sets (2x free 1/4-inch line inputs)", size: 11, gap: 22 },
  { text: "MONITORING", size: 13, bold: true, gap: 20 },
  { text: "- 2x booth monitors at ear height, min. 200W each", size: 11 },
  { text: "- Mono summing switch mandatory", size: 11, gap: 22 },
  { text: "SIGNAL PATH", size: 13, bold: true, gap: 20 },
  { text: "- Mixer master out -> house limiter -> PA", size: 11 },
  { text: "- Respect phono level: do not patch turntables into line inputs", size: 11, gap: 22 },
  { text: "BOOTH / STAGE", size: 13, bold: true, gap: 20 },
  { text: "- Solid table 120x60cm, vibration-isolated from dancefloor", size: 11 },
  { text: "- 230V: 3x outlets at the booth (CEE7/3)", size: 11 },
  { text: "- No drinks on the table. Ever.", size: 11, gap: 22 },
  { text: "SET LENGTHS", size: 13, bold: true, gap: 20 },
  { text: "- Club: 2h-6h | Festival: 60-120min | Vinyl-only: any", size: 11, gap: 28 },
  { text: `Questions: ${CONTACTS.booking}`, size: 10 },
];

const HOSPITALITY: Line[] = [
  { text: "DJ NOIZY NEIGHBOR", size: 26, bold: true, gap: 34 },
  { text: "HOSPITALITY RIDER, 2026", size: 13, gap: 30 },
  { text: "BACKSTAGE / CATERING", size: 13, bold: true, gap: 20 },
  { text: "- 1x crate of Club-Mate (or local equivalent)", size: 11 },
  { text: "- Still & sparkling water, ginger shots, fresh fruit", size: 11 },
  { text: "- One hot meal or buy-out EUR 25", size: 11, gap: 22 },
  { text: "TRAVEL", size: 13, bold: true, gap: 20 },
  { text: "- Rail 1st class or economy+ flight", size: 11 },
  { text: "- Records always travel as hand luggage, 15kg allowance please", size: 11 },
  { text: "- Ground transfer from station/airport if after dark", size: 11, gap: 22 },
  { text: "ACCOMMODATION (if overnight)", size: 13, bold: true, gap: 20 },
  { text: "- 4-star, late checkout, quiet floor", size: 11 },
  { text: "- Walking distance to venue beats star rating", size: 11, gap: 22 },
  { text: "GUESTLIST", size: 13, bold: true, gap: 20 },
  { text: "- 4 spots for club shows, 8 for festivals", size: 11, gap: 28 },
  { text: `Contact: ${CONTACTS.booking}`, size: 10 },
];

export async function GET(req: Request) {
  const type = new URL(req.url).searchParams.get("type") ?? "technical";
  const isTech = type !== "hospitality";
  const pdf = buildPdf(isTech ? "Noizy Neighbor, Technical Rider" : "Noizy Neighbor, Hospitality Rider", [isTech ? TECHNICAL : HOSPITALITY]);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="noizy-neighbor-${isTech ? "technical" : "hospitality"}-rider.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
