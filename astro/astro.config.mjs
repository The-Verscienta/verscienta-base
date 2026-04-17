import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";

// Local dev + default builds: use Node adapter
// CI/CD Cloudflare builds: set ASTRO_ADAPTER=cloudflare
let adapter = node({ mode: "standalone" });

if (process.env.ASTRO_ADAPTER === "cloudflare") {
  const cloudflare = (await import("@astrojs/cloudflare")).default;
  adapter = cloudflare({ platformProxy: { enabled: true } });
}

export default defineConfig({
  output: "server",
  adapter,
  integrations: [react()],
  vite: {
    css: {
      postcss: "./postcss.config.js",
    },
  },
  image: {
    remotePatterns: [
      { protocol: "https", hostname: "**.verscienta.com" },
      { protocol: "https", hostname: "imagedelivery.net" },
    ],
  },
  security: {
    checkOrigin: true,
  },
});
