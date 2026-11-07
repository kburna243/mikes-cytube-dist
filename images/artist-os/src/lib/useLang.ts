"use client";

import { usePathname } from "next/navigation";
import { langFromPath, type Lang } from "@/lib/i18n";

/** Language of the current page, derived from the /en prefix (basePath is already stripped). */
export function useLang(): Lang {
  return langFromPath(usePathname() ?? "/");
}
