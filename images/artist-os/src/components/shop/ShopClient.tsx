"use client";

import { withBase } from "@/lib/base";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShoppingCart, Plus, Minus, Trash2, X, Tag, CreditCard, Check, Loader2,
  Package, Truck, BadgeCheck,
} from "lucide-react";
import { PRODUCTS, UI_ASSETS, fmtEUR as fmtEURde, productDesc, type Product } from "@/lib/data";
import { useLang } from "@/lib/useLang";

const T = {
  "de": {
    "errEmail": "Bitte eine gültige E-Mail angeben.",
    "failed": "Bestellung fehlgeschlagen",
    "size": "Größe",
    "less": "Weniger",
    "more": "Mehr",
    "add": "In den Korb",
    "ship": "Versand aus Berlin",
    "shipD": "DE €4.90 · EU €8.90 · ab €80 frei",
    "pack": "Karton & Kraftpapier",
    "packD": "Plastikfrei verpackt, Sticker beigelegt",
    "small": "Kleine Auflagen",
    "smallD": "Jeder Drop nummeriert & limitiert",
    "openCart": "Warenkorb öffnen",
    "cart": "Korb",
    "inCart": "im Korb!",
    "cartAria": "Warenkorb",
    "your": "Dein",
    "close": "Schließen",
    "empty": "Die Kiste ist noch leer.",
    "qtyDown": "Menge verringern",
    "qtyUp": "Menge erhöhen",
    "remove": "Entfernen",
    "coupon": "Gutscheincode (NOIZY10)",
    "subtotal": "Zwischensumme",
    "discount": "Rabatt",
    "checkout": "Zur Kasse",
    "thanks": "Danke, Neighbor!",
    "inSystem": "Die Bestellung ist im System. Bestätigung geht an",
    "shipNote": "Versand aus Friedrichshain in 2-4 Tagen · Sticker liegt bei",
    "browse": "Weiter stöbern",
    "incl": " (inkl. NOIZY10)",
    "mailLabel": "E-Mail für Bestätigung & Download-Codes",
    "mailPh": "deine@mail.de",
    "buy": "Jetzt kaufen,",
    "demo": "Demo-Checkout, es wird nichts abgebucht, aber alles sauber gespeichert."
  },
  "en": {
    "errEmail": "Please enter a valid email address.",
    "failed": "Order failed",
    "size": "Size",
    "less": "Less",
    "more": "More",
    "add": "Add to bag",
    "ship": "Shipping from Berlin",
    "shipD": "DE €4.90 · EU €8.90 · free over €80",
    "pack": "Cardboard & kraft paper",
    "packD": "Plastic-free packaging, sticker included",
    "small": "Small runs",
    "smallD": "Every drop numbered & limited",
    "openCart": "Open bag",
    "cart": "Bag",
    "inCart": "added to your bag!",
    "cartAria": "Shopping bag",
    "your": "Your",
    "close": "Close",
    "empty": "The crate is still empty.",
    "qtyDown": "Decrease quantity",
    "qtyUp": "Increase quantity",
    "remove": "Remove",
    "coupon": "Coupon code (NOIZY10)",
    "subtotal": "Subtotal",
    "discount": "Discount",
    "checkout": "Checkout",
    "thanks": "Thanks, neighbor!",
    "inSystem": "Your order is in. Confirmation goes to",
    "shipNote": "Ships from Friedrichshain in 2-4 days · sticker included",
    "browse": "Keep browsing",
    "incl": " (incl. NOIZY10)",
    "mailLabel": "Email for confirmation & download codes",
    "mailPh": "you@example.com",
    "buy": "Buy now,",
    "demo": "Demo checkout: nothing is charged, but everything is saved properly."
  }
} as const;


type CartLine = { id: string; size: string; qty: number };

const CART_KEY = "noizy-cart-v1";
const COUPON = "NOIZY10";

function linePrice(l: CartLine): number {
  const p = PRODUCTS.find((x) => x.id === l.id);
  return (p?.price ?? 0) * l.qty;
}

export default function ShopClient() {
  const lang = useLang();
  const __t = T[lang];
  const fmtEUR = (n: number, l = lang) => fmtEURde(n, l);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  // checkout state
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderNo, setOrderNo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setCart(JSON.parse(raw) as CartLine[]);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ }
  }, [cart]);

  const count = useMemo(() => cart.reduce((a, l) => a + l.qty, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((a, l) => a + linePrice(l), 0), [cart]);
  const discount = coupon.trim().toUpperCase() === COUPON ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  const add = useCallback((p: Product) => {
    const size = p.sizes ? sizes[p.id] ?? "M" : "OS";
    const qty = qtys[p.id] ?? 1;
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.id === p.id && l.size === size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Math.min(9, next[idx].qty + qty) };
        return next;
      }
      return [...prev, { id: p.id, size, qty }];
    });
    setToast(p.name);
    window.setTimeout(() => setToast(null), 2200);
  }, [sizes, qtys]);

  const setLineQty = (line: CartLine, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => !(l.id === line.id && l.size === line.size))
        : prev.map((l) => (l.id === line.id && l.size === line.size ? { ...l, qty: Math.min(9, qty) } : l))
    );
  };

  async function checkout() {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError(__t.errEmail);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(withBase("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, coupon: coupon || undefined, items: cart }),
      });
      const json = (await res.json()) as { ok: boolean; orderNo?: string; message?: string };
      if (!res.ok || !json.ok || !json.orderNo) throw new Error(__t.failed);
      setOrderNo(json.orderNo);
      setCart([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : __t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* product grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p, i) => (
          <article
            key={p.id}
            className="sticker sticker-hover group relative flex flex-col bg-surface p-5"
            style={{ transform: `rotate(${i % 2 ? 0.4 : -0.4}deg)` }}
          >
            {p.badge && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={UI_ASSETS.badges[p.badge]} alt="" className="absolute -right-2 -top-2 z-10 h-8 rotate-6 drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)]" />
            )}
            <div className="grid aspect-[4/3.4] place-items-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_35%,#f1e0c0,#d8c39c)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.img}
                alt={p.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
            </div>

            <div className="mt-4 flex-1">
              <p className="font-mono text-[9px] tracking-[0.25em] text-sunburst uppercase">{p.tag}</p>
              <h3 className="mt-1 font-display text-xl font-black leading-tight">{p.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-fg-muted">{productDesc(p, lang)}</p>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-lg font-bold text-sunburst">{fmtEUR(p.price)}</span>
              {p.compareAt && <span className="font-mono text-xs text-fg-muted/60 line-through">{fmtEUR(p.compareAt)}</span>}
            </div>

            {p.sizes && (
              <div className="mt-3 flex gap-1.5" role="radiogroup" aria-label={__t.size}>
                {p.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSizes((prev) => ({ ...prev, [p.id]: s }))}
                    className={`min-w-9 rounded-md border-2 border-fg/60 px-2 py-1 font-mono text-[11px] font-bold transition ${
                      (sizes[p.id] ?? "M") === s ? "bg-sunburst text-ink shadow-[2px_2px_0_rgba(0,0,0,0.85)]" : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center rounded-lg border-2 border-surface-2 bg-black/50">
                <button onClick={() => setQtys((q) => ({ ...q, [p.id]: Math.max(1, (q[p.id] ?? 1) - 1) }))} className="px-2.5 py-2 text-fg-muted hover:text-sunburst" aria-label={__t.less}>
                  <Minus className="size-3.5" />
                </button>
                <span className="w-6 text-center font-mono text-xs font-bold">{qtys[p.id] ?? 1}</span>
                <button onClick={() => setQtys((q) => ({ ...q, [p.id]: Math.min(9, (q[p.id] ?? 1) + 1) }))} className="px-2.5 py-2 text-fg-muted hover:text-sunburst" aria-label={__t.more}>
                  <Plus className="size-3.5" />
                </button>
              </div>
              <button
                onClick={() => add(p)}
                className="sticker-sm flex flex-1 items-center justify-center gap-2 bg-vinyl px-4 py-2.5 font-mono text-[11px] font-bold tracking-widest text-ink uppercase transition hover:bg-sunburst hover:text-ink active:translate-y-0.5"
              >
                <ShoppingCart className="size-4" /> {__t.add}
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* perks row */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Truck, t: __t.ship, d: __t.shipD },
          { icon: Package, t: __t.pack, d: __t.packD },
          { icon: BadgeCheck, t: __t.small, d: __t.smallD },
        ].map((perk) => (
          <div key={perk.t} className="flex items-center gap-3 rounded-xl border-2 border-surface-2 bg-surface px-4 py-3">
            <perk.icon className="size-5 shrink-0 text-sunburst" />
            <div>
              <p className="text-sm font-bold">{perk.t}</p>
              <p className="font-mono text-[10px] text-fg-muted">{perk.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* floating cart button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="sticker fixed bottom-24 right-4 z-[82] flex items-center gap-2.5 bg-sunburst px-4 py-3 font-mono text-xs font-bold tracking-widest text-ink uppercase transition hover:bg-paper active:translate-y-0.5 sm:right-6"
        aria-label={__t.openCart}
      >
        <ShoppingCart className="size-5" />
        {__t.cart}
        <span className="grid size-6 place-items-center rounded-full bg-page font-mono text-[11px] font-bold text-sunburst">{count}</span>
      </button>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 z-[82] flex max-w-xs items-center gap-2 rounded-xl border-2 border-fg bg-olive px-4 py-3 font-mono text-[11px] font-bold tracking-wider text-paper shadow-[5px_5px_0_rgba(0,0,0,0.85)] sm:left-6">
          <Check className="size-4 shrink-0 text-sunburst" /> {toast}, {__t.inCart}
        </div>
      )}

      {/* cart drawer */}
      <div
        className={`fixed inset-0 z-[94] bg-black/70 transition-opacity ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden
      />
      <aside
        className={`fixed bottom-0 right-0 top-0 z-[95] flex w-full max-w-md flex-col border-l-[3px] border-fg bg-surface shadow-[-10px_0_40px_rgba(0,0,0,0.7)] transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label={__t.cartAria}
      >
        <div className="flex items-center justify-between border-b-2 border-surface-2 px-5 py-4">
          <p className="font-display text-2xl font-black">
            {__t.your} <span className="text-vinyl">{__t.cart}</span>
          </p>
          <button onClick={() => setDrawerOpen(false)} aria-label={__t.close} className="sticker-sm grid size-9 place-items-center bg-page text-fg hover:text-sunburst">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="mt-16 text-center">
              <p className="mt-4 font-mono text-xs tracking-widest text-fg-muted uppercase">{__t.empty}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map((l) => {
                const p = PRODUCTS.find((x) => x.id === l.id)!;
                return (
                  <li key={`${l.id}-${l.size}`} className="flex items-center gap-3 rounded-xl border-2 border-surface-2 bg-black/40 p-3">
                    <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-gradient-to-b from-[#efe0c6] to-[#d8c39c]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.img} alt="" className="size-full rounded-lg object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{p.name}</p>
                      <p className="font-mono text-[10px] text-fg-muted">
                        {l.size !== "OS" && <>{__t.size} {l.size} · </>}{fmtEUR(p.price)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <button onClick={() => setLineQty(l, l.qty - 1)} className="rounded border border-fg/40 p-1 text-fg-muted hover:text-sunburst" aria-label={__t.qtyDown}>
                          <Minus className="size-3" />
                        </button>
                        <span className="w-5 text-center font-mono text-xs font-bold">{l.qty}</span>
                        <button onClick={() => setLineQty(l, l.qty + 1)} className="rounded border border-fg/40 p-1 text-fg-muted hover:text-sunburst" aria-label={__t.qtyUp}>
                          <Plus className="size-3" />
                        </button>
                        <button onClick={() => setLineQty(l, 0)} className="ml-auto rounded p-1 text-fg-muted hover:text-[#ff7a5c]" aria-label={__t.remove}>
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-sunburst">{fmtEUR(linePrice(l))}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t-2 border-surface-2 px-5 py-4 pb-8">
            <div className="flex items-center gap-2">
              <Tag className="size-4 text-sunburst" />
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder={__t.coupon}
                className="min-w-0 flex-1 rounded-lg border-2 border-fg/60 bg-black/60 px-3 py-2 font-mono text-xs uppercase tracking-widest text-fg placeholder:text-fg-muted/40 focus:border-sunburst focus:outline-none"
              />
            </div>
            <div className="mt-3 space-y-1 font-mono text-xs">
              <div className="flex justify-between text-fg-muted"><span>{__t.subtotal}</span><span>{fmtEUR(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-sunburst"><span>{__t.discount} ({COUPON})</span><span>−{fmtEUR(discount)}</span></div>}
              <div className="flex justify-between border-t border-surface-2 pt-2 text-sm font-bold text-fg"><span>Total</span><span>{fmtEUR(total)}</span></div>
            </div>
            <button
              onClick={() => { setDrawerOpen(false); setCheckoutOpen(true); }}
              className="sticker-sm mt-4 flex w-full items-center justify-center gap-2 bg-vinyl px-5 py-3.5 font-mono text-xs font-bold tracking-widest text-ink uppercase transition hover:bg-sunburst hover:text-ink active:translate-y-0.5"
            >
              <CreditCard className="size-4" /> {__t.checkout}
            </button>
          </div>
        )}
      </aside>

      {/* checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Checkout">
          <div className="sticker w-full max-w-lg bg-surface p-6 sm:p-8">
            {orderNo ? (
              <div className="py-4 text-center">
                <span className="sticker-sm inline-grid size-16 rotate-[-4deg] place-items-center bg-olive text-paper">
                  <Check className="size-8" />
                </span>
                <h3 className="mt-5 font-display text-3xl font-black">{__t.thanks}</h3>
                <p className="mt-2 text-sm text-fg-muted">{__t.inSystem} {email}.</p>
                <p className="lcd mx-auto mt-4 w-fit rounded-md px-4 py-2 font-mono text-sm tracking-[0.3em]">{orderNo}</p>
                <p className="mt-4 font-mono text-[10px] tracking-wider text-fg-muted/70 uppercase">{__t.shipNote}</p>
                <button
                  onClick={() => { setCheckoutOpen(false); setOrderNo(null); }}
                  className="sticker-sm mt-6 bg-sunburst px-6 py-3 font-mono text-xs font-bold tracking-widest text-ink uppercase"
                >
                  {__t.browse}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-black">Checkout <span className="font-mono text-xs font-normal tracking-widest text-sunburst">SIMULATION</span></h3>
                  <button onClick={() => setCheckoutOpen(false)} aria-label={__t.close} className="sticker-sm grid size-9 place-items-center bg-page text-fg hover:text-sunburst">
                    <X className="size-4" />
                  </button>
                </div>

                <ul className="mt-4 max-h-40 space-y-1.5 overflow-y-auto font-mono text-xs text-fg-muted">
                  {cart.map((l) => {
                    const p = PRODUCTS.find((x) => x.id === l.id)!;
                    return (
                      <li key={`${l.id}-${l.size}`} className="flex justify-between gap-3">
                        <span className="truncate">{l.qty}× {p.name}{l.size !== "OS" ? ` (${l.size})` : ""}</span>
                        <span className="shrink-0 text-sunburst">{fmtEUR(linePrice(l))}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex justify-between border-t-2 border-surface-2 pt-3 font-mono text-sm font-bold">
                  <span>Total{discount > 0 ? __t.incl : ""}</span>
                  <span className="text-sunburst">{fmtEUR(total)}</span>
                </div>

                <label className="mt-5 block">
                  <span className="font-mono text-[10px] font-bold tracking-[0.25em] text-fg-muted uppercase">{__t.mailLabel}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={__t.mailPh}
                    className="mt-1.5 w-full rounded-lg border-2 border-fg/70 bg-black/60 px-4 py-3 font-mono text-sm text-fg placeholder:text-fg-muted/40 focus:border-sunburst focus:outline-none"
                  />
                </label>

                {error && <p className="mt-2 font-mono text-xs text-[#ff7a5c]">{error}</p>}

                <button
                  onClick={checkout}
                  disabled={busy || cart.length === 0}
                  className="sticker-sm mt-5 flex w-full items-center justify-center gap-2 bg-vinyl px-5 py-3.5 font-mono text-xs font-bold tracking-widest text-ink uppercase transition hover:bg-sunburst hover:text-ink active:translate-y-0.5 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                  {__t.buy} {fmtEUR(total)}
                </button>
                <p className="mt-3 text-center font-mono text-[9px] tracking-wider text-fg-muted/60 uppercase">
                  {__t.demo}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
