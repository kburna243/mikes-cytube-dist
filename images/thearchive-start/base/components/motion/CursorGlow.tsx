"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Ein weicher Schleier, der dem Zeiger über die Seite folgt.
 *
 * Rein dekorativ: fixiert, ohne Zeigerereignisse, nur bei feinem Zeiger, bei
 * reduced-motion abgeschaltet. Die Farbe kommt aus `--glow-tint`, das jedes
 * Projekt selbst setzt; der Mischmodus wechselt mit dem Farbschema
 * (globals.css: multiply auf hell, screen auf dunkel).
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.set(el, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    const xTo = gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" });

    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to(el, { autoAlpha: 1, duration: 0.6 });
      }
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const onLeave = () => {
      shown = false;
      gsap.to(el, { autoAlpha: 0, duration: 0.4 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="cursor-glow no-print pointer-events-none fixed left-0 top-0 z-[1] h-[34rem] w-[34rem] rounded-full opacity-0"
      style={{
        background:
          "radial-gradient(closest-side, var(--glow-tint), transparent 72%)",
      }}
    />
  );
}
