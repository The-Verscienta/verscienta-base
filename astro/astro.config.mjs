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
  experimental: {
    csp: {
      algorithm: "SHA-256",
      scriptDirective: {
        hashes: [],
        resources: [
          "'self'",
          "https://challenges.cloudflare.com",
          "https://static.cloudflareinsights.com",
        ],
      },
      styleDirective: {
        hashes: [],
        resources: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      },
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' https://fonts.gstatic.com",
        `connect-src 'self' ${process.env.PUBLIC_DIRECTUS_URL || ""} ${process.env.PUBLIC_MEILI_URL || ""} https://challenges.cloudflare.com https://cloudflareinsights.com`,
        "frame-src https://challenges.cloudflare.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
});
