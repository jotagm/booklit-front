import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, ".", "");
    // URL do backend Spring Boot. Configure em .env (VITE_BACKEND_URL) se não for localhost:8080.
    var backendUrl = env.VITE_BACKEND_URL || "http://localhost:8080";
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
                    rewrite: function (path) { return path.replace(/^\/api/, ""); },
                },
            },
        },
    };
});
