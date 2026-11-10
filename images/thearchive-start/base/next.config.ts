import type { NextConfig } from "next";

const isMobile = process.env.BUILD_TARGET === "mobile";
// Subfolder-Hosting (Tailscale-Funnel): NAS-Web-Build setzt NEXT_PUBLIC_BASE_PATH=/dubs/vintage,
// Next prefixt Assets/_next/Routing automatisch. Mobile/Local bleiben am Root ("").
const basePath = (!isMobile && process.env.NEXT_PUBLIC_BASE_PATH) || "";

const nextConfig: NextConfig = {
  output: isMobile ? "export" : "standalone",
  images: {
    unoptimized: isMobile,
  },
  // trailingSlash und basePath vertragen sich nicht: mit beiden liefert
  // `/<basePath>/` eine 200 mit leerem Body, waehrend alle anderen Routen
  // normal rendern. Deshalb nur am Root einschalten.
  trailingSlash: !basePath,
  // Eigenes Ausgabeverzeichnis pro Zweck. Ohne das schreibt ein Verifikations-
  // Build in dasselbe `.next`, in dem ein laufender `next dev` arbeitet — der
  // Dev-Cache bricht dann mit "Could not find the module ... in the React
  // Client Manifest" / "__webpack_modules__[moduleId] is not a function".
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
