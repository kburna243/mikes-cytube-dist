import { withBase } from "@/lib/base";
import type { CSSProperties } from "react";

/**
 * Pieces cut from the sticker logo as alpha masks, painted with `currentColor`.
 * wordmark: the swash "DJ Noizy Neighbor" lettering (the logo's "U" removed, "R" moved up; the original
 * NEIGHBOUR cut stays in logo-wordmark.webp). skyline: Berlin rooftops + Fernsehturm.
 */
const MARKS = {
  wordmark: { src: withBase("/assets/branding/logo-wordmark-neighbor.webp"), ratio: "986 / 525", label: "DJ Noizy Neighbor" },
  skyline: { src: withBase("/assets/branding/logo-skyline.webp"), ratio: "865 / 530", label: "Berliner Skyline mit Fernsehturm" },
} as const;

export default function LogoMark({
  kind,
  className = "",
  decorative = false,
}: {
  kind: keyof typeof MARKS;
  className?: string;
  decorative?: boolean;
}) {
  const m = MARKS[kind];
  const style: CSSProperties = {
    aspectRatio: m.ratio,
    backgroundColor: "currentColor",
    maskImage: `url(${m.src})`,
    WebkitMaskImage: `url(${m.src})`,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center bottom",
    WebkitMaskPosition: "center bottom",
  };
  return decorative ? (
    <span aria-hidden className={`block ${className}`} style={style} />
  ) : (
    <span role="img" aria-label={m.label} className={`block ${className}`} style={style} />
  );
}
