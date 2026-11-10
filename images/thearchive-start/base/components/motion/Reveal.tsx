"use client";

import { createElement, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Variant = "up" | "clip" | "scale";

interface RevealProps {
  children: React.ReactNode;
  /**
   * up    — Einblenden + 24px von unten (Standard)
   * clip  — wird von unten per Clip-Path aufgedeckt (für Fotos und Bühnen)
   * scale — leichtes Hochziehen aus 0.96
   */
  variant?: Variant;
  delay?: number;
  /** > 0 animiert die direkten Kinder nacheinander. */
  stagger?: number;
  start?: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Scroll-getriebener Reveal. Läuft genau einmal.
 * reduced-motion: Inhalt ist sofort sichtbar, es wird nichts animiert.
 */
export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  stagger = 0,
  start = "top 88%",
  className = "",
  as: Tag = "div",
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = stagger > 0 ? Array.from(el.children) : el;

    const fromVars = {
      up: { y: 24, autoAlpha: 0 },
      clip: { clipPath: "inset(12% 0% 12% 0%)", autoAlpha: 0, y: 16 },
      scale: { scale: 0.96, autoAlpha: 0, y: 12 },
    }[variant];

    const toVars = {
      up: { y: 0, autoAlpha: 1 },
      clip: { clipPath: "inset(0% 0% 0% 0%)", autoAlpha: 1, y: 0 },
      scale: { scale: 1, autoAlpha: 1, y: 0 },
    }[variant];

    const ctx = gsap.context(() => {
      gsap.fromTo(targets, fromVars, {
        ...toVars,
        duration: 0.9,
        delay,
        stagger,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [variant, delay, stagger, start]);

  return createElement(Tag as React.ElementType, { ref, className, ...rest }, children);
}
