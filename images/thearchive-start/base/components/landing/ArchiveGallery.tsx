"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import { useEffect, useState } from "react";

const BASE_PATH = process.env.NEXT_PUBLIC_BUILD_TARGET === "mobile" ? "" : process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ArchiveScene3D = dynamic(() => import("./ArchiveScene3D"), { ssr: false });
class SceneErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

const cards = [
  { image: "/images/item-vinyl.svg", label: "Blue Note · Erstpressung", className: "gallery-card-vinyl" },
  { image: "/images/item-streetwear.svg", label: "Archivjacke · Studie 01", className: "gallery-card-jacket" },
  { image: "/images/item-gameboy.svg", label: "Game Boy · DMG-01", className: "gallery-card-game" },
  { image: "/images/item-pokemon.svg", label: "Sammelkarten · Basis-Set", className: "gallery-card-cards" },
];

export function ArchiveGallery() {
  const [active, setActive] = useState(false);
  const [canActivate, setCanActivate] = useState(false);
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1024px)");
    const probe = document.createElement("canvas");
    let webgl = false;
    try { const context = probe.getContext("webgl2") || probe.getContext("webgl");
      webgl = Boolean(context);
      context?.getExtension("WEBGL_lose_context")?.loseContext(); } catch { webgl = false; }
    const update = () => {
      setCanActivate(webgl && (!desktop.matches || reducedMotion.matches));
      setActive(webgl && desktop.matches && !reducedMotion.matches);
    };
    update();
    desktop.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    return () => { desktop.removeEventListener("change", update); reducedMotion.removeEventListener("change", update); };
  }, []);

  return (
    <>
      <div className={`landing-gallery${active ? " is-active" : ""}`} aria-label="Collection objects arranged as archival cards">
        <div className="gallery-orbit" aria-hidden="true" />
        {active && <div className="landing-scene-canvas" aria-hidden="true"><SceneErrorBoundary onError={() => setActive(false)}><ArchiveScene3D /></SceneErrorBoundary></div>}
        {!active && cards.map((card, index) => (
          <figure className={`gallery-card ${card.className}`} key={card.image}>
            <div className="gallery-card-mat"><img src={`${BASE_PATH}${card.image}`} alt="" /></div>
            <figcaption><span>DAS ARCHIV</span><span>{card.label}</span></figcaption>
            <span className="gallery-card-number">0{index + 1}</span>
          </figure>
        ))}
        <div className="gallery-coordinate" aria-hidden="true">OBJEKTSTUDIEN <span>51°30′26.4″N</span></div>
      </div>
      {canActivate && <button className="landing-motion-toggle" type="button" aria-pressed={active} onClick={() => setActive((value) => !value)}>{active ? "3D ausblenden" : "3D ansehen"}</button>}
    </>
  );
}