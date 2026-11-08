import type { Campaign, Slot } from "./types";
import { addCalendarDays } from "./plan";
import { placementName, PLATFORMS } from "./platforms";
import { correctName } from "./captions";
import { downloadBlob, slug } from "./share";

function escapeText(text: string): string {
  return correctName(text).replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let part = "";
  for (const character of line) {
    if (encoder.encode(part + character).length > 75) {
      lines.push(part);
      part = ` ${character}`;
    } else part += character;
  }
  lines.push(part);
  return lines.join("\r\n");
}

export function calendarText(campaign: Campaign): string {
  const days = new Map<number, Slot[]>();
  for (const slot of campaign.slots.filter((entry) => entry.posts.length)) {
    days.set(slot.day, [...(days.get(slot.day) || []), slot]);
  }
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DJ Noizy Neighbor//Content Schleuder//DE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const [day, entries] of [...days.entries()].sort(([a], [b]) => a - b)) {
    const sorted = [...entries].sort((a, b) => a.time.localeCompare(b.time));
    const date = addCalendarDays(campaign.releaseDate, day).replace(/-/g, "");
    const time = (sorted[0].time || "18:00").replace(":", "");
    const description = sorted.map((slot) => `${slot.time} ${slot.title}: ${slot.posts.map((post) => `${PLATFORMS[post.platform].name} (${placementName(post)})`).join(", ")}`).join("\n");
    lines.push("BEGIN:VEVENT", `UID:${slug(campaign.id)}-${date}@noizy-schleuder`, `DTSTAMP:${stamp}`, `DTSTART:${date}T${time}00`, "DURATION:PT15M", `SUMMARY:${escapeText(`${campaign.title} · ${sorted[0].title} posten`)}`, `DESCRIPTION:${escapeText(description)}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export function downloadCalendar(campaign: Campaign): void {
  downloadBlob(new Blob([calendarText(campaign)], { type: "text/calendar;charset=utf-8" }), `noizy_${slug(campaign.title)}_fahrplan.ics`);
}