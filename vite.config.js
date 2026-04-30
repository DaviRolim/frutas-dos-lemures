import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: "index.html"
      }
    }
  },
  publicDir: "public",
  server: {
    port: 4175,
    host: "127.0.0.1"
  },
  preview: {
    port: 4175,
    host: "127.0.0.1"
  }
});
