import type { MetadataRoute } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: `${basePath}/`,
    name: "The Archive",
    short_name: "The Archive",
    lang: "de",
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: "standalone",
    theme_color: "#fbf9f4",
    background_color: "#fbf9f4",
    icons: [
      { src: `${basePath}/brand/archive-mark-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${basePath}/brand/archive-mark-512.png`, sizes: "512x512", type: "image/png" },
    ],
    shortcuts: [{ name: "Stück aufnehmen", url: `${basePath}/identify/` }],
    share_target: {
      action: `${basePath}/identify/share-inbox`,
      method: "POST",
      enctype: "multipart/form-data",
      params: { files: [{ name: "photos", accept: ["image/jpeg", "image/png", "image/webp"] }] },
    },
  };
}
