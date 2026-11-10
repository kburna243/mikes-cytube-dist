"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Zählt eine Zahl hoch, sobald sie in den Viewport läuft.
 *
 * Der Endwert steht als Inhalt im Markup — ohne JavaScript und für
 * Screenreader ist von Anfang an der echte Wert da; die Animation setzt ihn
 * nur visuell auf 0 zurück.
 */
export default function CountUp({
  value,
  suffix = "",
  decimals = 0,
  duration = 1.6,
  className = "",
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = Number(value);
    if (Number.isNaN(target)) return;

    const fmt = new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    const state = { n: 0 };

    const ctx = gsap.context(() => {
      gsap.fromTo(
        state,
        { n: 0 },
        {
          n: target,
          duration,
          ease: "power2.out",
          onUpdate() {
            el.textContent = fmt.format(state.n) + suffix;
          },
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [value, suffix, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}
