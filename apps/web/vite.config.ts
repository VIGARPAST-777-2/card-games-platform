import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-icon.svg'],
      manifest: {
        name: 'Deckora',
        short_name: 'Deckora',
        description: 'Juegos de cartas clásicos online',
        theme_color: '#0B1F3A',
        background_color: '#faf9f7',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/logo-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001' },
      '/socket.io': { target: 'http://localhost:3001', ws: true },
      '/health': { target: 'http://localhost:3001' },
    },
  },
});
