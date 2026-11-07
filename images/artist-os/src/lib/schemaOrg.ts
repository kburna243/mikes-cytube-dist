import type { Lang } from "@/lib/i18n";
import { ALBUM, BRAND } from "@/lib/data";

/**
 * Returns the fully structured Schema.org @graph for DJ Noizy Neighbor.
 * Supports German and English, and is ground-ready for generative search engines (LLMO/GEO).
 */
export function getNoizySchemaOrg(lang: Lang = "de", explicitBaseUrl?: string) {
  const siteUrl = explicitBaseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://noizyneighbor.de";

  const artistId = `${siteUrl}/#artist`;
  const bookingId = `${siteUrl}/#booking`;
  const albumId = `${siteUrl}/#album-back-on-16-pads`;
  const faqId = `${siteUrl}/#faq`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Person", "MusicGroup"],
        "@id": artistId,
        "name": BRAND.name,
        "alternateName": ["Noizy Neighbor", "DJ Noizy"],
        "url": siteUrl,
        "image": `${siteUrl}/assets/branding/logo-transparent.webp`,
        "jobTitle": lang === "en" ? "DJ, Record Producer & Crate Digger" : "DJ, Musikproduzent & Crate-Digger",
        "description":
          lang === "en"
            ? "Berlin crate digger, DJ and producer playing rare funk, 70s soul, dusty hip hop beats and lo-fi from original vinyl and the Akai MPC One."
            : "Berliner Crate-Digger, DJ und Produzent zwischen Rare Funk, 70s Soul, staubigen Hip-Hop-Beats und Lo-Fi. Original-Vinyl und Akai MPC One.",
        "genre": BRAND.genres,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Berlin",
          "addressRegion": "Berlin-Friedrichshain",
          "addressCountry": "DE",
        },
        "knowsAbout": [
          "Rare Funk",
          "70s Soul",
          "Vinyl Crate Digging",
          "Akai MPC One",
          "SSL BiG SiX",
          "SSL Fusion",
          "Analog Audio Mastering",
          "Vestax PMC-06 Pro",
          "Turntablism",
          "Club DJing Berlin",
        ],
        "sameAs": [
          "https://open.spotify.com/album/0eJsuqLHECjeVnqHQlfu1Y",
          "https://music.apple.com/de/album/back-on-16-pads/1672490942",
          "https://www.youtube.com/playlist?list=OLAK5uy_lvGHSv5Rd1btTCI6pfdfQ05X-oMkeHx7o",
          "https://www.deezer.com/album/408632207",
        ],
      },
      {
        "@type": "MusicAlbum",
        "@id": albumId,
        "name": ALBUM.title,
        "byArtist": { "@id": artistId },
        "datePublished": "2023-02-17",
        "genre": "Hip Hop / Instrumental Beats",
        "recordLabel": {
          "@type": "RecordLabel",
          "name": ALBUM.label,
        },
        "numTracks": ALBUM.tracks.length,
        "description": lang === "en" ? ALBUM.blurbEn : ALBUM.blurb,
        "url": `${siteUrl}/discography`,
        "image": `${siteUrl}/assets/releases/back-on-16-pads.webp`,
      },
      {
        "@type": "ProfessionalService",
        "@id": bookingId,
        "name": `${BRAND.name} Booking & Live Sets`,
        "provider": { "@id": artistId },
        "areaServed": ["Berlin", "Deutschland", "Europa"],
        "url": `${siteUrl}/bookings`,
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": lang === "en" ? "Performance Formats" : "Buchungsformate",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": lang === "en" ? "Vinyl-Only Club Set" : "Vinyl-Only Club Set",
                "description":
                  lang === "en"
                    ? "Pure analogue vinyl DJ set featuring rare funk 7-inches and 12-inches, deep soul, and breaks."
                    : "Reines analoges Vinyl-DJ-Set mit seltenen 7\"- und 12\"-Pressungen aus Funk, Soul und Rare Grooves.",
              },
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": lang === "en" ? "Hybrid MPC Live Performance" : "Hybrides MPC Live-Set",
                "description":
                  lang === "en"
                    ? "Combination of turntable mixing and live finger-drumming on the Akai MPC One."
                    : "Kombination aus Turntable-Mixing und Live-Finger-Drumming auf den 16 Pads der Akai MPC One.",
              },
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": lang === "en" ? "Festival & Open Air Stage" : "Festival & Open-Air Stage",
                "description":
                  lang === "en"
                    ? "High-energy festival groove sets bridging rare funk breaks, 90s hip hop and boom bap."
                    : "Tanzflächenorientierte Festival-Sets zwischen Funk-Breaks, 90s Hip Hop und Boom Bap.",
              },
            },
          ],
        },
      },
      {
        "@type": "FAQPage",
        "@id": faqId,
        "mainEntity": [
          {
            "@type": "Question",
            "name":
              lang === "en"
                ? "What music genres does DJ Noizy Neighbor play?"
                : "Welche Musikrichtungen spielt DJ Noizy Neighbor?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                lang === "en"
                  ? "DJ Noizy Neighbor specializes in rare funk, 70s soul, dusty hip hop beats, boom bap, and instrumental lo-fi, played predominantly from original vinyl or sampled on the Akai MPC One."
                  : "DJ Noizy Neighbor ist spezialisiert auf Rare Funk, 70s Soul, staubige Hip-Hop-Beats, Boom Bap und Lo-Fi, fast ausschließlich von originalem Vinyl oder über die Akai MPC One gesampelt.",
            },
          },
          {
            "@type": "Question",
            "name":
              lang === "en"
                ? "What technical equipment does DJ Noizy Neighbor use?"
                : "Welches Equipment nutzt DJ Noizy Neighbor bei Gigs?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                lang === "en"
                  ? "The live rig consists of two Technics turntables, a Vestax PMC-06 Pro battle mixer, a portable Stanton STX for scratch sets and the Akai MPC One. In the studio he mixes on an SSL BiG SiX and masters through an SSL Fusion."
                  : "Das Live-Rig umfasst zwei Technics-Turntables, einen Vestax PMC-06 Pro Battle-Mixer, einen tragbaren Stanton STX für Scratch-Sets und die Akai MPC One. Im Studio mischt er auf einem SSL BiG SiX und mastert über eine SSL Fusion.",
            },
          },
          {
            "@type": "Question",
            "name":
              lang === "en"
                ? "In which regions can DJ Noizy Neighbor be booked?"
                : "In welchen Regionen kann DJ Noizy Neighbor gebucht werden?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                lang === "en"
                  ? "Based in Berlin-Friedrichshain, Germany, DJ Noizy Neighbor is available for bookings in Berlin, throughout Germany, and across Europe for club nights, festivals, and cultural events."
                  : "Mit Heimatbasis in Berlin-Friedrichshain ist DJ Noizy Neighbor in Berlin, bundesweit sowie im europäischen Ausland für Club-Nächte, Festivals und Kultur-Events buchbar.",
            },
          },
        ],
      },
    ],
  };
}
