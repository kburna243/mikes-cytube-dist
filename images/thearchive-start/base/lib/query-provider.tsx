"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { IS_NATIVE } from "./platform";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: IS_NATIVE ? 5 * 60_000 : 30_000,
            retry: IS_NATIVE ? 0 : 1,
            refetchOnWindowFocus: false,
            networkMode: IS_NATIVE ? "offlineFirst" : "online",
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
