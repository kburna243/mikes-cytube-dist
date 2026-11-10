"use client";

import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const PUBLIC_PATHS = ["/", "/login", "/verify-email", "/community"];

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { accessToken, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  useEffect(() => {
    if (!isLoading && !accessToken && !isPublic) {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname + window.location.search)}`;
      router.replace(loginUrl);
    }
  }, [isLoading, accessToken, isPublic, pathname, router]);

  // Allow public paths and loading state through
  if (isPublic || isLoading) {
    return <>{children}</>;
  }

  // No token yet, show nothing (redirect pending via useEffect)
  if (!accessToken) {
    return null;
  }

  return <>{children}</>;
}
