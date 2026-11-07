import type { ReactNode } from "react";
import "../globals.css";
import SiteShell, { siteMetadata, siteViewport } from "@/components/site/SiteShell";

export const metadata = siteMetadata("en");
export const viewport = siteViewport;

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <SiteShell lang="en">{children}</SiteShell>;
}
