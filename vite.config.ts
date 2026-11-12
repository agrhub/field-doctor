import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Installable PWA whose app shell is cached, so the field app opens and
    // works (on-device triage, offline checklist, queue) with no signal.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Field Doctor',
        short_name: 'Field Doctor',
        description: 'Hybrid on-device + cloud crop health assistant built with Firebase AI Logic.',
        lang: 'vi',
        theme_color: '#1f5135',
        background_color: '#f6f3ea',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
});
