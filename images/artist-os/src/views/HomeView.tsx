import type { Metadata } from "next";
import type { Lang } from "@/lib/i18n";
import { Hero, FeaturedRelease, Dates, PhotoEssay, TurntableTeaser, GameTeaser, MerchPreview, CrateClubSection } from "@/components/home/HomeSections";
import { GemOfTheWeek } from "@/components/disco/GemsCrate";
import { getGems, getGigs } from "@/lib/content";

export const homeMetadata = (lang: Lang): Metadata =>
  lang === "en"
    ? {
        title: "DJ Noizy Neighbor | Rare Funk, Soul, Beats from Berlin",
        description: "Official site of DJ Noizy Neighbor: rare funk, soul, beats, hip hop and lo-fi from Berlin-Friedrichshain. The album Back on 16 pads, dates, press kit, merch and booking.",
      }
    : {
        title: "DJ Noizy Neighbor | Rare Funk, Soul, Beats aus Berlin",
        description: "Offizielle Seite von DJ Noizy Neighbor: Rare Funk, Soul, Beats, Hip Hop und Lo-Fi aus Berlin-Friedrichshain. Das Album Back on 16 pads, Tour-Dates, Pressekit, Merch und Booking.",
      };

export default async function HomeView() {
  const [gems, gigs] = await Promise.all([getGems(), getGigs()]);
  return (
    <>
      <Hero />
      <FeaturedRelease />
      <Dates gigs={gigs} />
      <PhotoEssay />
      {gems[0] && <GemOfTheWeek gem={gems[0]} />}
      <TurntableTeaser />
      <GameTeaser />
      <MerchPreview />
      <CrateClubSection />
    </>
  );
}
