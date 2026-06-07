import { defineConfig } from "vitest/config";
import path from "path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue() as never],
  test: { environment: "jsdom", globals: true, setupFiles: ["src/test/setup.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } }
});
