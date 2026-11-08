import type { Campaign, PlatformId, Post, SlotType } from "./types";

const pieces: Record<SlotType, readonly string[]> = {
  announce: [
    "Neues aus der Kiste. {titel} kommt am {datum}.",
    "Ein neues {art} ist unterwegs. {titel} erscheint am {datum}.",
    "Aus Berlin direkt auf die Pads. {titel} kommt am {datum}.",
  ],
  reveal: [
    "Das Cover ist da. {titel} kommt am {datum}.",
    "So sieht {titel} aus. Ab {datum} auf den Tellern.",
    "Ein Blick auf {titel}. Noch {tage} Tage bis zum Release.",
  ],
  pitch: [
    "Rare Funk und staubige Hip-Hop-Beats aus Berlin. Warme Drums, MPC und analoge Synths treffen auf eine offene, nächtliche Stimmung. {botschaft} {titel} erscheint auf {label}.",
    "Instrumentale Beats aus Berlin: MPC-Drums, Vinyl-Texturen und analoge Synths. Erdiger Boom Bap mit Platz zum Abtauchen. {botschaft} {titel} erscheint auf {label}.",
    "{titel} verbindet Rare Funk, Lo-Fi und Hip-Hop-Beats. Die Stimmung ist warm und direkt, die Instrumente kommen von Pads und Synths. {botschaft} Release über {label}.",
  ],
  presave: [
    "{titel} kommt am {datum}. Jetzt vormerken, später laut drehen.",
    "Noch {tage} Tage. {titel} kannst du dir schon mal sichern.",
    "Bald läuft {titel}. Pre-Save ist offen.",
  ],
  behind: [
    "Ein Blick hinter die Pads. {botschaft}",
    "So klingt Arbeit im Studio. {botschaft}",
    "Aus dem Studio, direkt aus der Kiste. {botschaft}",
  ],
  countdown: [
    "Noch {tage} Tage. Dann läuft {titel} überall.",
    "Der Countdown läuft. {titel} kommt in {tage} Tagen.",
    "In {tage} Tagen ist {titel} draußen. Nadeln bereit?",
  ],
  tomorrow: [
    "Morgen ist es so weit. {titel} kommt raus.",
    "Noch einmal schlafen. Morgen läuft {titel}.",
    "Die Platte liegt bereit. {titel} erscheint morgen.",
  ],
  release: [
    "{titel} ist draußen. Lauter drehen.\n\n{botschaft}",
    "Ab heute überall: {titel}. Direkt aus Berlin.\n\n{botschaft}",
    "Nadel drauf. {titel} ist jetzt draußen.\n\n{botschaft}",
  ],
  thanks: [
    "Danke fürs Reinhören und Teilen. Ihr seid der Grund, warum ich weiter an den Pads sitze.",
    "Danke für eure Ohren, Nachrichten und Reposts. {titel} ist draußen und bei euch.",
    "Liebe an alle, die {titel} hören und teilen. Danke fürs Dabeisein.",
  ],
  studio: [
    "Zurück an den Pads. Ein Moment aus dem Studio zu {titel}.",
    "So sah es hinter {titel} aus. Hände an den Pads, Kopf im Sound.",
    "Noch ein Blick ins Studio. Hier hat {titel} Form angenommen.",
  ],
  crate: [
    "Aus der Kiste auf die Pads. Die Platten erzählen ihre eigenen Geschichten.",
    "Crate Story: Manchmal beginnt ein Beat mit einer Platte aus der Kiste.",
    "Staub auf der Hülle, Ideen auf den Pads. Ein Blick in die Plattenkiste.",
  ],
  recap: [
    "Zwei Wochen {titel}. Danke, dass ihr reinhört.",
    "{titel} dreht sich seit zwei Wochen. Danke für den Support.",
    "Ein kleiner Rückblick auf {titel}. Danke fürs Hören und Teilen.",
  ],
  custom: [
    "Neues aus der Kiste: {titel}. {botschaft}",
    "Direkt aus Berlin. {titel}. {botschaft}",
    "Von den Pads zu euch: {titel}. {botschaft}",
  ],
};

const englishPieces: Record<SlotType, readonly string[]> = {
  announce: ["Fresh from the crate. {titel} arrives on {datum}.", "A new {art} is on its way. {titel} lands on {datum}.", "From Berlin and the pads: {titel}, out on {datum}."],
  reveal: ["Here's the cover. {titel} arrives on {datum}.", "This is {titel}. Out on {datum}.", "A first look at {titel}. {tage} days to go."],
  pitch: ["Rare funk and dusty hip-hop beats from Berlin. Warm drums, MPC and analogue synths set a late-night mood. {botschaft} {titel} is released on {label}.", "Instrumental beats from Berlin: MPC drums, vinyl textures and analogue synths. {botschaft} {titel} comes out on {label}.", "{titel} connects rare funk, lo-fi and hip-hop beats. Pads and synths make a warm, direct sound. {botschaft} Out on {label}."],
  presave: ["{titel} arrives on {datum}. Save it now, play it loud later.", "{tage} days to go. You can save {titel} now.", "{titel} is coming. Pre-save is open."],
  behind: ["A look behind the pads. {botschaft}", "A moment in the studio. {botschaft}", "From the studio and straight out of the crate. {botschaft}"],
  countdown: ["{tage} days to go. Then {titel} is out everywhere.", "The countdown is on. {titel} arrives in {tage} days.", "{titel} is out in {tage} days. Needles ready?"],
  tomorrow: ["Tomorrow is the day. {titel} is coming out.", "One more sleep. {titel} drops tomorrow.", "The record is ready. {titel} arrives tomorrow."],
  release: ["{titel} is out. Turn it up.\n\n{botschaft}", "Out today: {titel}, straight from Berlin.\n\n{botschaft}", "Needle down. {titel} is out now.\n\n{botschaft}"],
  thanks: ["Thanks for listening and sharing. You're why I keep coming back to the pads.", "Thanks for your ears, messages and reposts. {titel} is out and with you.", "Love to everyone listening to and sharing {titel}. Thank you."],
  studio: ["Back at the pads. A studio moment from {titel}.", "Behind {titel}: hands on the pads, head in the sound.", "Another look inside the studio, where {titel} took shape."],
  crate: ["From the crate to the pads. Records have stories of their own.", "Crate story: sometimes a beat starts with a record from the box.", "Dust on the sleeve, ideas on the pads. A look inside the crate."],
  recap: ["Two weeks of {titel}. Thanks for listening.", "{titel} has been spinning for two weeks. Thanks for the support.", "Looking back at {titel}. Thanks for listening and sharing."],
  custom: ["Fresh from the crate: {titel}. {botschaft}", "Straight from Berlin. {titel}. {botschaft}", "From the pads to you: {titel}. {botschaft}"],
};

export function correctName(value: string): string {
  return value.replace(/neighbour/gi, (match) => {
    if (match === match.toUpperCase()) return "NEIGHBOR";
    if (match[0] === match[0].toUpperCase()) return "Neighbor";
    return "neighbor";
  });
}

function dateInWords(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long" }).format(new Date(year, month - 1, day, 12));
}

export function linkFor(campaign: Campaign, platform: PlatformId, type: SlotType): string {
  if (type === "presave") return campaign.links.presave?.trim() || "";
  if (platform === "youtube" && campaign.links.youtube?.trim()) return campaign.links.youtube.trim();
  if (platform === "mixcloud" && campaign.links.mixcloud?.trim()) return campaign.links.mixcloud.trim();
  return [campaign.links.smartlink, campaign.links.spotify, campaign.links.applemusic, campaign.links.youtube, campaign.links.bandcamp, campaign.links.mixcloud].find((link) => link?.trim())?.trim() || "";
}

export function captionFor(campaign: Campaign, type: SlotType, platform: PlatformId, day: number, variant = 0): string {
  const list = pieces[type];
  const index = ((variant % list.length) + list.length) % list.length;
  const replacements: Record<string, string> = {
    titel: campaign.title,
    art: campaign.kind === "ep" ? "EP" : campaign.kind === "mix" ? "Mix" : campaign.kind === "single" ? "Single" : "Album",
    datum: dateInWords(campaign.releaseDate),
    tage: String(Math.abs(day)),
    link: linkFor(campaign, platform, type),
    botschaft: campaign.message,
    label: campaign.label || "DJ Noizy Neighbor",
  };
  let text = pieces[type][index].replace(/\{(titel|art|datum|tage|link|botschaft|label)\}/g, (_, key: string) => replacements[key] || "");
  text = text.replace(/[ \t]+\n/g, "\n").replace(/ {2,}/g, " ").trim();
  if (platform === "instagram") {
    text = text.replace(/https?:\/\/\S+/gi, "").trim();
    text += "\n\nLink in Bio";
  } else if (platform !== "spotify" && platform !== "tiktok") {
    const link = linkFor(campaign, platform, type);
    if (link) text += `\n\n${platform === "newsletter" ? "Hier hören: " : ""}${link}`;
  }
  return correctName(text);
}

export function captionForEn(campaign: Campaign, type: SlotType, platform: PlatformId, day: number, variant = 0): string {
  const list = englishPieces[type];
  const index = ((variant % list.length) + list.length) % list.length;
  const replacements: Record<string, string> = {
    titel: campaign.title, art: campaign.kind === "ep" ? "EP" : campaign.kind === "mix" ? "mix" : campaign.kind === "single" ? "single" : "album",
    datum: dateInWords(campaign.releaseDate), tage: String(Math.abs(day)), link: linkFor(campaign, platform, type),
    botschaft: campaign.messageEn || "", label: campaign.label || "DJ Noizy Neighbor",
  };
  let text = list[index].replace(/\{(titel|art|datum|tage|link|botschaft|label)\}/g, (_, key: string) => replacements[key] || "").replace(/[ \t]+\n/g, "\n").replace(/ {2,}/g, " ").trim();
  if (platform === "instagram") text = `${text.replace(/https?:\/\/\S+/gi, "").trim()}\n\nLink in Bio`;
  else if (platform !== "spotify" && platform !== "tiktok") {
    const link = linkFor(campaign, platform, type);
    if (link) text += `\n\n${platform === "newsletter" ? "Listen here: " : ""}${link}`;
  }
  return correctName(text);
}

export function hashtagsFor(campaign: Campaign, platform: PlatformId): string[] {
  const count: Record<PlatformId, number> = { instagram: 5, facebook: 2, youtube: 3, tiktok: 4, mixcloud: 5, newsletter: 0, spotify: 0 };
  return campaign.hashtags.slice(0, count[platform]).map(correctName);
}

export function instagramText(value: string): string {
  const cleaned = correctName(value).replace(/https?:\/\/\S+/gi, "").replace(/\s*link in bio\.?\s*$/i, "").trim();
  return `${cleaned}${cleaned ? "\n\n" : ""}Link in Bio`;
}

export function fullPostText(post: Post): string {
  const text = post.platform === "instagram" ? instagramText(post.text) : correctName(post.text.trim());
  const hashtags = post.hashtags.map(correctName).filter(Boolean).join(" ");
  return [text, hashtags].filter(Boolean).join("\n\n");
}