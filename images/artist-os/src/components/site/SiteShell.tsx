import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Archivo, Space_Mono } from "next/font/google";
import { withBase } from "@/lib/base";
import type { Lang } from "@/lib/i18n";
import { AudioProvider } from "@/components/audio/AudioProvider";
import PlayerBar from "@/components/audio/PlayerBar";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ConsentBanner from "@/components/site/ConsentBanner";
import { getNoizySchemaOrg } from "@/lib/schemaOrg";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], style: ["normal", "italic"], variable: "--font-archivo" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-spacemono" });

export const siteViewport: Viewport = { themeColor: "#f1e4cf", width: "device-width", initialScale: 1 };

export function siteMetadata(lang: Lang): Metadata {
  const isSubpathStaging = Boolean(process.env.NEXT_PUBLIC_BASE_PATH?.includes("noizy"));
  const allowIndex = !isSubpathStaging;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://noizyneighbor.de"),
    title: {
      default: lang === "en" ? "DJ Noizy Neighbor | Rare Funk, Soul, Beats from Berlin" : "DJ Noizy Neighbor | Rare Funk, Soul, Beats aus Berlin",
      template: "%s | DJ Noizy Neighbor",
    },
    description:
      lang === "en"
        ? "DJ Noizy Neighbor: Berlin crate digger, DJ and producer working between rare funk, soul, beats, hip hop and lo-fi. Dates, releases, merch, press kit and booking."
        : "DJ Noizy Neighbor: Berliner Crate-Digger, DJ und Produzent zwischen Rare Funk, Soul, Beats, Hip Hop und Lo-Fi. Tour-Dates, Releases, Merch, EPK und Booking.",
    keywords: [
      "DJ Noizy Neighbor",
      "Noizy Neighbor",
      "Berlin DJ",
      "Rare Funk DJ",
      "Vinyl DJ Berlin",
      "Crate Digging Berlin",
      "Akai MPC One",
      "Scratch DJ",
      "Vestax PMC-06 Pro",
      "Boom Bap Berlin",
      "Lo-Fi Beats",
      "70s Soul Vinyl",
      "Berlin-Friedrichshain DJ",
      "Back on 16 pads",
      "Detektiv Funk Schnüffler",
    ],
    authors: [{ name: "DJ Noizy Neighbor", url: "https://noizyneighbor.de" }],
    creator: "DJ Noizy Neighbor",
    publisher: "NoizyNeighborProductions",
    formatDetection: { email: true, telephone: true },
    robots: {
      index: allowIndex,
      follow: allowIndex,
      googleBot: {
        index: allowIndex,
        follow: allowIndex,
      },
    },
    openGraph: {
      title: "DJ Noizy Neighbor | Rare Funk, Soul, Beats from Berlin",
      description: "Berliner Crate-Digger, DJ und Produzent zwischen Rare Funk, Soul, Beats, Hip Hop und Lo-Fi. Tour-Dates, Releases, EPK und Booking.",
      url: "https://noizyneighbor.de",
      siteName: "DJ Noizy Neighbor",
      locale: lang === "en" ? "en_US" : "de_DE",
      type: "website",
      images: [
        {
          url: withBase("/assets/branding/logo-transparent.webp"),
          width: 1200,
          height: 630,
          alt: "DJ Noizy Neighbor",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "DJ Noizy Neighbor | Rare Funk, Soul, Beats",
      description: "Berliner Crate-Digger, DJ und Produzent. Analog sounds, rare vinyl & vintage MPC vibes.",
      images: [withBase("/assets/branding/logo-transparent.webp")],
    },
    other: {
      "geo.region": "DE-BE",
      "geo.placename": "Berlin-Friedrichshain",
      "geo.position": "52.515;13.454",
      "ICBM": "52.515, 13.454",
      "DC.title": "DJ Noizy Neighbor — Rare Funk, Soul & Beats Berlin",
      "DC.creator": "DJ Noizy Neighbor",
      "DC.subject": "Music, DJ, Rare Funk, Vinyl, Hip Hop, MPC One, Berlin",
      "DC.description": "Offizielle Plattform von DJ Noizy Neighbor: Releases, Tourdates, Crate Gems, Merchandise und Booking.",
      "DC.publisher": "NoizyNeighborProductions",
      "DC.language": lang,
    },
    icons: { icon: [{ url: withBase("/assets/branding/logo-transparent.webp"), type: "image/webp" }] },
  };
}

/** The <html> document shared by both language trees (each tree has its own root layout). */
export default function SiteShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const schemaData = getNoizySchemaOrg(lang);

  return (
    <html lang={lang} className={`${archivo.variable} ${spaceMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body className="bg-page font-sans text-fg antialiased">
        <AudioProvider>
          <Header />
          <main className="min-h-svh pt-16">{children}</main>
          <Footer />
          <PlayerBar />
          <ConsentBanner />
        </AudioProvider>
        <noscript>
          <div style={{ padding: "2rem", background: "#111", color: "#eee" }}>
            <h1>DJ Noizy Neighbor — Rare Funk, Soul &amp; Hip Hop Beats Berlin</h1>
            <p>
              Berliner DJ, Beat-Produzent und Crate-Digger. Beats seit Anfang der 2000er, gesampelt
              aus über 20 Jahren Plattensammlung auf den 16 Pads der MPC.
            </p>
            <h2>Releases &amp; Musik</h2>
            <p>Album: Back on 16 pads (NoizyNeighborProductions)</p>
            <p>Tracks: Berlin Funk Groove, Kater Night Session, Neighborhood Lo-Fi Beats</p>
            <h2>Booking &amp; Kontakt</h2>
            <p>Anfragen für Vinyl-only Club Sets, hybride MPC Live-Performances, B2B und Festivals.</p>
          </div>
        </noscript>
        <div className="grain-overlay" aria-hidden />
        <div className="scanline-overlay" aria-hidden />
      </body>
    </html>
  );
}
