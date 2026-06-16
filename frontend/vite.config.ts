import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

function figmaAssetResolver() {
  return {
    name: "figma-asset-resolver",
    resolveId(id: string) {
      if (id.startsWith("figma:asset/")) {
        const filename = id.replace("figma:asset/", "");
        return path.resolve(__dirname, "src/assets", filename);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/mwasalaty-darklogo2.png"],
      manifest: {
        id: "/mwasalaty-pwa-v2",
        name: "Mwasalaty",
        short_name: "Mwasalaty",
        description:
          "Plan multimodal routes in Greater Cairo with metro, bus, tickets, and saved trips.",
        theme_color: "#fdbb20",
        background_color: "#f8fafc",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/mwasalaty-darklogo2.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/mwasalaty-darklogo2.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/mwasalaty-darklogo2.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,ico,json,woff2}"],

        navigateFallback: "/index.html",

        navigateFallbackDenylist: [/^\/api\//],

        runtimeCaching: [
          {
            urlPattern: /\/api\/places\/search/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "mwasalaty-place-search",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z0-9.]*google\.com\/vt\//,
            handler: "CacheFirst",
            options: {
              cacheName: "mwasalaty-osm-tiles",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});