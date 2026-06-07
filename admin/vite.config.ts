import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    port: 5175,
    allowedHosts: [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app", ".ngrok.io"],
    proxy: { "/api": "http://localhost:3000" }
  }
});
