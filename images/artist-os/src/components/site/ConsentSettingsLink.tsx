"use client";

import { useLang } from "@/lib/useLang";
import { openConsentSettings } from "./consent";

export default function ConsentSettingsLink({ className = "underline underline-offset-4 hover:text-vinyl" }: { className?: string }) {
  const lang = useLang();
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      {lang === "en" ? "Cookie settings" : "Cookie-Einstellungen"}
    </button>
  );
}
