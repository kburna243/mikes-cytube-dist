import { correctName } from "./draw";
import type { DesignData } from "./types";

export function displayDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("de-DE");
}

export function generateCaption(data: DesignData): string {
  let text = "";
  let extraTags = "";
  switch (data.template) {
    case "gig":
      text = `${displayDate(data.date)}. ${data.venue}, ${data.city}.\n${data.note}\n\nDJ Noizy Neighbor an den Tellern. ${data.status === "SOLD OUT" ? "Ausverkauft. Wir sehen uns auf der Tanzfläche." : data.status === "CONFIRMED" ? "Steht fest. Wir sehen uns vorne." : "Platten eingepackt. Sichere dir dein Ticket."}`;
      extraTags = "#vinylonly #funk45s #djset";
      break;
    case "gem":
      text = `GEM DER WOCHE\n${data.title}${data.artist ? ` / ${data.artist}` : ""}\n${[data.label, data.country].filter(Boolean).join(" / ")}\n${data.badge}\n\n${data.story || "Im Netz nicht zu finden. Hier schon."}`;
      extraTags = "#vinylcollection #raregroove #recorddigging";
      break;
    case "release":
      text = `${data.title.toUpperCase()}\nDJ Noizy Neighbor / ${data.label} / ${data.year}\n\nRohe Beats. Direkt von den Pads.\nJetzt überall: Spotify, Apple Music und YouTube.`;
      extraTags = "#beatmaking #newrelease #hiphop";
      break;
    case "mix":
      text = `${data.title}\n${data.subtitle}\n\nJetzt auf ${data.platform}. Auflegen. Laut machen. Laufen lassen.`;
      extraTags = "#djmix #vinylonly #funk45s";
      break;
    case "statement":
      text = `${data.statement}\n\nDJ Noizy Neighbor. Berlin-Friedrichshain.\nPlatten, die sonst keiner mehr spielt.`;
      extraTags = "#soulmusic #underground #realbeats";
      break;
    case "studio":
      text = `${data.title}\n${data.label}\n\nEin Blick hinter die Beats. MPC an. Welt aus.`;
      extraTags = "#studiolife #mpc #beatmaking";
      break;
  }
  return correctName(`${text.trim()}\n\n#djnoizyneighbor #berlin #rarefunk #cratedigging ${extraTags}`);
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch { /* Fall back for embedded previews without clipboard permissions. */ }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Bitte den Caption-Text markieren und manuell kopieren.");
}