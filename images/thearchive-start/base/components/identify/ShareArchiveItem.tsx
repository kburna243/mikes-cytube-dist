"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IS_NATIVE } from "@/lib/platform";

export default function ShareArchiveItem({ title }: { title: string }) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [copyText, setCopyText] = useState("");

  async function share() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setStatus("");
    setCopyText("");

    // Capacitor loads a device-local URL. Share the title in that build.
    const url = IS_NATIVE ? undefined : window.location.href;
    const text = url ?? title;
    const data = url ? { title, url } : { title, text: title };

    try {
      if (navigator.share) {
        try {
          await navigator.share(data);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }

      try {
        await navigator.clipboard.writeText(text);
        setStatus(url ? "Link kopiert." : "Titel kopiert.");
      } catch {
        setCopyText(text);
        setStatus(url ? "Link zum Kopieren" : "Titel zum Kopieren");
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="secondary" onClick={share} disabled={busy}>Stück teilen</Button>
      <p role="status" className="text-sm text-on-surface-variant">{status}</p>
      {copyText && (
        <input
          aria-label={status}
          className="w-full border border-outline bg-surface p-2 text-sm"
          value={copyText}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
    </div>
  );
}
