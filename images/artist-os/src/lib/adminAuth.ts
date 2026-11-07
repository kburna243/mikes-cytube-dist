import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { BASE_PATH } from "@/lib/base";

/**
 * Single-user admin: one password from ADMIN_PASSWORD (min. 8 chars, unset = admin off).
 * The session cookie is `<expiry>.<hmac>`, keyed by the password, so changing it logs everyone out.
 * ponytail: one shared login, per-user accounts if more people ever maintain the site.
 */
const COOKIE = "noizy_admin";
const TTL_MS = 30 * 24 * 3600 * 1000;

const sha = (s: string) => createHash("sha256").update(s).digest();

function secret(): Buffer | null {
  const p = process.env.ADMIN_PASSWORD ?? "";
  return p.length >= 8 ? sha(`noizy-admin:${p}`) : null;
}

export const adminEnabled = () => secret() !== null;

export function checkPassword(input: string): boolean {
  const p = process.env.ADMIN_PASSWORD ?? "";
  return adminEnabled() && timingSafeEqual(sha(input), sha(p));
}

const sign = (exp: string, key: Buffer) => createHmac("sha256", key).update(exp).digest("hex");

function validSession(value: string | undefined): boolean {
  const key = secret();
  if (!key || !value) return false;
  const [exp, mac] = value.split(".");
  if (!exp || !mac || Number(exp) < Date.now()) return false;
  const want = Buffer.from(sign(exp, key));
  const got = Buffer.from(mac);
  return want.length === got.length && timingSafeEqual(want, got);
}

export async function isAdmin(): Promise<boolean> {
  return validSession((await cookies()).get(COOKIE)?.value);
}

const cookieBase = { httpOnly: true, sameSite: "strict" as const, secure: process.env.NODE_ENV === "production", path: BASE_PATH || "/" };

export async function startSession() {
  const exp = String(Date.now() + TTL_MS);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp, secret()!)}`, { ...cookieBase, maxAge: TTL_MS / 1000 });
}

export async function endSession() {
  (await cookies()).set(COOKIE, "", { ...cookieBase, maxAge: 0 });
}
