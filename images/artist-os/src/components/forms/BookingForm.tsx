"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Send, Check } from "lucide-react";
import { withBase } from "@/lib/base";
import { useLang } from "@/lib/useLang";

const EVENT_TYPES = ["Club Night", "Festival", "Corporate / Brand", "Vinyl-Only Session", "Open Air", "Radio / Stream"];
const BUDGETS = ["< €500", "€500 - €1.000", "€1.000 - €2.500", "€2.500 - €5.000", "€5.000+"];
/** stored value stays German (what the team reads in the DB), the label follows the page language */
const SOUND = [
  { value: "Club-PA vorhanden", en: "Club PA available" },
  { value: "Festival-Rig vorhanden", en: "Festival rig available" },
  { value: "Komplett-Setup nötig", en: "Full setup needed" },
  { value: "Unklar, beratet mich", en: "Not sure, please advise" },
];

const COPY = {
  de: {
    errPromoter: "Veranstalter / Venue fehlt.",
    errEmail: "Bitte eine gültige E-Mail angeben.",
    errDate: "Bitte ein Wunschdatum wählen.",
    errCity: "Stadt / Land fehlt.",
    failed: "Anfrage fehlgeschlagen",
    doneTitle: "Anfrage ist angekommen.",
    doneText: "Wir melden uns meist innerhalb von 48 Stunden mit Verfügbarkeit, Gage und Reiseplanung.",
    ref: "Referenz",
    promoter: "Veranstalter / Venue *",
    promoterPh: "z. B. Club XYZ, Berlin",
    email: "E-Mail *",
    date: "Wunschdatum *",
    city: "Stadt / Land *",
    type: "Event-Typ",
    budget: "Budget-Range (Fee)",
    sound: "Sound-Anforderungen",
    message: "Nachricht / Line-Up / Besonderheiten",
    messagePh: "Was für eine Nacht soll es werden?",
    submit: "Anfrage abschicken",
  },
  en: {
    errPromoter: "Promoter / venue is missing.",
    errEmail: "Please enter a valid email address.",
    errDate: "Please pick a date.",
    errCity: "City / country is missing.",
    failed: "Request failed",
    doneTitle: "Request received.",
    doneText: "We usually reply within 48 hours with availability, fee and travel plans.",
    ref: "Reference",
    promoter: "Promoter / venue *",
    promoterPh: "e.g. Club XYZ, London",
    email: "Email *",
    date: "Preferred date *",
    city: "City / country *",
    type: "Event type",
    budget: "Budget range (fee)",
    sound: "Sound requirements",
    message: "Message / line-up / details",
    messagePh: "What kind of night are you planning?",
    submit: "Send request",
  },
};

const inputCls =
  "w-full rounded-[3px] border-2 border-fg bg-page px-4 py-3 text-fg placeholder:text-fg-muted/70 focus:border-vinyl focus:outline-none";
const labelCls = "mb-2 block text-sm font-semibold text-fg";

/** Validated booking request form, persists into Postgres. */
export default function BookingForm() {
  const lang = useLang();
  const t = COPY[lang];
  const [form, setForm] = useState({
    promoter: "",
    email: "",
    eventDate: "",
    city: "",
    eventType: EVENT_TYPES[0],
    budget: BUDGETS[1],
    sound: SOUND[0].value,
    message: "",
  });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.promoter.trim().length < 2) return fail(t.errPromoter);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) return fail(t.errEmail);
    if (!form.eventDate) return fail(t.errDate);
    if (form.city.trim().length < 2) return fail(t.errCity);
    setState("busy");
    try {
      const res = await fetch(withBase("/api/bookings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { ok: boolean; message?: string; ref?: string };
      if (!res.ok || !json.ok) throw new Error(t.failed);
      setState("done");
      setMsg(json.ref ?? "");
    } catch {
      fail(t.failed);
    }
  }

  function fail(m: string) {
    setState("error");
    setMsg(m);
  }

  if (state === "done") {
    return (
      <div className="cassette p-8">
        <Check className="size-8 text-vinyl" />
        <h3 className="mt-4 text-3xl font-bold tracking-tight">{t.doneTitle}</h3>
        <p className="mt-3 max-w-md leading-relaxed text-fg-muted">{t.doneText}</p>
        {msg && <p className="mt-4 font-mono text-sm">{t.ref}: {msg}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="cassette p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>{t.promoter}</span>
          <input className={inputCls} value={form.promoter} onChange={(e) => set("promoter")(e.target.value)} placeholder={t.promoterPh} />
        </label>
        <label className="block">
          <span className={labelCls}>{t.email}</span>
          <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="promoter@venue.club" />
        </label>
        <label className="block">
          <span className={labelCls}>{t.date}</span>
          <input type="date" className={`${inputCls} [color-scheme:light]`} value={form.eventDate} onChange={(e) => set("eventDate")(e.target.value)} min="2026-01-01" />
        </label>
        <label className="block">
          <span className={labelCls}>{t.city}</span>
          <input className={inputCls} value={form.city} onChange={(e) => set("city")(e.target.value)} placeholder="Berlin, DE" />
        </label>
        <label className="block">
          <span className={labelCls}>{t.type}</span>
          <select className={inputCls} value={form.eventType} onChange={(e) => set("eventType")(e.target.value)}>
            {EVENT_TYPES.map((x) => <option key={x} value={x} className="bg-page">{x}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>{t.budget}</span>
          <select className={inputCls} value={form.budget} onChange={(e) => set("budget")(e.target.value)}>
            {BUDGETS.map((b) => <option key={b} value={b} className="bg-page">{b}</option>)}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className={labelCls}>{t.sound}</span>
          <select className={inputCls} value={form.sound} onChange={(e) => set("sound")(e.target.value)}>
            {SOUND.map((s) => <option key={s.value} value={s.value} className="bg-page">{lang === "en" ? s.en : s.value}</option>)}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className={labelCls}>{t.message}</span>
          <textarea rows={4} className={`${inputCls} resize-y`} value={form.message} onChange={(e) => set("message")(e.target.value)} placeholder={t.messagePh} />
        </label>
      </div>

      {state === "error" && <p role="alert" className="mt-4 text-sm font-semibold text-vinyl-deep">{msg}</p>}

      <button
        type="submit"
        disabled={state === "busy"}
        className="sticker sticker-hover mt-6 flex w-full items-center justify-center gap-2 bg-vinyl px-5 py-3.5 font-bold text-ink disabled:opacity-60"
      >
        {state === "busy" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {t.submit}
      </button>
    </form>
  );
}
