"use client";

import { useEffect, type ReactNode } from "react";
import { initDatabase, closeDatabase } from "@/lib/native/database";

export function NativeInit({ children }: { children: ReactNode }) {
  useEffect(() => {
    initDatabase();
    return () => {
      closeDatabase();
    };
  }, []);

  return <>{children}</>;
}
