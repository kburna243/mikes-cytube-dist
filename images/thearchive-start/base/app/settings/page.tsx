"use client";

import { useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { useBilling, useCheckout, useDowngrade } from "@/lib/hooks/useBilling";
import type { PlanInfo } from "@/lib/api";

const planOrder = ["free", "pro", "business"];

/** Kleine Registerzeile: Etikett links, Wert rechts, dazwischen die Linie. */
function Record({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-md border-b border-outline-variant py-sm">
      <span className="font-label-caps text-on-surface-variant opacity-60">
        {label}
      </span>
      <span className="font-body-md text-right text-primary">{children}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { user, accessToken, logout } = useAuth();
  const { data: billing, isLoading, error } = useBilling(accessToken);
  const checkout = useCheckout(accessToken);
  const downgrade = useDowngrade(accessToken);
  const [confirmDowngrade, setConfirmDowngrade] = useState(false);

  const currentPlanIndex = planOrder.indexOf(billing?.plan || "free");
  const isDev = !billing?.stripe_publishable_key;

  return (
    <>
      <TopAppBar />
      <main className="shell mb-16 pb-xl pt-lg md:mb-0">
        <div className="mb-lg max-w-3xl">
          <span className="eyebrow block">Curator Settings</span>
          <h1 className="font-display-lg mt-xs text-primary">
            Account &amp; Subscription
          </h1>
        </div>
        <div className="technical-line mb-xl" />

        <div className="grid grid-cols-1 gap-xl lg:grid-cols-12">
          {/* Registerspalte */}
          <section className="lg:col-span-5">
            <p className="section-rule mb-md">01. The Record</p>
            <Record label="Curator">{user?.username}</Record>
            <Record label="Email">
              <span className="inline-flex items-center gap-xs">
                {user?.email}
                {user && !user.email_verified && (
                  <span className="font-label-caps bg-secondary px-xs py-[2px] text-[10px] text-on-secondary">
                    Unverified
                  </span>
                )}
              </span>
            </Record>
            <Record label="Display Name">
              {user?.display_name || user?.username}
            </Record>
            {billing?.plan_name && (
              <Record label="Tier">{billing.plan_name}</Record>
            )}

            <div className="mt-lg flex flex-wrap gap-md">
              <Button variant="secondary" onClick={logout}>
                Sign Out
              </Button>
              <Button variant="text" onClick={() => {}}>
                Edit Profile
              </Button>
            </div>

            <p className="section-rule mb-md mt-xl">03. Beta</p>
            <p className="font-body-md mb-md text-on-surface-variant">
              Du testest eine frühe Version von The Archive. Dein Feedback
              hilft, die Plattform zu schärfen.
            </p>
            <Button
              variant="stamp"
              href="mailto:beta@the-archive.app?subject=Beta%20Feedback%20The%20Archive"
            >
              Beta-Feedback geben
            </Button>
          </section>

          {/* Verbrauchsspalte */}
          <section className="lg:col-span-7">
            <p className="section-rule mb-md">02. Current Holding</p>

            {isLoading ? (
              <div className="animate-pulse space-y-sm">
                <div className="h-8 w-40 bg-surface-container-high" />
                <div className="h-4 w-64 bg-surface-container" />
              </div>
            ) : error ? (
              <p className="font-body-md border-l-2 border-error py-xs pl-sm text-error">
                Failed to load billing information.
              </p>
            ) : billing ? (
              <>
                <div className="mb-lg flex items-baseline gap-md">
                  <span className="font-display-sm text-primary">
                    {billing.plan_name}
                  </span>
                  <span className="font-label-caps text-secondary">
                    {billing.subscription_status === "active"
                      ? "Active"
                      : billing.subscription_status}
                  </span>
                </div>

                {/* Verbrauch als Balken auf der Grundlinie, ohne Rundung */}
                <div className="mb-lg space-y-md">
                  {(["items", "collections", "identify"] as const).map(
                    (key) => {
                      const { used, limit } = billing.usage[key];
                      const pct = limit
                        ? Math.min(100, (used / limit) * 100)
                        : used > 0
                          ? 25
                          : 0;
                      return (
                        <div key={key}>
                          <div className="mb-xs flex justify-between">
                            <span className="font-label-caps text-on-surface-variant opacity-60">
                              {key}
                            </span>
                            <span className="font-data-mono text-primary">
                              {used}
                              {limit !== null ? ` / ${limit}` : " / Unlimited"}
                            </span>
                          </div>
                          <div className="h-[6px] w-full bg-surface-container-high">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                {billing.plan !== "free" && (
                  <div className="border-t border-outline-variant pt-md">
                    {!confirmDowngrade ? (
                      <button
                        className="font-label-caps text-error underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70"
                        onClick={() => setConfirmDowngrade(true)}
                      >
                        Downgrade to Free
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-md">
                        <span className="font-body-sm text-error">
                          Are you sure? Quotas will be reduced.
                        </span>
                        <Button
                          variant="secondary"
                          onClick={() => downgrade.mutate()}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => setConfirmDowngrade(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {isDev && (
                  <p className="font-data-mono mt-md uppercase text-on-surface-variant opacity-60">
                    Dev mode — Stripe not configured, plan changes apply
                    instantly.
                  </p>
                )}
              </>
            ) : null}

            {/* Tarife als tonale Karten, invertiert wenn aktiv */}
            <p className="section-rule mb-md mt-xl">Available Tiers</p>
            <div className="grid grid-cols-1 gap-md md:grid-cols-3">
              {billing?.plans.map((plan: PlanInfo) => {
                const planIdx = planOrder.indexOf(plan.id);
                const isCurrent = plan.id === billing.plan;
                const isUpgrade = planIdx > currentPlanIndex;
                const price =
                  plan.price_monthly === 0
                    ? "Free"
                    : `€${plan.price_monthly}/mo`;

                return (
                  <div
                    key={plan.id}
                    className={`flex flex-col border p-md ${
                      isCurrent
                        ? "border-primary bg-inverse-surface text-inverse-on-surface"
                        : "archive-card"
                    }`}
                  >
                    <p
                      className={`font-label-caps ${
                        isCurrent ? "opacity-60" : "text-secondary"
                      }`}
                    >
                      {plan.name}
                    </p>
                    <p className="font-headline-md mt-xs">{price}</p>

                    <ul className="mb-lg mt-md flex-1 space-y-xs">
                      {plan.features.map((f: string) => (
                        <li
                          key={f}
                          className={`font-body-sm flex items-start gap-xs ${
                            isCurrent ? "opacity-80" : "text-on-surface-variant"
                          }`}
                        >
                          <span aria-hidden="true">—</span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <span className="font-label-caps border border-inverse-on-surface/30 py-sm text-center opacity-70">
                        Current Tier
                      </span>
                    ) : isUpgrade ? (
                      <Button
                        variant="primary"
                        disabled={checkout.isPending}
                        onClick={() => checkout.mutate(plan.id)}
                      >
                        {checkout.isPending ? "Loading…" : `Upgrade`}
                      </Button>
                    ) : (
                      <span className="font-label-caps py-sm text-center text-on-surface-variant opacity-40">
                        Lower Tier
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <BottomNavBar />
      <Footer />
    </>
  );
}
