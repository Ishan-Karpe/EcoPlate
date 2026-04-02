import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["@react-email/render"],
    },
  },
  plugins: [
    tailwindcss(),
    sveltekit(),
    ...SvelteKitPWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      registerType: "autoUpdate",
      includeAssets: ["pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "EcoPlate",
        short_name: "EcoPlate",
        description: "Campus food rescue - save meals, save money",
        theme_color: "#006838",
        background_color: "#F9F6F1",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      injectManifest: {
        globPatterns: ["client/**/*.{js,css,ico,png,svg,webp,webmanifest}"],
        globIgnores: ["server/**", "client/service-worker.js", "prerendered/**"],
      },
    }),
  ],
});
