import type { NextConfig } from "next";

// Set NEXT_PUBLIC_BASE_PATH=/noizy at build time to serve the app under a sub-path (Caddy on servermitte).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  basePath,
  output: "standalone",
  // Public brand assets may be drawn into <canvas> by external tools (brand kit / Marken-Werkstatt previews).
  async headers() {
    return [{ source: "/assets/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] }];
  },
};

export default nextConfig;
