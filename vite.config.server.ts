import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist/server",
    emptyOutDir: false,
    ssr: "server/node-build.ts",
    rollupOptions: {
      input: "server/node-build.ts",
      output: {
        entryFileNames: "node-build.mjs",
        format: "es",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client"),
      "@shared": path.resolve(process.cwd(), "shared"),
    },
  },
});
