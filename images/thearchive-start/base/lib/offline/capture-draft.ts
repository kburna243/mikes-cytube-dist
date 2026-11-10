"use client";

export interface CaptureDraft {
  archiveId: string;
  category: string;
  barcode: string;
  photos: { file: File; label: string; viewType: string }[];
  itemId?: number;
  uploaded: number;
  identificationStartedAt?: number;
  completionNotified?: boolean;
}

function openCaptureStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("the-archive-capture", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function captureDraft(
  owner: string,
  draft?: CaptureDraft | null,
  newOnly = false,
): Promise<CaptureDraft | undefined> {
  const db = await openCaptureStore();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("drafts", draft === undefined ? "readonly" : "readwrite");
      const store = tx.objectStore("drafts");
      const request = draft === undefined
        ? store.get(owner)
        : draft === null ? store.delete(owner)
        : newOnly ? store.add(draft, owner) : store.put(draft, owner);
      tx.oncomplete = () => resolve(draft === undefined ? request.result : undefined);
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function captureOwner(token: string): string | null {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { sub, tenant_id } = JSON.parse(atob(payload));
    return sub && tenant_id != null ? `${tenant_id}:${sub}` : null;
  } catch {
    return null;
  }
}
