"use client";

import { withBase } from "@/lib/base";
import { useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { useLang } from "@/lib/useLang";

const COPY = {
  de: {
    invalid: "Bitte eine gültige E-Mail-Adresse eintragen.",
    welcome: "Willkommen im Crate Club!",
    failed: "Etwas ist schiefgelaufen. Bitte später nochmal versuchen.",
    doneNote: "Die erste Ausgabe kommt mit dem nächsten Monatsanfang.",
    label: "E-Mail-Adresse",
    placeholder: "du@beispiel.de",
    submit: "Eintragen",
    help: "Kein Spam, Abmeldung jederzeit.",
  },
  en: {
    invalid: "Please enter a valid email address.",
    welcome: "Welcome to the Crate Club!",
    failed: "Something went wrong. Please try again later.",
    doneNote: "The first issue arrives at the start of next month.",
    label: "Email address",
    placeholder: "you@example.com",
    submit: "Sign up",
    help: "No spam, unsubscribe any time.",
  },
};

/** VIP Crate Club signup, persisted to Postgres. Styled as a mail-order card. */
export default function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const t = COPY[useLang()];
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setState("error");
      setMsg(t.invalid);
      return;
    }
    setState("busy");
    try {
      const res = await fetch(withBase("/api/newsletter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !json.ok) throw new Error(json.message ?? t.failed);
      setState("done");
      setMsg(t.welcome);
    } catch {
      setState("error");
      setMsg(t.failed);
    }
  }

  return (
    <div className={`cassette p-5 sm:p-6 ${compact ? "" : "max-w-xl"}`}>
      {state === "done" ? (
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 size-5 shrink-0 text-vinyl" />
          <p className="text-fg">{msg} {t.doneNote}</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-2">
          <label htmlFor="crate-email" className="text-sm font-semibold text-fg">{t.label}</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="crate-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
              placeholder={t.placeholder}
              aria-invalid={state === "error"}
              aria-describedby="crate-help"
              className="min-w-0 flex-1 rounded-[3px] border-2 border-fg bg-page px-4 py-3 text-fg placeholder:text-fg-muted/70 focus:border-vinyl focus:outline-none"
            />
            <button
              type="submit"
              disabled={state === "busy"}
              className="sticker sticker-hover flex items-center justify-center gap-2 bg-fg px-6 py-3 font-bold whitespace-nowrap text-page disabled:opacity-60"
            >
              {state === "busy" && <Loader2 className="size-4 animate-spin" />}
              {t.submit}
            </button>
          </div>
          {state === "error" ? (
            <p id="crate-help" role="alert" className="text-sm font-semibold text-vinyl-deep">{msg}</p>
          ) : (
            <p id="crate-help" className="text-sm text-fg-muted">{t.help}</p>
          )}
        </form>
      )}
    </div>
  );
}
