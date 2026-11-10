import { QueryClient } from "@tanstack/react-query";
import { IS_NATIVE } from "../platform";

/** Async storage interface compatible with TanStack Query Persister */
interface AsyncStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

function createPlatformStorage(): AsyncStorage {
  if (IS_NATIVE) {
    return {
      getItem: async (key) => {
        try {
          const { getCachedData } = await import("../native/database");
          const result = await getCachedData<string>(key);
          return result ?? null;
        } catch {
          return null;
        }
      },
      setItem: async (key, value) => {
        try {
          const { cacheData } = await import("../native/database");
          await cacheData(key, value);
        } catch {
          // Silently fail
        }
      },
      removeItem: async (key) => {
        // No-op — cache entries are overwritten, not removed individually
        void key;
      },
    };
  }

  // Web fallback: use localStorage
  return {
    getItem: async (key) => localStorage.getItem(key),
    setItem: async (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // localStorage full — ignore
      }
    },
    removeItem: async (key) => localStorage.removeItem(key),
  };
}

/** Create a QueryClient with offline persistence support */
export function createOfflineQueryClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000, // 5 min — longer for offline
        retry: IS_NATIVE ? 0 : 1, // Don't retry on mobile (network may be gone)
        refetchOnWindowFocus: false,
        networkMode: IS_NATIVE ? "offlineFirst" : "online",
      },
    },
  });

  // Persist setup — lazy, only on native
  if (IS_NATIVE) {
    const storage = createPlatformStorage();
    void storage; // Reserved for future createSyncStoragePersister integration
  }

  return client;
}
