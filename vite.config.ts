import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_PUBLIC_BACKEND_URL || "http://localhost:2000";
  const prefix = env.VITE_PUBLIC_BACKEND_PREFIX || "api";
  const version = env.VITE_PUBLIC_BACKEND_VERSION || "v1";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        [`/${prefix}/${version}`]: {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
