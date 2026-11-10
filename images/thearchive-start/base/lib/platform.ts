/** True when running inside Capacitor (iOS/Android native app). */
export const IS_NATIVE =
  typeof window !== "undefined" &&
  !!(window as any).Capacitor?.isNativePlatform?.();

/** Current build target: "web" | "mobile" */
export const BUILD_TARGET: "web" | "mobile" =
  (process.env.NEXT_PUBLIC_BUILD_TARGET as "web" | "mobile") || "web";

/** Get the route path for an item detail page, platform-aware. */
export function itemPath(id: number | string): string {
  if (BUILD_TARGET === "mobile") {
    return `/item?id=${encodeURIComponent(id)}`;
  }
  return `/items/${id}`;
}

export const FALLBACK_IMAGES: Record<string, string> = {
  "NK-1994-001": "https://lh3.googleusercontent.com/aida-public/AB6AXuCe1R8XL7-qUgyijrOh2FFFBObI_TCrx94YB58d2s4RwpEDb6WhZRte2QfbRVRFMPnn-F3S46qwH88DHUPE8HHdmNWndqmOpCBkz_hXs4Or6ihjB8kLaXZT04ZUB39IGVfoajNkOvWqSMVQw3yiBarwEcKf50S9eKu1SkM6uTJhPePBS6P0MSXFEQDio8tl6gxkjjlMeWQZux6lJ1HFECMuTgpmJLSopYVvV1QPwsgC6_chdpj91DHcMh1CpG9b3FLh45cp26G-nyyu",
  "CH-DET-082": "https://lh3.googleusercontent.com/aida-public/AB6AXuDyybdtoOCaxDvD8tW4sJxjBc1Zo-YFbRtT_SLLYA7g2kVuXtrRbXxFzZP36-w-iEpcmfwHN1xFqHZz59b6hqc3mm5b46_A6skFj8oe_1KfM-oRkF-xL6NKJyzrkOTWX62hkwDasevtFYmvzkkzjvANsc_0Pz3AuHWWfcY-m1IjpeehvxUKyICGGA-L3w0TFoPgX17G9jJG-SZrYJyPdJxvPVLs1JnfruGJgIQahgE0gxgZsuqLJxejn1rTUiFya1uGRW0gZgMKguTW",
  "LV-501-1966": "https://lh3.googleusercontent.com/aida-public/AB6AXuAAKm2Z73R3Q_rrLL-vXhcMuMCi0QxOODoo9Wh0RcTPdfDOnYMhtJNB_Kk9pEuvxUDRZEE4oHOEU9GpEt96mtnDBYaiDSh7s5yqqvrZHqolzEFVqvlkL3VLJMu8Y1PD7TYNnCxkCsH6zKs4xpNnKLENH_0klh7dczPTG45DxfpYYuOb1XhO4MEz5N_Bk3R4cINTChzZWWmHOgUGN6KP2orval4q1cygPDHyls3_37SJXpPJYszja_K3mODSieZMeJx0E1u2DKCVUbdx",
  "SL-BKR-012": "https://lh3.googleusercontent.com/aida-public/AB6AXuAHag-sIhrGEK1PIv2GtzHeiVcsp6HCWL1JNUKPVqoHm-U1TNNH47eDNJDOlOJJ_iBD0PKaGGbvWg4pF60x2OMVddRqlDtkMUcLe5ECwF73fjauVMVu4QvicJ5QN1CIyouZhqgyZgfs3-9BUilZNFmPpck5mwBZ8Kw-hsiDAhpycg3USSvNMQiDlNG0KzG4j3LohYzxKR5WN3gJ4_jq2savEMqNHDZtSzijSFOfYAzeZ9V027pdh0WKiSpcrgiTTFj4tOQCUXOgxhhG",
  "LEV-1984-XJ": "https://lh3.googleusercontent.com/aida-public/AB6AXuDnE4gQ67Bf1KS5tZeDUFr5XPGo3Nb1pYhuFqB9tVBrE3PLNv6P4LzZe-QLteyX2jxwalBpXrIlQl74nXk9njB0eJ6q6gFxvgA99C31ZfqHCHLhZQ5nezQH1mBoOHt6tJMiuiQQzU290O5Sq7jJlyA3nQj4KtwpuMteBbMJd0lYTOpHhunVs5NA32fy-uM3T_SpHB-5D7QXNklsujVH5g-22c6Dnm41NrIviuk37GCThjc1WPhLfdcCg0u6uSE1b8b49R9YUix0-JpC"
};

export const FALLBACK_GALLERY: Record<string, string[]> = {
  "LEV-1984-XJ": [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDnE4gQ67Bf1KS5tZeDUFr5XPGo3Nb1pYhuFqB9tVBrE3PLNv6P4LzZe-QLteyX2jxwalBpXrIlQl74nXk9njB0eJ6q6gFxvgA99C31ZfqHCHLhZQ5nezQH1mBoOHt6tJMiuiQQzU290O5Sq7jJlyA3nQj4KtwpuMteBbMJd0lYTOpHhunVs5NA32fy-uM3T_SpHB-5D7QXNklsujVH5g-22c6Dnm41NrIviuk37GCThjc1WPhLfdcCg0u6uSE1b8b49R9YUix0-JpC",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB43TpVaKjqfBSAjEavNYlgDmTunyAU8rzv1q_Xg3brWxvacwjAVC5H0J6JOzvfWHV_rf6fn7Qe8h_m04EcNqUfWvBmx9ZQ9F79XKmqCUgNkrK3a1nLgrJl9p_VI9xoO1keOjb_H9S6Mlw0sfz8FauaTrJ_ANHc6_juu3lCdpDYad0SE49KCpyP6hW9QRWxvrCM9G5Qzmbu4Kbg0lPUU8OOtpZh-X1O5Jz17IrebwqCSVitdMz9DuqG4RZe8I8xrQvsibuUHS4h31Pj",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDPnxFDCzxgHEpTEOKWk4Sb97hMbuzVbdHyd3i3bBRztH5osc2XhWtLnN-0e8IihZu9jvkj5QafXdtEk-BffzrcifgQffr_F3NuZksB45YBzxCRBdftcqfYDyplYsjQuyQz-GGapL-CmZ2dyw4ofOj1MkP6-6a7WnCo1AlCbatt-8-rAvh5nHKpBx8WeI1Kr-Z_Sdura2rcDTipY-Kig36U6oZneTC7WwM8vk_3Ty3L1eKKCEqF8sB8IBRIhwTjIG15bYJc8uNmwCzE"
  ],
  "LV-501-1966": [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAAKm2Z73R3Q_rrLL-vXhcMuMCi0QxOODoo9Wh0RcTPdfDOnYMhtJNB_Kk9pEuvxUDRZEE4oHOEU9GpEt96mtnDBYaiDSh7s5yqqvrZHqolzEFVqvlkL3VLJMu8Y1PD7TYNnCxkCsH6zKs4xpNnKLENH_0klh7dczPTG45DxfpYYuOb1XhO4MEz5N_Bk3R4cINTChzZWWmHOgUGN6KP2orval4q1cygPDHyls3_37SJXpPJYszja_K3mODSieZMeJx0E1u2DKCVUbdx"
  ]
};
