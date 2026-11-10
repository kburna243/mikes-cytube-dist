import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/collection",
  "/identify",
  "/settings",
  "/items",
  "/onboarding",
];
const PUBLIC_PATHS = ["/", "/login", "/verify-email"];

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Strip basePath for path matching if pathname starts with basePath
  const cleanPathname = basePath && pathname.startsWith(basePath)
    ? pathname.substring(basePath.length) || "/"
    : pathname;

  const isProtected = PROTECTED_PATHS.some(
    (p) => cleanPathname === p || cleanPathname.startsWith(`${p}/`),
  );

  if (isProtected && !token) {
    const loginUrl = new URL(`${basePath}/login`, request.url);
    loginUrl.searchParams.set("redirect", cleanPathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (
    token &&
    (cleanPathname === "/login" || cleanPathname === "/verify-email")
  ) {
    return NextResponse.redirect(new URL(`${basePath}/dashboard`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|api|favicon.ico|uploads).*)"],
};
