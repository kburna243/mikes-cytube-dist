"use client";

import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/query-provider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NativeInit } from "@/components/app/NativeInit";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useEffect, type ReactNode } from "react";
import { IS_MOBILE_BUILD } from "@/lib/config";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!IS_MOBILE_BUILD && "serviceWorker" in navigator) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
      void navigator.serviceWorker.register(`${basePath}/capture-worker.js`).catch(() => {});
    }
  }, []);
  return (
    <QueryProvider>
      <AuthProvider>
        <NativeInit>
          <ProtectedRoute>{children}</ProtectedRoute>
          <OfflineIndicator />
        </NativeInit>
      </AuthProvider>
    </QueryProvider>
  );
}
