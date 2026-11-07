import AboutView, { aboutMetadata } from "@/views/AboutView";

export const metadata = aboutMetadata("de");

export default function Page() {
  return <AboutView lang="de" />;
}
