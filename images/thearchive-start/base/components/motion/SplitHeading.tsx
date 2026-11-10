"use client";

import { createElement, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SplitHeadingProps {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  /** "scroll" startet beim Erscheinen, "mount" sofort. */
  on?: "scroll" | "mount";
  delay?: number;
  stagger?: number;
}

/**
 * Überschrift, deren Wörter aus einer Maske hochfahren.
 *
 * Der Text bleibt für Screenreader unangetastet: das Element trägt den
 * Volltext als aria-label, die animierten Wort-Spans sind aria-hidden.
 * reduced-motion: Text steht einfach da.
 */
export default function SplitHeading({
  text,
  as: Tag = "h2",
  className = "",
  on = "scroll",
  delay = 0,
  stagger = 0.055,
  ...rest
}: SplitHeadingProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const words = el.querySelectorAll("[data-word]");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { yPercent: 115 },
        {
          yPercent: 0,
          duration: 0.85,
          delay,
          stagger,
          ease: "power4.out",
          ...(on === "scroll"
            ? { scrollTrigger: { trigger: el, start: "top 88%", once: true } }
            : {}),
        },
      );
    }, el);

    return () => ctx.revert();
  }, [text, on, delay, stagger]);

  const words = String(text).split(" ");
  return createElement(
    Tag as React.ElementType,
    { ref, className, "aria-label": text, ...rest },
    words.map((word, i) => (
      <span key={`${word}-${i}`} aria-hidden="true">
        <span className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
          <span data-word className="inline-block will-change-transform">{word}</span>
        </span>
        {i < words.length - 1 ? " " : ""}
      </span>
    )),
  );
}
