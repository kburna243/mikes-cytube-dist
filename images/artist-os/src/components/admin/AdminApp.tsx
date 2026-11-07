"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ClipboardCopy, ExternalLink, LogOut, Pause, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { withBase } from "@/lib/base";
import type { gems, tourDates } from "@/db/schema";
import { ALL_FIELDS, SECTIONS, isDone, type CheckAnswer, type CheckField, type CheckStatus } from "@/lib/contentCheck";

/**
 * /admin: Martin maintains Diggin' Gems and tour dates himself, phone-first.
 * Every API call returns the fresh list, so the UI never has to merge state.
 */
type GemRow = typeof gems.$inferSelect;
type DateRow = typeof tourDates.$inferSelect;

async function api<T = { rows: never[] }>(path: string, method = "GET", body?: unknown): Promise<T> {
  const init: RequestInit = { method };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  const res = await fetch(withBase(path), init);
  const json = await res.json().catch(() => ({ ok: false, message: `Fehler ${res.status}` }));
  if (!json.ok) throw new Error(json.message ?? "Fehler");
  return json as T;
}

const input = "w-full border-2 border-fg bg-page px-3 py-2 text-base focus:border-vinyl focus:outline-none";
const primary = "sticker sticker-hover inline-flex items-center gap-2 bg-vinyl px-5 py-2.5 font-bold text-ink disabled:opacity-50";
const ghost = "inline-flex items-center gap-1.5 border-2 border-fg px-3 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-30";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-xs uppercase text-fg-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-fg-muted">{hint}</span>}
    </label>
  );
}

function ErrorLine({ msg }: { msg: string }) {
  return msg ? <p role="alert" className="border-2 border-vinyl bg-vinyl/10 px-3 py-2 font-semibold">{msg}</p> : null;
}

const TAB_LABEL = { gems: "Diggin' Gems", dates: "Termine", check: "Inhalte prüfen" };

/* ------------------------------------------------------------------ */
export default function AdminApp({ authed: initial }: { authed: boolean }) {
  const [authed, setAuthed] = useState(initial);
  const [tab, setTab] = useState<"gems" | "dates" | "check">("gems");

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  const logout = async () => {
    await api("/api/admin/login", "DELETE");
    setAuthed(false);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-fg pb-4">
        <h1 className="type-condensed text-5xl">Noizy Admin</h1>
        <div className="flex gap-2">
          <a href={withBase("/")} target="_blank" rel="noopener" className={ghost}>
            Seite <ExternalLink className="size-4" />
          </a>
          <button onClick={logout} className={ghost}>
            Abmelden <LogOut className="size-4" />
          </button>
        </div>
      </header>
      <nav className="my-6 flex flex-wrap gap-2" aria-label="Bereiche">
        {(["gems", "dates", "check"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k} className={`border-2 border-fg px-4 py-2 font-bold ${tab === k ? "bg-fg text-page" : ""}`}>
            {TAB_LABEL[k]}
          </button>
        ))}
        <Link href="/admin/werkstatt" className="border-2 border-fg bg-vinyl px-4 py-2 font-bold text-ink">
          Marken-Werkstatt
        </Link>
        <Link href="/admin/schleuder" className="border-2 border-fg bg-vinyl px-4 py-2 font-bold text-ink">
          Content-Schleuder
        </Link>
      </nav>
      {tab === "gems" ? <GemsPanel /> : tab === "dates" ? <DatesPanel /> : <CheckPanel onDates={() => setTab("dates")} />}
    </main>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/api/admin/login", "POST", { password });
      onDone();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto max-w-sm px-4 py-24">
      <h1 className="type-condensed text-6xl">Noizy Admin</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Passwort">
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} required autoFocus />
        </Field>
        <ErrorLine msg={err} />
        <button disabled={busy} className={primary}>{busy ? "Prüfe…" : "Anmelden"}</button>
      </form>
    </main>
  );
}

/* ---------------- gems ---------------- */
function GemsPanel() {
  const [rows, setRows] = useState<GemRow[] | null>(null);
  const [editing, setEditing] = useState<GemRow | "new" | null>(null);
  const [err, setErr] = useState("");

  const run = async (p: Promise<{ rows: GemRow[] }>) => {
    setErr("");
    try {
      setRows((await p).rows);
    } catch (x) {
      setErr((x as Error).message);
    }
  };
  useEffect(() => {
    api<{ rows: GemRow[] }>("/api/admin/gems").then((r) => setRows(r.rows), (x: Error) => setErr(x.message));
  }, []);

  if (editing) {
    return (
      <GemForm
        gem={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={(r) => {
          setRows(r);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-fg-muted">Die oberste Platte ist das Gem der Woche auf der Startseite. Neue Gems landen automatisch oben.</p>
        <button onClick={() => setEditing("new")} className={primary}>
          <Plus className="size-5" /> Neues Gem
        </button>
      </div>
      <ErrorLine msg={err} />
      {!rows && !err && <p className="text-fg-muted">Lädt…</p>}
      <ol className="space-y-3">
        {rows?.map((g, i) => (
          <li key={g.id} className={`flex gap-3 border-2 border-fg bg-page p-3 ${g.published ? "" : "opacity-60"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBase(g.img)} alt="" className="size-20 shrink-0 border-2 border-fg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs uppercase text-vinyl">
                {i === 0 && "Gem der Woche · "}
                {g.video ? "Video" : "Foto"}
                {!g.published && " · versteckt"}
              </p>
              <p className="truncate text-lg font-bold leading-tight">{g.title}</p>
              <p className="truncate text-sm text-fg-muted">{[g.artist, g.label].filter(Boolean).join(" · ")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => run(api("/api/admin/gems", "PUT", { id: g.id, move: -1 }))} disabled={i === 0} className={ghost} aria-label={`${g.title} nach oben`}>
                  <ArrowUp className="size-4" />
                </button>
                <button onClick={() => run(api("/api/admin/gems", "PUT", { id: g.id, move: 1 }))} disabled={i === rows.length - 1} className={ghost} aria-label={`${g.title} nach unten`}>
                  <ArrowDown className="size-4" />
                </button>
                <button onClick={() => setEditing(g)} className={ghost}>
                  <Pencil className="size-4" /> Bearbeiten
                </button>
                <button
                  onClick={() => confirm(`„${g.title}“ wirklich löschen?`) && run(api(`/api/admin/gems?id=${g.id}`, "DELETE"))}
                  className={ghost}
                  aria-label={`${g.title} löschen`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function GemForm({ gem, onCancel, onSaved }: { gem: GemRow | null; onCancel: () => void; onSaved: (rows: GemRow[]) => void }) {
  const [f, setF] = useState({
    title: gem?.title ?? "", artist: gem?.artist ?? "", label: gem?.label ?? "", country: gem?.country ?? "",
    badge: gem?.badge ?? "", badgeEn: gem?.badgeEn ?? "", story: gem?.story ?? "", storyEn: gem?.storyEn ?? "",
    own: gem?.own ?? false, published: gem?.published ?? true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState(0);
  const [length, setLength] = useState(30);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const isVideo = file?.type.startsWith("video/");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    let img = gem?.img ?? "";
    let video = gem?.video ?? "";
    try {
      if (file) {
        setBusy(isVideo ? "Video wird geschnitten und komprimiert…" : "Foto wird hochgeladen…");
        const fd = new FormData();
        fd.append("file", file);
        fd.append("start", String(start));
        fd.append("length", String(length));
        // ponytail: a failed save after a successful upload leaves an orphan file, sweep UPLOAD_DIR if it ever matters
        const up = await api<{ img: string; video?: string }>("/api/admin/upload", "POST", fd);
        img = up.img;
        video = up.video ?? "";
      }
      if (!img) throw new Error("Bitte ein Foto oder Video auswählen.");
      setBusy("Speichere…");
      const body = { ...f, img, video, id: gem?.id };
      const res = await api<{ rows: GemRow[] }>("/api/admin/gems", gem ? "PUT" : "POST", body);
      onSaved(res.rows);
    } catch (x) {
      setErr((x as Error).message);
      setBusy("");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-2xl font-bold">{gem ? "Gem bearbeiten" : "Neues Gem"}</h2>

      <div className="space-y-3 border-2 border-fg bg-surface p-4">
        {gem && !file && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={withBase(gem.img)} alt="" className="size-32 border-2 border-fg object-cover" />
        )}
        <Field label={gem ? "Foto oder Video ersetzen" : "Foto oder Video"} hint="Direkt aus WhatsApp geht. Videos werden automatisch gekürzt und verkleinert.">
          <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-base" />
        </Field>
        {isVideo && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start (Sekunde)">
              <input type="number" min={0} value={start} onChange={(e) => setStart(Number(e.target.value))} className={input} />
            </Field>
            <Field label="Länge (Sekunden)" hint="Fremde Platten max. 30 s">
              <input type="number" min={5} max={120} value={length} onChange={(e) => setLength(Number(e.target.value))} className={input} />
            </Field>
          </div>
        )}
      </div>

      <Field label="Titel *">
        <input value={f.title} onChange={set("title")} className={input} required maxLength={200} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Artist">
          <input value={f.artist} onChange={set("artist")} className={input} maxLength={200} />
        </Field>
        <Field label="Label / Katalognr.">
          <input value={f.label} onChange={set("label")} className={input} maxLength={160} />
        </Field>
        <Field label="Land">
          <input value={f.country} onChange={set("country")} className={input} maxLength={60} placeholder="Japan" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Badge" hint="Kurz: „Nicht im Netz“, „Discogs: 1.337 €“">
          <input value={f.badge} onChange={set("badge")} className={input} maxLength={60} />
        </Field>
        <Field label="Badge englisch" hint="Leer = deutscher Text">
          <input value={f.badgeEn} onChange={set("badgeEn")} className={input} maxLength={60} />
        </Field>
      </div>
      <Field label="Story" hint="Zwei, drei Sätze. Warum ist die Platte besonders?">
        <textarea value={f.story} onChange={set("story")} className={input} rows={4} maxLength={2000} />
      </Field>
      <Field label="Story englisch" hint="Leer = deutscher Text">
        <textarea value={f.storyEn} onChange={set("storyEn")} className={input} rows={3} maxLength={2000} />
      </Field>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={f.own} onChange={(e) => setF({ ...f, own: e.target.checked })} className="size-5 accent-vinyl" />
          Eigene Musik / Studio
        </label>
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} className="size-5 accent-vinyl" />
          Auf der Seite zeigen
        </label>
      </div>

      <ErrorLine msg={err} />
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={!!busy} className={primary}>{busy || "Speichern"}</button>
        <button type="button" onClick={onCancel} disabled={!!busy} className={ghost}>Abbrechen</button>
      </div>
    </form>
  );
}

/* ---------------- tour dates ---------------- */
const STATUS_LABEL: Record<string, string> = { TICKETS: "Tickets", CONFIRMED: "Bestätigt", "SOLD OUT": "Ausverkauft" };
const EMPTY_DATE = { date: "", city: "", venue: "", country: "DE", status: "TICKETS", note: "", noteEn: "" };

function DatesPanel() {
  const [rows, setRows] = useState<DateRow[] | null>(null);
  const [editing, setEditing] = useState<DateRow | "new" | null>(null);
  const [err, setErr] = useState("");

  const run = async (p: Promise<{ rows: DateRow[] }>) => {
    setErr("");
    try {
      setRows((await p).rows);
      return true;
    } catch (x) {
      setErr((x as Error).message);
      return false;
    }
  };
  useEffect(() => {
    api<{ rows: DateRow[] }>("/api/admin/dates").then((r) => setRows(r.rows), (x: Error) => setErr(x.message));
  }, []);

  if (editing) {
    const d = editing === "new" ? null : editing;
    return (
      <DateForm
        initial={d ? { date: d.date, city: d.city, venue: d.venue, country: d.country, status: d.status, note: d.note, noteEn: d.noteEn } : EMPTY_DATE}
        title={d ? "Termin bearbeiten" : "Neuer Termin"}
        onCancel={() => setEditing(null)}
        onSave={async (f) => {
          await api<{ rows: DateRow[] }>("/api/admin/dates", d ? "PUT" : "POST", { ...f, id: d?.id }).then((r) => setRows(r.rows));
          setEditing(null);
        }}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing("new")} className={primary}>
          <Plus className="size-5" /> Neuer Termin
        </button>
      </div>
      <ErrorLine msg={err} />
      {!rows && !err && <p className="text-fg-muted">Lädt…</p>}
      <ul className="divide-y-2 divide-fg/20 border-y-2 border-fg">
        {rows?.map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm">{d.date.split("-").reverse().join(".")} · {STATUS_LABEL[d.status] ?? d.status}</p>
              <p className="truncate font-bold">{d.venue}, {d.city}</p>
              {d.note && <p className="truncate text-sm text-fg-muted">{d.note}</p>}
            </div>
            <button onClick={() => setEditing(d)} className={ghost} aria-label={`${d.venue} bearbeiten`}>
              <Pencil className="size-4" />
            </button>
            <button onClick={() => confirm(`Termin ${d.venue} löschen?`) && run(api(`/api/admin/dates?id=${d.id}`, "DELETE"))} className={ghost} aria-label={`${d.venue} löschen`}>
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DateForm({ initial, title, onCancel, onSave }: { initial: typeof EMPTY_DATE; title: string; onCancel: () => void; onSave: (f: typeof EMPTY_DATE) => Promise<void> }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await onSave(f);
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Datum *">
          <input type="date" value={f.date} onChange={set("date")} className={input} required />
        </Field>
        <Field label="Status">
          <select value={f.status} onChange={set("status")} className={input}>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Location *">
          <input value={f.venue} onChange={set("venue")} className={input} required maxLength={160} />
        </Field>
        <Field label="Stadt *">
          <input value={f.city} onChange={set("city")} className={input} required maxLength={120} />
        </Field>
      </div>
      <Field label="Land (Kürzel)">
        <input value={f.country} onChange={set("country")} className={`${input} max-w-[8rem]`} maxLength={8} />
      </Field>
      <Field label="Notiz" hint="z. B. „Vinyl-only All Night Set“">
        <input value={f.note} onChange={set("note")} className={input} maxLength={200} />
      </Field>
      <Field label="Notiz englisch" hint="Leer = deutscher Text">
        <input value={f.noteEn} onChange={set("noteEn")} className={input} maxLength={200} />
      </Field>
      <ErrorLine msg={err} />
      <div className="flex gap-3">
        <button disabled={busy} className={primary}>{busy ? "Speichere…" : "Speichern"}</button>
        <button type="button" onClick={onCancel} className={ghost}>Abbrechen</button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Inhalte prüfen: CONTENT-VORLAGE.md step by step. Every click saves one field. */

type Answers = Record<string, CheckAnswer>;
const STATUS_TAG: Record<CheckStatus, string> = { ok: "Stimmt", new: "Neu", later: "Später" };

function CheckPanel({ onDates }: { onDates: () => void }) {
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<{ answers: Answers }>("/api/admin/content-check").then((r) => setAnswers(r.answers), (x: Error) => setErr(x.message));
  }, []);

  const save = async (id: string, status: CheckStatus, value: string) => {
    setErr("");
    try {
      setAnswers((await api<{ answers: Answers }>("/api/admin/content-check", "PUT", { id, status, value })).answers);
    } catch (x) {
      setErr((x as Error).message);
      throw x;
    }
  };
  const go = (i: number) => {
    setStep(i);
    window.scrollTo({ top: 0 });
  };

  if (!answers) return err ? <ErrorLine msg={err} /> : <p className="text-fg-muted">Lädt …</p>;

  const done = ALL_FIELDS.filter((f) => isDone(answers[f.id])).length;
  const openRequired = ALL_FIELDS.filter((f) => f.required && !isDone(answers[f.id]));
  const section = SECTIONS[step];
  const summary = step === SECTIONS.length;

  const copyAll = async () => {
    const res = await fetch(withBase("/api/admin/content-check?format=md"));
    await navigator.clipboard.writeText(await res.text());
    setCopied(true);
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="font-mono text-xs uppercase text-fg-muted">
          {done} von {ALL_FIELDS.length} erledigt{openRequired.length ? ` · ${openRequired.length} Pflichtfelder offen` : " · alle Pflichtfelder erledigt"}
        </p>
        <div className="mt-2 h-3 border-2 border-fg" role="progressbar" aria-label="Fortschritt" aria-valuemin={0} aria-valuemax={ALL_FIELDS.length} aria-valuenow={done}>
          <div className="h-full bg-vinyl" style={{ width: `${(done / ALL_FIELDS.length) * 100}%` }} />
        </div>
      </div>

      <nav aria-label="Schritte" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[...SECTIONS.map((s) => s.title), "Übersicht"].map((title, i) => {
          const fields = SECTIONS[i]?.fields ?? [];
          const n = fields.filter((f) => isDone(answers[f.id])).length;
          return (
            <button key={title} onClick={() => go(i)} aria-current={step === i ? "step" : undefined}
              className={`shrink-0 border-2 border-fg px-3 py-2 text-left text-sm font-semibold ${step === i ? "bg-fg text-page" : n === fields.length && fields.length ? "bg-surface" : ""}`}>
              <span className="block font-mono text-[10px] uppercase opacity-70">{i < SECTIONS.length ? `${String(i + 1).padStart(2, "0")} · ${n}/${fields.length}` : "Ende"}</span>
              {title}
            </button>
          );
        })}
      </nav>

      <ErrorLine msg={err} />

      {summary ? (
        <div className="space-y-4">
          <h2 className="type-condensed text-4xl">Übersicht</h2>
          {openRequired.length ? (
            <div className="border-2 border-fg p-4">
              <p className="font-bold">Diese Pflichtfelder fehlen noch:</p>
              <ul className="mt-2 space-y-1">
                {openRequired.map((f) => {
                  const i = SECTIONS.findIndex((s) => s.fields.includes(f));
                  return (
                    <li key={f.id}>
                      <button onClick={() => go(i)} className="text-left underline decoration-vinyl decoration-2 underline-offset-4">
                        {SECTIONS[i].title}: {f.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="border-2 border-fg bg-surface p-4 font-bold">Alle Pflichtfelder sind erledigt. Danke!</p>
          )}
          <p className="text-fg-muted">Deine Antworten sind gespeichert. Wir sehen sie hier und pflegen sie auf der Seite ein. Du kannst jederzeit zurück und etwas ändern.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={copyAll} className={primary}>
              {copied ? <Check className="size-5" /> : <ClipboardCopy className="size-5" />} {copied ? "Kopiert" : "Zusammenfassung kopieren"}
            </button>
            <a href={withBase("/api/admin/content-check?format=md")} download="noizy-inhalte.md" className={ghost}>Als Datei</a>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="font-mono text-xs uppercase text-vinyl-deep">Schritt {step + 1} von {SECTIONS.length}</p>
            <h2 className="type-condensed text-4xl">{section.title}</h2>
            <p className="mt-2 text-fg-muted">{section.intro}</p>
            {section.adminTab === "dates" && (
              <button onClick={onDates} className={`${ghost} mt-3`}>Zu den Terminen <ArrowRight className="size-4" /></button>
            )}
          </div>
          {section.fields.map((f) => (
            <CheckCard key={f.id} field={f} answer={answers[f.id]} onSave={(s, v) => save(f.id, s, v)} />
          ))}
        </div>
      )}

      <div className="flex justify-between gap-2 border-t-2 border-fg pt-4">
        <button onClick={() => go(step - 1)} disabled={step === 0} className={ghost}><ArrowLeft className="size-4" /> Zurück</button>
        {!summary && <button onClick={() => go(step + 1)} className={primary}>Weiter <ArrowRight className="size-5" /></button>}
      </div>
    </section>
  );
}

function CheckCard({ field: f, answer, onSave }: { field: CheckField; answer?: CheckAnswer; onSave: (status: CheckStatus, value: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const status = answer && (isDone(answer) || answer.status === "later") ? answer.status : null;
  const free = !f.current && f.kind !== "choice"; // nothing to confirm: write directly
  const chosen = (o: string) => answer?.status === "new" && answer.value === o;

  const run = async (s: CheckStatus, v: string) => {
    setBusy(true);
    try {
      await onSave(s, v);
      setEditing(false);
    } catch {
      /* the panel shows the error line */
    } finally {
      setBusy(false);
    }
  };
  const startEdit = () => {
    setDraft(answer?.status === "new" ? answer.value : f.current ?? "");
    setEditing(true);
  };

  return (
    <article className={`border-2 border-fg p-4 ${status === "ok" || status === "new" ? "bg-surface" : "bg-page"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-bold">{f.label}</h3>
        <div className="flex gap-1.5">
          {f.required && <span className="border-2 border-vinyl px-1.5 font-mono text-[11px] uppercase text-vinyl-deep">Pflicht</span>}
          {status && <span className="border-2 border-fg bg-fg px-1.5 font-mono text-[11px] uppercase text-page">{STATUS_TAG[status]}</span>}
        </div>
      </div>
      {f.hint && <p className="mt-1 text-sm text-fg-muted">{f.hint}</p>}
      {f.current && (
        <blockquote className="mt-3 border-l-4 border-vinyl pl-3">
          <span className="block font-mono text-[11px] uppercase text-fg-muted">Auf der Seite</span>
          {f.current}
        </blockquote>
      )}
      {answer?.status === "new" && answer.value.trim() && f.kind !== "choice" && !editing && (
        <p className="mt-3 border-l-4 border-fg pl-3">
          <span className="block font-mono text-[11px] uppercase text-fg-muted">Dein neuer Text</span>
          {answer.value}
        </p>
      )}

      <div className="mt-3">
        {f.kind === "choice" ? (
          <div className="flex flex-wrap gap-2">
            {f.options!.map((o) => (
              <button key={o} onClick={() => run("new", o)} disabled={busy} aria-pressed={chosen(o)}
                className={`border-2 border-fg px-3 py-2 font-semibold ${chosen(o) ? "bg-fg text-page" : "hover:bg-surface"}`}>
                {o}
              </button>
            ))}
            <button onClick={() => run("later", "")} disabled={busy} className={ghost}><Pause className="size-4" /> Später</button>
          </div>
        ) : editing || (free && answer?.status !== "new") ? (
          <div className="space-y-2">
            {f.kind === "textarea" ? (
              <textarea value={editing ? draft : ""} onFocus={() => !editing && startEdit()} onChange={(e) => { setEditing(true); setDraft(e.target.value); }} rows={4} className={input} aria-label={f.label} />
            ) : (
              <input value={editing ? draft : ""} onFocus={() => !editing && startEdit()} onChange={(e) => { setEditing(true); setDraft(e.target.value); }} className={input} aria-label={f.label} />
            )}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => run("new", draft)} disabled={busy || !editing || !draft.trim()} className={primary}><Check className="size-5" /> Speichern</button>
              {free ? (
                <button onClick={() => run("later", "")} disabled={busy} className={ghost}><Pause className="size-4" /> Später</button>
              ) : (
                <button onClick={() => setEditing(false)} className={ghost}>Abbrechen</button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {f.current && (
              <button onClick={() => run("ok", "")} disabled={busy} aria-pressed={status === "ok"} className={status === "ok" ? `${ghost} bg-fg text-page` : ghost}>
                <Check className="size-4" /> Stimmt so
              </button>
            )}
            <button onClick={startEdit} disabled={busy} className={ghost}><Pencil className="size-4" /> {free ? "Bearbeiten" : "Ändern"}</button>
            <button onClick={() => run("later", "")} disabled={busy} className={ghost}><Pause className="size-4" /> Später</button>
          </div>
        )}
      </div>
    </article>
  );
}
