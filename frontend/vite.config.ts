import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// The SPA talks to two services directly with credentialed requests:
//   - Express API (:3000): identity, auth, users, notifications, reports
//   - Laravel API (:8000): appointments, resources, check-ins, records
// A dev proxy is intentionally NOT used so the cookie/CORS behaviour that
// runs in production is exercised during development.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 8080,
    strictPort: true,
    // Preview serves the production bundle and proxies both APIs so the app
    // can be shared through a single tunnel/origin. Cookies and CSRF then work
    // exactly as they do on localhost, without cross-site cookie rules.
    host: true,
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/express": {
        target: "http://127.0.0.1:3000",
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/express/, ""),
      },
      "/laravel": {
        target: "http://127.0.0.1:8000",
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/laravel/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
