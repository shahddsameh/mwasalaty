import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

const operatorSrcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icons/*.png", "favicon.ico"],
      manifest: {
        name: "Mwasalaty Operator",
        short_name: "Operator",
        dir: "rtl",
        lang: "ar",
        display: "standalone",
        background_color: "#f8fafc",
        theme_color: "#0f172a",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,svg,png}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(operatorSrcDir),
    },
  },
  server: {
    port: 5174,
    allowedHosts: [
      ".ngrok-free.app",
      ".ngrok-free.dev",
      ".ngrok.app",
      ".ngrok.io",
    ],
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
