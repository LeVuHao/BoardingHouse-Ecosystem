import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("/node_modules/")) return undefined;
          if (id.includes("/leaflet/")) return "leaflet";
          if (id.includes("/react-leaflet/") || id.includes("/@react-leaflet/")) {
            return "react-leaflet";
          }
          if (id.includes("/recharts/") || id.includes("/d3-")) return "charts";
          if (id.includes("/framer-motion/")) return "motion";
          if (id.includes("/lucide-react/")) return "icons";
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/")
          ) {
            return "react-vendor";
          }
          return "vendor";
        },
      },
    },
  },
})
