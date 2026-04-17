import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
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
