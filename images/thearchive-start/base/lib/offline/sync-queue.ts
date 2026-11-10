import { IS_NATIVE } from "../platform";
import { getConnectionStatus, onNetworkChange } from "../native/network";
import type { ConnectionStatus } from "../native/network";

type SyncAction = {
  id: string;
  action: string;
  payload: unknown;
};

type SyncProcessor = (entry: SyncAction) => Promise<boolean>;

let isProcessing = false;
let unsubscribe: (() => void) | null = null;

/** Start the sync engine. Listens for connectivity and processes the queue. */
export function startSyncEngine(processEntry: SyncProcessor): () => void {
  if (!IS_NATIVE) return () => {};

  // Listen for network changes
  unsubscribe = onNetworkChange((status: ConnectionStatus) => {
    if (status === "online") {
      processSyncQueue(processEntry);
    }
  });

  // Initial check
  if (getConnectionStatus() === "online") {
    processSyncQueue(processEntry);
  }

  return () => {
    unsubscribe?.();
    unsubscribe = null;
  };
}

async function processSyncQueue(processEntry: SyncProcessor) {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const { getSyncQueue, removeFromSyncQueue } =
      await import("../native/database");
    let entries = await getSyncQueue();

    while (entries.length > 0) {
      for (const entry of entries) {
        const success = await processEntry({
          id: entry.id,
          action: entry.action,
          payload: JSON.parse(entry.payload),
        });

        if (success) {
          await removeFromSyncQueue(entry.id);
        }
      }

      entries = await getSyncQueue();
    }
  } catch {
    // Sync failed — will retry on next connectivity change
  } finally {
    isProcessing = false;
  }
}

/** Queue an action for later sync */
export async function queueSyncAction(
  action: string,
  payload: unknown,
): Promise<void> {
  if (!IS_NATIVE) return;

  try {
    const { addToSyncQueue } = await import("../native/database");
    await addToSyncQueue(action, payload);
  } catch {
    // Silently fail
  }
}
