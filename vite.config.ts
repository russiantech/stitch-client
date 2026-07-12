// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import { resolve } from 'path';
// import { fileURLToPath } from 'url';
// import { VitePWA } from 'vite-plugin-pwa';

// const __dirname = fileURLToPath(new URL('.', import.meta.url));

// export default defineConfig({
//   // plugins: [react()],

//   plugins: [
//     react(), // your existing plugins stay as-is
//     VitePWA({
//       registerType: 'prompt', // we drive the update UI ourselves — never silently reloads mid-session
//       injectRegister: 'auto',
//       includeAssets: ['favicon.png', 'apple-touch-icon.png'],
//       manifest: {
//         id: '/',
//         name: 'Stitch — Laundry & Fashion Ops',
//         short_name: 'Stitch',
//         description: 'Manage laundry and fashion orders, subscriptions, and your team — all in one place.',
//         start_url: '/',
//         scope: '/',
//         display: 'standalone',
//         background_color: '#ffffff',
//         theme_color: '#4F46E5', // TODO: match exactly to your --primary CSS variable
//         lang: 'en',
//         categories: ['business', 'productivity'],
//         icons: [
//           { src: '/pwa-icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
//           { src: '/pwa-icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
//           { src: '/pwa-icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
//         ],
//       },
//       workbox: {
//         // Precache only the built app shell (JS/CSS/HTML) — never API responses.
//         // This app is session-cookie authenticated and multi-tenant; caching
//         // /api/* would risk serving stale or cross-account data on a shared or
//         // kiosk device. Static assets carry no user data, so they're safe.
//         globPatterns: ['**/*.{js,css,html,svg,woff2}'],
//         navigateFallback: '/index.html',
//         navigateFallbackDenylist: [/^\/api\//],
//         runtimeCaching: [], // intentionally empty — see note above
//       },
//       devOptions: {
//         enabled: false, // no SW noise in dev — test installability via `vite build && vite preview`
//       },
//     }),
//   ],

//   resolve: {
//     alias: {
//       '@': resolve(__dirname, 'src'),
//     },
//   },
//   server: {
//     port: 5173,
//     proxy: {
//       '/api': { target: 'http://localhost:8000', changeOrigin: true },
//     },
//   },
// });




// v2
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
        name: 'Stitch — Laundry & Fashion Operations',
        short_name: 'Stitch',
        description: 'Digital infrastructure for laundry and fashion businesses in Nigeria.',
        theme_color: '#5826ee',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/dashboard',
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
        enabled: false, // avoid SW interfering with Vite's dev HMR
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
