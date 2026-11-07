import { correctName } from "./draw";
import type { DesignData, TemplateId, WerkstattGem, WerkstattGig, WerkstattProps } from "./types";

export const TEMPLATES: { id: TemplateId; name: string; shortName: string; description: string }[] = [
  { id: "gig", name: "Gig-Ankündigung", shortName: "Gig", description: "Nächster Stop: volle Tanzfläche." },
  { id: "gem", name: "Gem der Woche", shortName: "Gem der Woche", description: "Aus der Kiste. In den Feed." },
  { id: "release", name: "Release / Neuer Track", shortName: "Release", description: "Neue Beats brauchen ein Cover." },
  { id: "mix", name: "Mix / Live-Set", shortName: "Mix / Live-Set", description: "Deine Selektion. Dein Set." },
  { id: "statement", name: "Statement", shortName: "Statement", description: "Wenig Worte. Viel Haltung." },
  { id: "studio", name: "Studio-Moment", shortName: "Studio-Moment", description: "Ein Blick hinter die Beats." },
];

export function applyGig(data: DesignData, gig: WerkstattGig): DesignData {
  return sanitizeData({ ...data, date: gig.date, venue: gig.venue, city: gig.city, status: gig.status, note: gig.note ?? "" });
}

export function applyGem(data: DesignData, gem: WerkstattGem): DesignData {
  return sanitizeData({ ...data, title: gem.title, artist: gem.artist ?? "", label: gem.label, country: gem.country ?? "", badge: gem.badge, story: gem.story ?? "Im Netz nicht zu finden. Hier schon.", image: gem.img, photoLook: "original", crop: { x: 0, y: 0, zoom: 1 } });
}

export function sanitizeData(data: DesignData): DesignData {
  const result = { ...data };
  for (const key of Object.keys(result) as (keyof DesignData)[]) {
    if (typeof result[key] === "string" && key !== "image") {
      (result as unknown as Record<string, unknown>)[key] = correctName(result[key] as string);
    }
  }
  return result;
}

export function createDefaultData(template: TemplateId, props: Pick<WerkstattProps, "gigs" | "gems" | "release">): DesignData {
  let data: DesignData = {
    template,
    date: "2026-12-12",
    venue: "Riva Bar",
    city: "Berlin",
    status: "TICKETS",
    note: "Funk 45s All Night",
    title: "BAD THING",
    artist: "DJ Noizy Neighbor",
    label: "NoizyNeighborProductions",
    country: "Berlin",
    badge: "VINYL ONLY",
    story: "Im Netz nicht zu finden. Hier schon.",
    year: "2023",
    subtitle: "24 tough Funk 45s, live in der Riva Bar Berlin, 2007",
    platform: "MIXCLOUD",
    statement: "RARE FUNK.\nSOUL & BEATS.\nNOIZY NEIGHBOR.",
    accentWord: 6,
    image: "/assets/photos/photo-03-live-dj-set-turntables.webp",
    photoLook: "duotone",
    crop: { x: 0, y: template === "gig" ? -0.65 : -0.1, zoom: 1 },
    logoPosition: "bottom-right",
    logoVariant: "badge",
    texture: "papier",
    sticker: "",
  };
  if (template === "gig" && props.gigs?.[0]) data = applyGig(data, props.gigs[0]);
  if (template === "gem") {
    data = applyGem(data, props.gems?.[0] ?? {
      title: "Themes From The Movies Starring Yuen Biao", label: "Victor VIP-28111", country: "Japan", badge: "Discogs: 1.337 \u20ac", img: "/assets/gems/yuen-biao.webp",
    });
    data.logoVariant = "wordmark";
  }
  if (template === "release") {
    data.title = props.release?.title ?? "Back on 16 pads";
    data.year = props.release?.year ?? "2023";
    data.label = props.release?.label ?? "NoizyNeighborProductions";
    data.image = props.release?.cover ?? "/assets/releases/back-on-16-pads.webp";
    data.photoLook = "original";
    data.logoVariant = "wordmark";
  }
  if (template === "mix") data.image = "/assets/ui/pattern-70s-waves.webp";
  if (template === "statement") data.logoVariant = "wordmark";
  if (template === "studio") {
    data.image = "/assets/photos/photo-02-studio-mpc-beatmaking.webp";
    data.title = "Zurück an den 16 Pads.";
    data.label = "BERLIN-FRIEDRICHSHAIN / STUDIO SESSION";
    data.logoPosition = "top-right";
  }
  return sanitizeData(data);
}