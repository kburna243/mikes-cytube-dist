import { BUILD_TARGET } from "./platform";

const getApiBase = () => {
  // Explizites NEXT_PUBLIC_API_URL hat Vorrang — z.B. "/thearchive" (same-origin unter dem
  // Funnel-Subfolder). Sonst der host:8020-Fallback (Direkt-Deploy) bzw. localhost (dev/mobile).
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  if (
    typeof window !== "undefined" &&
    BUILD_TARGET !== "mobile" &&
    window.location.hostname !== "localhost"
  ) {
    return `${window.location.protocol}//${window.location.hostname}:8020`;
  }
  return "http://localhost:8020";
};

export const API_BASE = getApiBase();

/** True when building for mobile (Capacitor static export). */
export const IS_MOBILE_BUILD = BUILD_TARGET === "mobile";
