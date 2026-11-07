import type { Metadata } from "next";
import type { Lang } from "@/lib/i18n";
import PageHead from "@/components/site/PageHead";
import ShopClient from "@/components/shop/ShopClient";
import { PHOTOS } from "@/lib/data";

const COPY = {
  de: {
    metaTitle: "Shop, Merch & Vinyl",
    metaDesc: "Der Noizy Neighbor Shop: Snapback, Ringer-Shirt, limitierte Denim-Jacke, die Neighbor Grooves LP auf 180 g Vinyl und das Sticker-Set.",
    intro: (code: React.ReactNode) => <>Kleine Auflagen, faire Preise, verschickt aus Friedrichshain. Mit dem Code {code} gibt es 10 % Rabatt.</>,
    photoAlt: "Plattenauswahl im Flightcase",
  },
  en: {
    metaTitle: "Shop, Merch & Vinyl",
    metaDesc: "The Noizy Neighbor shop: snapback, ringer tee, limited denim jacket, the Neighbor Grooves LP on 180 g vinyl and the sticker set.",
    intro: (code: React.ReactNode) => <>Small runs, fair prices, shipped from Friedrichshain. Use the code {code} for 10% off.</>,
    photoAlt: "Record selection in the flight case",
  },
};

export const shopMetadata = (lang: Lang): Metadata => ({ title: COPY[lang].metaTitle, description: COPY[lang].metaDesc });

export default function ShopView({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const code = <span className="whitespace-nowrap rounded-[3px] bg-fg px-2 py-0.5 font-mono text-[0.85em] text-page">NOIZY10</span>;
  return (
    <>
      <PageHead title="Shop" intro={t.intro(code)} photo={PHOTOS.vinylSelection} photoAlt={t.photoAlt} tone="is-sun" />
      <section className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <ShopClient />
      </section>
    </>
  );
}
