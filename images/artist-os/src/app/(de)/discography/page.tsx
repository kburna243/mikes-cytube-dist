import MusicView, { musicMetadata } from "@/views/MusicView";

export const metadata = musicMetadata("de");
export const dynamic = "force-dynamic";

export default function Page() {
  return <MusicView lang="de" />;
}
