"use client";

import { useEffect, useState } from "react";
import { getConnectionStatus, onNetworkChange } from "@/lib/native/network";
import type { ConnectionStatus } from "@/lib/native/network";

export function OfflineIndicator() {
  const [status, setStatus] = useState<ConnectionStatus>(getConnectionStatus());

  useEffect(() => {
    return onNetworkChange(setStatus);
  }, []);

  if (status === "online" || status === "unknown") return null;

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-inverse-surface text-inverse-on-surface font-label-caps text-center py-2 px-margin">
      OFFLINE — Changes will sync when reconnected
    </div>
  );
}
