import type { Metadata } from "next";
import { Newsreader, Work_Sans } from "next/font/google";
import { Providers } from "./providers";
import MotionProvider from "@/components/motion/MotionProvider";
import CursorGlow from "@/components/motion/CursorGlow";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  icons: { apple: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/brand/archive-mark-192.png` },
  title: "The Archive — Built by a Collector. Preserved by AI.",
  description:
    "A specialized platform for high-end vintage collectors and archivists. Digitize, identify, and showcase your collection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${workSans.variable}`}>
      <body className="min-h-screen antialiased">
        <CursorGlow />
        <MotionProvider>
          <Providers>{children}</Providers>
        </MotionProvider>
      </body>
    </html>
  );
}
