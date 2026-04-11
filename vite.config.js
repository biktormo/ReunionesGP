import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo192.png'],
      manifest: {
        short_name: "PinedoApp",
        name: "Programa de Asignaciones - General Pinedo",
        description: "Gestión de asignaciones para la congregación",
        icons: [
          {
            src: "logo192.png",
            type: "image/png",
            sizes: "192x192"
          },
          {
            src: "logo512.png",
            type: "image/png",
            sizes: "512x512"
          }
        ],
        start_url: "/",
        display: "standalone",
        theme_color: "#0f172a",
        background_color: "#ffffff"
      }
    })
  ],
});