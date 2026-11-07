import { ALBUM, BRAND, CONTACTS, GEAR, LEGAL, PRODUCTS, SOCIALS, TRACKS } from "@/lib/data";

/**
 * Questionnaire behind /admin "Inhalte prüfen": CONTENT-VORLAGE.md as steps Martin can walk through.
 * `current` is what the site shows today. Structured values come straight from data.ts; the text blocks
 * mirror the COPY objects in HomeSections / AboutView / BookingsView (keep them in sync when copy changes).
 */
export type CheckField = {
  id: string;
  label: string;
  current?: string;
  hint?: string;
  kind?: "text" | "textarea" | "choice";
  options?: string[];
  required?: boolean;
};

export type CheckSection = { id: string; title: string; intro: string; fields: CheckField[]; adminTab?: "dates" | "gems" };

export type CheckStatus = "ok" | "new" | "later";
export type CheckAnswer = { status: CheckStatus; value: string };

const PLACEHOLDER = /^\[.*\]$/;
const legal = (v: string) => (PLACEHOLDER.test(v) || !v ? undefined : v);

export const SECTIONS: CheckSection[] = [
  {
    id: "basics",
    title: "Grunddaten",
    intro: "Die Eckdaten, die überall auf der Seite und im Pressekit auftauchen.",
    fields: [
      { id: "basics.name", label: "Künstlername", current: BRAND.name, hint: "So steht er auf Spotify, Apple Music und YouTube: Neighbor ohne u." },
      { id: "basics.city", label: "Stadtteil / Basis", current: "Berlin-Friedrichshain" },
      { id: "basics.genres", label: "Genres (höchstens 5)", current: BRAND.genres.join(", ") },
      { id: "basics.since", label: "Erste Beats", current: "Anfang der 2000er, auf einer MPC 2000XL", hint: "Aus deinem Album-Text übernommen." },
      { id: "basics.gigs", label: "Anzahl Gigs, ungefähr", hint: "Steht nicht mehr auf der Seite. Wenn du eine Zahl nennen magst, kommt sie in die Bio." },
      { id: "basics.releases", label: "Eigene Releases (Anzahl)", current: "3" },
    ],
  },
  {
    id: "home",
    title: "Startseite",
    intro: "Kurz ist besser: Überschriften 2 bis 4 Wörter, Absätze 1 bis 3 Sätze. Bitte keine langen Gedankenstriche.",
    fields: [
      { id: "home.kicker", label: "Kleine Zeile über dem Namen", current: "Berlin-Friedrichshain, DJ & Produzent" },
      { id: "home.heroLine", label: "Satz unter dem Namen (höchstens 20 Wörter)", current: "Rare Funk, Soul und staubige Beats. Platten, die sonst keiner mehr spielt.", kind: "textarea" },
      { id: "home.essayTitle", label: "Fotostrecke, Überschrift", current: "Aus der Plattenkiste auf den Floor." },
      { id: "home.essayText", label: "Fotostrecke, kurzer Text (2 bis 3 Sätze)", current: "Beats seit Anfang der 2000er, angefangen auf der MPC 2000XL. Gesampelt wird nur aus der eigenen Plattensammlung. Alles andere entscheidet der Floor.", kind: "textarea" },
      { id: "home.promoters", label: "Kasten „Für Veranstalter“ (1 bis 2 Sätze)", current: "Vinyl-only Sets, hybride MPC-Live-Sets und B2B. Pressefotos, Bio und Rider liegen bereit.", kind: "textarea" },
      { id: "home.club", label: "Crate Club (Newsletter), Text", current: "Einmal im Monat: Secret Gigs, unveröffentlichte Edits und Vorab-Tickets. Wie ein Tape im Briefkasten.", kind: "textarea" },
      { id: "home.clubReal", label: "Gibt es den Newsletter wirklich?", kind: "choice", options: ["Ja, gibt es", "Nein, Bereich rausnehmen"], required: true, hint: "Wenn ja, brauchen wir eine Bestätigungsmail (Double-Opt-In)." },
    ],
  },
  {
    id: "about",
    title: "Über dich",
    intro: "Die Über-Seite: Intro, drei Haltungen und dein Rig.",
    fields: [
      { id: "about.intro", label: "Intro (höchstens 2 Sätze)", current: "Seine ersten Beats baute er Anfang der 2000er auf einer MPC 2000XL. Nach über 13 Jahren Pause ist er zurück an den 16 Pads, mit einer Plattensammlung aus mehr als 20 Jahren.", kind: "textarea" },
      { id: "about.stance1", label: "Haltung 1", current: "Die Kiste ist die Quelle. Gesampelt wird nur aus der eigenen Sammlung, über 20 Jahre zusammengetragen und mit Sorgfalt ausgewählt. Jeder Loop ist auch ein Dank an die Künstler hinter den oft vergessenen Platten.", kind: "textarea" },
      { id: "about.stance2", label: "Haltung 2", current: "Analog klingt nach Entscheidung. Er mischt und mastert selbst, über analoge Hardware und eine alte Master-Bandmaschine. Das Knistern der Platten bleibt drin, gerade die Imperfektion macht den Charakter. Keep it raw and real.", kind: "textarea" },
      { id: "about.stance3", label: "Haltung 3", current: "Berlin spielt mit. Nachts über die Warschauer Brücke, Späti-Neon, der Fernsehturm über allem. Die Stadt liefert die Breaks, ich setze sie nur zusammen.", kind: "textarea" },
      { id: "about.stores", label: "Lieblings-Plattenläden (optional, für die Bio)", kind: "textarea" },
      ...GEAR.map((g, i) => ({ id: `about.gear${i}`, label: `Rig: ${g.name}`, current: `${g.qty} ${g.name} · ${g.role} · ${g.spec}`, hint: i === 0 ? "Stimmt dein Equipment so? Falsches Gerät: Ändern und „gibt es nicht“ schreiben." : undefined })),
      { id: "about.gearMore", label: "Fehlt etwas im Rig?", kind: "textarea" },
    ],
  },
  {
    id: "music",
    title: "Musik",
    intro: `Dein Album „${ALBUM.title}“ ist schon drin, mit YouTube, Spotify, Apple Music und Deezer. Hier geht es um alles andere.`,
    fields: [
      { id: "music.more", label: "Weitere Releases, Mixtapes oder Features (Links)", kind: "textarea" },
      { id: "music.tracksReal", label: "Die drei Tracks im Seiten-Player sind KI-Platzhalter. Was machen wir?", kind: "choice", options: ["Ich schicke echte Audio-Dateien", "Player vorerst so lassen"], required: true },
      ...TRACKS.map((t) => ({ id: `music.track.${t.id}`, label: `Player-Track ${t.no}`, current: `${t.title} · ${t.mix} · ${t.bpm} BPM · ${t.key} · ${t.genre}` })),
      { id: "music.soundcloud", label: "SoundCloud-Profil (echte URL)", current: SOCIALS.find((s) => s.id === "soundcloud")?.url },
      { id: "music.bandcamp", label: "Bandcamp (falls vorhanden)" },
    ],
  },
  {
    id: "dates",
    title: "Termine & Booking",
    intro: "Termine pflegst du direkt im Admin unter „Termine“. Die Beispieltermine dort bitte durch echte ersetzen. Hier geht es um die Rider.",
    adminTab: "dates",
    fields: [
      { id: "dates.done", label: "Sind die Termine im Admin echt?", kind: "choice", options: ["Ja, nur noch echte drin", "Noch nicht"], required: true },
      { id: "dates.past", label: "Vergangene Gigs, die genannt werden sollen (3 bis 5)", kind: "textarea" },
      { id: "dates.riderSetup", label: "Technical Rider: DJ-Setup", current: "Ich spiele auf zwei Technics-Turntables und meinem Vestax PMC-06 Pro Battle-Mixer, Abnahme über Booth-XLR.", kind: "textarea" },
      { id: "dates.riderMonitor", label: "Technical Rider: Monitoring", current: "2 Booth-Monitore auf Ohrhöhe, mindestens 200 W, Mono-Schalter.", kind: "textarea" },
      { id: "dates.riderSignal", label: "Technical Rider: Signalweg", current: "Mixer-Master in Club-Limiter in PA. Kein Digitalmixer nötig, Phono-Pegel beachten.", kind: "textarea" },
      { id: "dates.riderBooth", label: "Technical Rider: Booth", current: "Stabiler Tisch 120 x 60 cm, vibrationsarm, ohne direkten Kontakt zum Floor.", kind: "textarea" },
      { id: "dates.hospBackstage", label: "Hospitality: Backstage", current: "Club-Mate, Wasser still und sprudelnd, gern ein paar Ingwer-Shots." },
      { id: "dates.hospHotel", label: "Hospitality: Hotel", current: "Nah am Venue ist wichtiger als Sterne, Late Checkout." },
      { id: "dates.hospTravel", label: "Hospitality: Reise", current: "Bahn oder Economy+. Die Platten reisen immer im Handgepäck." },
      { id: "dates.budgets", label: "Gagen-Spannen im Booking-Formular", current: "unter 500 €, 500 bis 1.000 €, 1.000 bis 2.500 €, 2.500 bis 5.000 €, 5.000 € und mehr", hint: "Oder ganz rausnehmen? Dann einfach „rausnehmen“ schreiben." },
    ],
  },
  {
    id: "shop",
    title: "Shop",
    intro: "Wenn im Shop echte Bestellungen ankommen sollen, brauchen wir AGB und eine Widerrufsbelehrung.",
    fields: [
      { id: "shop.real", label: "Gibt es den Merch wirklich zu kaufen?", kind: "choice", options: ["Ja, verkaufen", "Noch nicht, Shop ausblenden"], required: true },
      ...PRODUCTS.map((p) => ({ id: `shop.product.${p.id}`, label: `Produkt: ${p.name}`, current: `${p.price} €${p.compareAt ? ` (statt ${p.compareAt} €)` : ""}${p.sizes?.length ? ` · ${p.sizes.join(", ")}` : ""} · ${p.desc}`, kind: "textarea" as const })),
      { id: "shop.code", label: "Rabattcode", current: "NOIZY10 (10 %)" },
      { id: "shop.shipping", label: "Versandinfo", current: "Versand aus Friedrichshain in 2 bis 4 Tagen." },
    ],
  },
  {
    id: "contact",
    title: "Kontakt & Socials",
    intro: "Die Mailadressen gibt es vermutlich nicht. Bitte echte eintragen oder bestätigen.",
    fields: [
      { id: "contact.booking", label: "Mail für Booking & Management", current: CONTACTS.booking, required: true },
      { id: "contact.press", label: "Mail für Presse", current: CONTACTS.press, required: true },
      { id: "contact.fan", label: "Mail für Post / Fans", current: CONTACTS.fan },
      { id: "contact.mgmt", label: "Management / Agentur", current: CONTACTS.mgmt, hint: "Ausgedacht. Gibt es ein Management? Sonst „keins“ schreiben." },
      ...SOCIALS.map((s) => ({ id: `contact.social.${s.id}`, label: `${s.label}`, current: `${s.handle} · ${s.url}`, required: s.id === "instagram" })),
    ],
  },
  {
    id: "press",
    title: "Pressekit",
    intro: "Für Veranstalter und Presse. Die Bio schreibst du in der dritten Person.",
    fields: [
      { id: "press.shortBio", label: "Kurz-Bio (3 bis 5 Sätze, „DJ Noizy Neighbor ist …“)", kind: "textarea", required: true },
      { id: "press.longBio", label: "Lange Bio (optional, bis 1.500 Zeichen)", kind: "textarea" },
      { id: "press.quotes", label: "Pressezitate oder Erwähnungen (Zitat + Quelle)", kind: "textarea" },
      { id: "press.photos", label: "Pressefotos", kind: "choice", options: ["Ich schicke echte Fotos mit Fotografen-Credit", "KI-Fotos behalten und kennzeichnen"], hint: "Die Fotos auf der Seite sind KI-generiert." },
    ],
  },
  {
    id: "legal",
    title: "Impressum",
    intro: "Pflicht: Ohne diese Angaben darf die Seite in Deutschland nicht dauerhaft öffentlich bleiben. Die Daten sieht nur das Admin-Team, bis wir sie einpflegen.",
    fields: [
      { id: "legal.name", label: "Vor- und Nachname (echter Name)", current: legal(LEGAL.name), required: true },
      { id: "legal.street", label: "Straße und Hausnummer (kein Postfach)", current: legal(LEGAL.street), required: true },
      { id: "legal.zipCity", label: "PLZ und Ort", current: legal(LEGAL.zip) && `${LEGAL.zip} ${LEGAL.city}`, required: true },
      { id: "legal.email", label: "E-Mail für rechtliche Anfragen", current: legal(LEGAL.email), required: true },
      { id: "legal.phone", label: "Telefon (optional)", current: legal(LEGAL.phone) },
      { id: "legal.vat", label: "USt-IdNr. (nur falls vorhanden)", current: legal(LEGAL.vatId) },
      { id: "legal.logs", label: "Wie lange werden Server-Logs aufbewahrt (Tage)?", hint: "Wissen wir, kannst du auf „Später“ lassen." },
    ],
  },
];

export const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);
export const FIELD_IDS = new Set(ALL_FIELDS.map((f) => f.id));

/** A field counts as done once Martin confirmed it, wrote something new or picked an option. */
export const isDone = (a?: CheckAnswer) => !!a && (a.status === "ok" || (a.status === "new" && a.value.trim() !== ""));

/** Markdown summary for us to apply on the site: only what changed or is still open. */
export function toMarkdown(answers: Record<string, CheckAnswer>): string {
  const out = ["# Inhalte von Noizy", ""];
  for (const s of SECTIONS) {
    out.push(`## ${s.title}`, "");
    for (const f of s.fields) {
      const a = answers[f.id];
      const mark = f.required ? " (Pflicht)" : "";
      if (a?.status === "new" && a.value.trim()) out.push(`- **${f.label}**: ${a.value.trim()}${f.current ? `  \n  _vorher: ${f.current}_` : ""}`);
      else if (a?.status === "ok") out.push(`- ${f.label}: stimmt`);
      else out.push(`- ${f.label}: offen${mark}`);
    }
    out.push("");
  }
  return out.join("\n");
}
