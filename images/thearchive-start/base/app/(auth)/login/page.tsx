"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

/**
 * Editoriales Zwei-Spalten-Layout statt zentriertem Kärtchen: links die
 * invertierte Manifest-Spalte, rechts der Zugang. DESIGN.md verlangt
 * Fixed-Grid-Editorial — eine schwebende Box mitten im Nichts ist das
 * Gegenteil davon.
 */
export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(username, email, password);
        router.push("/onboarding");
        return;
      }
      const destination = new URLSearchParams(window.location.search).get("redirect");
      const captureRoute = destination && /^\/identify\/?(?:\?shared=[a-f\d-]{36})?$/i.test(destination);
      router.push(captureRoute ? destination : "/dashboard");
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full bg-transparent border-none p-0 font-headline-sm text-primary placeholder:text-outline placeholder:font-body-md focus:outline-none focus:ring-0";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-12">
      {/* Manifest — invertierte Fläche, wie die Grid-Methodik-Karte im Styleguide */}
      <aside className="hidden flex-col justify-between bg-inverse-surface px-margin py-xl text-inverse-on-surface lg:col-span-5 lg:flex">
        <div>
          <p className="font-display-lg text-[28px] leading-none tracking-tighter">
            THE ARCHIVE
          </p>
          <p className="font-label-caps mt-xs opacity-50">Vol. 2024.01</p>
        </div>

        <div className="max-w-[28rem]">
          <span className="font-label-caps mb-sm block text-secondary-fixed-dim">
            The Archival Mission
          </span>
          <p className="font-display-lg leading-none">
            Built by a collector. Preserved by AI.
          </p>
          <div className="my-md h-px w-full bg-inverse-on-surface/20" />
          <p className="font-body-lg opacity-70">
            A permanent record of garment history, provenance and archival
            value. Every entry adds a layer of truth to the shared logbook of
            material culture.
          </p>
        </div>

        <p className="font-data-mono uppercase opacity-40">
          Est. 2024 — A Living Archive
        </p>
      </aside>

      {/* Zugang */}
      <main className="flex items-center px-margin py-xl lg:col-span-7">
        <div className="mx-auto w-full max-w-[28rem]">
          <p className="font-display-lg text-[28px] leading-none tracking-tighter text-primary lg:hidden">
            THE ARCHIVE
          </p>

          <span className="eyebrow block mt-lg lg:mt-0">
            {mode === "login" ? "Curator Access" : "New Repository"}
          </span>
          <h1 className="font-display-lg mt-xs text-primary">
            {mode === "login" ? "Enter the vault." : "Open your archive."}
          </h1>
          <div className="technical-line my-lg" />

          <form onSubmit={handleSubmit} className="space-y-lg">
            {mode === "register" && (
              <div className="field-rule">
                <label
                  htmlFor="username"
                  className="font-label-caps block text-on-surface-variant opacity-60"
                >
                  Curator Name
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={fieldClass}
                  placeholder="collector"
                />
              </div>
            )}

            <div className="field-rule">
              <label
                htmlFor="email"
                className="font-label-caps block text-on-surface-variant opacity-60"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={fieldClass}
                placeholder="you@archive.com"
              />
            </div>

            <div className="field-rule">
              <label
                htmlFor="password"
                className="font-label-caps block text-on-surface-variant opacity-60"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={fieldClass}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="font-body-sm border-l-2 border-error py-xs pl-sm text-error"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="font-label-caps w-full bg-primary py-md text-on-primary transition-colors duration-300 hover:bg-secondary disabled:opacity-40"
            >
              {loading
                ? "Processing…"
                : mode === "login"
                  ? "Enter the Vault"
                  : "Create Archive"}
            </button>
          </form>

          <div className="technical-line my-lg" />

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
            className="font-data-mono text-on-surface-variant underline decoration-1 underline-offset-4 transition-colors hover:text-secondary"
          >
            {mode === "login"
              ? "New collector? Create account"
              : "Already have an archive? Sign in"}
          </button>
        </div>
      </main>
    </div>
  );
}
