import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  // URL do backend Spring Boot. Configure em .env (VITE_BACKEND_URL) se não for localhost:8080.
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:8080";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Em dev, o app chama "/api/..." e o Vite repassa para o backend,
        // evitando problemas de CORS sem precisar mexer no Spring Boot.
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
