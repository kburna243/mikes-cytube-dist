import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { PRODUCTS } from "@/lib/data";

export const runtime = "nodejs";

type ClientLine = { id?: string; size?: string; qty?: number };

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as { email?: string; coupon?: string; items?: ClientLine[] };
    const email = (b.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ ok: false, message: "Ungültige E-Mail." }, { status: 400 });
    }
    const rawItems = Array.isArray(b.items) ? b.items : [];
    if (rawItems.length === 0) {
      return NextResponse.json({ ok: false, message: "Der Warenkorb ist leer." }, { status: 400 });
    }

    // server-side re-pricing, never trust client totals
    const lines = rawItems.map((l) => {
      const product = PRODUCTS.find((p) => p.id === l.id);
      if (!product) throw new Error("Unbekanntes Produkt");
      const qty = Math.max(1, Math.min(9, Math.floor(l.qty ?? 1)));
      const size = product.sizes ? (product.sizes.includes(l.size ?? "") ? (l.size as string) : "M") : "OS";
      return { id: product.id, name: product.name, size, qty, unit: product.price, line: product.price * qty };
    });

    const subtotal = lines.reduce((a, l) => a + l.line, 0);
    const coupon = (b.coupon ?? "").trim().toUpperCase();
    const discount = coupon === "NOIZY10" ? Math.round(subtotal * 10) / 100 : 0;
    const total = Math.round((subtotal - discount) * 100) / 100;
    const orderNo = `NOZ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0")}`;

    await db.insert(orders).values({
      orderNo,
      email,
      items: lines,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      coupon: coupon || null,
    });

    return NextResponse.json({ ok: true, orderNo, total });
  } catch (err) {
    console.error("order error", err);
    const msg = err instanceof Error && err.message === "Unbekanntes Produkt" ? "Unbekanntes Produkt im Korb." : "Bestellung fehlgeschlagen.";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
