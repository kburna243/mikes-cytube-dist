"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Zentrale Motion-Infrastruktur:
 * - Lenis Smooth-Scroll, an den GSAP-Ticker gekoppelt (ein rAF, kein Doppel-Loop)
 * - ScrollTrigger folgt dem Lenis-Scroll
 * - prefers-reduced-motion: kein Lenis, keine Verschönerung — natives Scrollen
 */
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      anchors: { offset: -96 }, // Sprungmarken landen unter dem klebenden Kopf
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Nach Fonts/Bildern einmal neu messen, damit ScrollTrigger-Marken stimmen.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready?.then(refresh).catch(() => {});

    return () => {
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
