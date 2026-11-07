import MusicView, { musicMetadata } from "@/views/MusicView";

export const metadata = musicMetadata("en");
export const dynamic = "force-dynamic";

export default function Page() {
  return <MusicView lang="en" />;
}
