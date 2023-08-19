// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";

const ROOT = "src";

export default defineConfig({
  root: resolve(__dirname, ROOT),
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, ROOT, "index.html"),
        example1: resolve(__dirname, ROOT, "example1/index.html"),
      },
    },
  },
});
