import { TopAppBar } from "@/components/layout/TopAppBar";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { Footer } from "@/components/layout/Footer";

export default function CommunityPage() {
  return (
    <>
      <TopAppBar />
      <main className="max-w-[1440px] mx-auto px-margin pt-lg pb-xl mb-16 md:mb-0 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <span className="font-label-caps text-label-caps text-secondary uppercase mb-base block">
            ARCHIVE NETWORK
          </span>
          <h1 className="font-display-lg text-display-lg text-primary mb-sm">
            Community Hub
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[36rem]">
            Der Community Hub öffnet nach der Beta-Phase. Hier entstehen
            Provenance-Diskussionen, Curator-Profile und ein globaler
            Discovery-Index.
          </p>
          <p className="font-data-mono text-data-mono text-on-surface-variant/60 text-sm mt-lg">
            Coming Soon — Stay Tuned
          </p>
        </div>
      </main>
      <BottomNavBar />
      <Footer />
    </>
  );
}
