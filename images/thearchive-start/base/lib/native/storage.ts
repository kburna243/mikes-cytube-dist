import { IS_NATIVE } from "../platform";

export async function getPreference(key: string): Promise<string | null> {
  if (!IS_NATIVE) return localStorage.getItem(key);

  try {
    const { Preferences } = await import("@capacitor/preferences");
    const result = await Preferences.get({ key });
    return result.value || null;
  } catch {
    return null;
  }
}

export async function setPreference(key: string, value: string): Promise<void> {
  if (!IS_NATIVE) {
    localStorage.setItem(key, value);
    return;
  }

  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key, value });
  } catch {
    // Silently fail — non-critical preferences
  }
}

export async function removePreference(key: string): Promise<void> {
  if (!IS_NATIVE) {
    localStorage.removeItem(key);
    return;
  }

  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key });
  } catch {
    // Silently fail
  }
}
