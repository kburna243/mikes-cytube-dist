import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminEnabled, isAdmin } from "@/lib/adminAuth";
import { BASE_PATH } from "@/lib/base";
import { getGems, getGigs } from "@/lib/content";
import { ALBUM } from "@/lib/data";
import WerkstattClient from "@/components/werkstatt/WerkstattClient";
import { archivo, spaceMono } from "../fonts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Marken-Werkstatt · Noizy Admin" };

export default async function WerkstattPage() {
  if (!adminEnabled() || !(await isAdmin())) redirect("/admin");
  const [gigs, gems] = await Promise.all([getGigs(), getGems()]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <WerkstattClient
      assetBase={BASE_PATH}
      gigs={gigs.filter((g) => g.date >= today).sort((a, b) => a.date.localeCompare(b.date))}
      gems={gems}
      release={{ title: ALBUM.title, year: ALBUM.year, label: ALBUM.label, cover: ALBUM.cover.slice(BASE_PATH.length) }}
      fonts={{ display: archivo.style.fontFamily, mono: spaceMono.style.fontFamily }}
    />
  );
}
