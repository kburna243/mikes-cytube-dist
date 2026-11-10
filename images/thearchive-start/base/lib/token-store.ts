import { IS_NATIVE } from "./platform";

// Lazy-load native secure storage only when running natively
async function nativeStore() {
  const { SecureStoragePlugin } =
    await import("capacitor-secure-storage-plugin");
  return SecureStoragePlugin;
}

export async function getToken(key: string): Promise<string | null> {
  if (IS_NATIVE) {
    try {
      const store = await nativeStore();
      const result = await store.get({ key });
      return result.value || null;
    } catch {
      return null;
    }
  }
  return localStorage.getItem(key);
}

export async function setToken(key: string, value: string): Promise<void> {
  if (IS_NATIVE) {
    const store = await nativeStore();
    await store.set({ key, value });
    return;
  }
  localStorage.setItem(key, value);
}

export async function removeToken(key: string): Promise<void> {
  if (IS_NATIVE) {
    const store = await nativeStore();
    await store.remove({ key });
    return;
  }
  localStorage.removeItem(key);
}
