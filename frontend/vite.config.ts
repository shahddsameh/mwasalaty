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
      includeAssets: ["icons/mwasalaty-app-icon.png"],
      manifest: {
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
            src: "/icons/mwasalaty-app-icon.png",
            sizes: "934x934",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/mwasalaty-app-icon.png",
            sizes: "934x934",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // App shell precache: JS, CSS, HTML, icons, SVG, webp, woff2, etc.
        globPatterns: ["**/*.{js,css,html,svg,png,webp,ico,json,woff2}"],

        // Vue Router offline support: serve the SPA shell for navigations so
        // the app and its IndexedDB-backed offline features boot offline.
        navigateFallback: "/index.html",

        // Never serve the SPA shell for API calls.
        navigateFallbackDenylist: [/^\/api\//],

        runtimeCaching: [
          {
            // Place autocomplete: fast cached results, refreshed in background.
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
            // Map tiles. CacheFirst so the map renders offline once tiles are seen.
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

          // NOTE: /api/plan is intentionally NOT cached here.
          // It is a POST request and should not be treated as a confirmed/bookable route.
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
