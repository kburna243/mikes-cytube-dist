"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { API_BASE } from "../config";
import { getToken } from "../token-store";
const MAX_POLL_COUNT = 90;
const DEFAULT_INTERVAL_MS = 2000;

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const token = await getToken("access_token");
  const res = await fetch(`${API_BASE}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

interface IdentifyResponse {
  status: string;
}

/**
 * Polls GET /api/items/{id} until the classification_status is no longer "draft"
 * or the maximum number of attempts is reached.
 */
async function pollUntilResolved(
  itemId: number,
  intervalMs: number,
  signal: AbortSignal,
): Promise<unknown> {
  let attempts = 0;

  while (attempts < MAX_POLL_COUNT) {
    if (signal.aborted) {
      throw new Error("Polling aborted");
    }

    const item = await fetchJSON(`/api/items/${itemId}`, { signal });

    // If the server returned a classification_status that is final, we are done
    if (
      item &&
      typeof item === "object" &&
      "classification_status" in item &&
      (item as Record<string, unknown>).classification_status !== "draft"
    ) {
      return item;
    }

    attempts++;

    // Wait for the next interval
    if (signal.aborted) throw new Error("Polling aborted");
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, intervalMs);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new Error("Polling aborted"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  throw new Error(
    `Identification timed out after ${MAX_POLL_COUNT * (intervalMs / 1000)}s`,
  );
}

export interface UseIdentifyReturn {
  startIdentification: (itemId: number) => Promise<void>;
  pollItem: (itemId: number, intervalMs?: number) => Promise<unknown>;
  isIdentifying: boolean;
  error: string | null;
}

export function useIdentify(): UseIdentifyReturn {
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const startIdentification = useCallback(
    async (itemId: number): Promise<void> => {
      setIsIdentifying(true);
      setError(null);

      // Abort any previous polling
      if (abortRef.current) {
        abortRef.current.abort();
      }

      try {
        await fetchJSON<IdentifyResponse>(`/api/items/${itemId}/identify`, {
          method: "POST",
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to start identification";
        setError(message);
        setIsIdentifying(false);
        throw err;
      }
    },
    [],
  );

  const pollItem = useCallback(
    async (
      itemId: number,
      intervalMs = DEFAULT_INTERVAL_MS,
    ): Promise<unknown> => {
      setIsIdentifying(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result = await pollUntilResolved(
          itemId,
          intervalMs,
          controller.signal,
        );
        setIsIdentifying(false);
        abortRef.current = null;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Polling failed";
        // Do not override error with "aborted" when we intentionally cancel
        if (message !== "Polling aborted") {
          setError(message);
        }
        setIsIdentifying(false);
        abortRef.current = null;
        throw err;
      }
    },
    [],
  );

  return { startIdentification, pollItem, isIdentifying, error };
}
