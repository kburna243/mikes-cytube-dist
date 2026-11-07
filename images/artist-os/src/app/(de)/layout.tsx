import type { ReactNode } from "react";
import "../globals.css";
import SiteShell, { siteMetadata, siteViewport } from "@/components/site/SiteShell";

export const metadata = siteMetadata("de");
export const viewport = siteViewport;

export default function GermanLayout({ children }: { children: ReactNode }) {
  return <SiteShell lang="de">{children}</SiteShell>;
}
