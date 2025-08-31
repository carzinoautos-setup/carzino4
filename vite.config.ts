import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer as createExpressApp } from "./server/index";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "express-dev-server",
      configureServer(vite) {
        const app = createExpressApp();
        vite.middlewares.use(app);
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client"),
      "@shared": path.resolve(process.cwd(), "shared"),
    },
  },
});
