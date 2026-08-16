// v2
// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // we control the update prompt ourselves — see UpdateToast below
      includeAssets: ['favicon.ico', 'images/logos/apple-touch-icon.png'],
      manifest: {
        name: 'Stitch — Digitizing the informal sector.',
        short_name: 'Stitch',
        description: 'Digital infrastructure for laundry and fashion businesses in Nigeria.',
        theme_color: '#5826ee',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        // start_url: '/dashboard',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/images/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/images/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/images/pwa/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Never cache API calls — always hit the network for live data.
        // Only static assets (JS/CSS/images/fonts) get cached for offline use.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        // enabled: false, // avoid SW interfering with Vite's dev HMR
        enabled: true, // avoid SW interfering with Vite's dev HMR
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
});
