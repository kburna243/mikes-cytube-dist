import HomeView, { homeMetadata } from "@/views/HomeView";

export const metadata = homeMetadata("de");
export const dynamic = "force-dynamic";

export default function Page() {
  return <HomeView />;
}
