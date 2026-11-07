import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { archivo, spaceMono } from "./fonts";
import "../globals.css";

export const metadata: Metadata = { title: "Noizy Admin", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

/** Own root layout: the admin has no site header, player or consent banner. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={`${archivo.variable} ${spaceMono.variable}`}>
      <body className="bg-page font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
