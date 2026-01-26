import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    build: {
      target: "es2022",
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
      strictPort: true,
      proxy: {
        "/api": {
          target: env.VITE_UPSTREAM || "http://localhost:3001",
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.error(
                `\x1b[31m[PROXY ERROR] Could not proxy to backend at ${env.VITE_UPSTREAM || "http://localhost:3001"}. Is the server running?\x1b[0m`,
              );
            });
          },
        },
      },
    },
    plugins: [react()],
    define: {
      // Mapping the browser-restricted key to the legacy env name for compatibility
      "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(
        env.VITE_GOOGLE_BROWSER_KEY || env.VITE_GOOGLE_MAPS_API_KEY,
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
