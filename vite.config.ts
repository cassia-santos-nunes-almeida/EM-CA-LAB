/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Single consolidated app deployed at root (Vercel). No per-module base path.
const base = '/'

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-katex': ['katex'],
          'vendor-gemini': ['@google/generative-ai'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // Keep vitest out of e2e/: without this, the default include glob
    // (**/*.{test,spec}.*) would swallow the Playwright spec.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Section/page smoke tests render full trees (canvas sims + recharts + katex);
    // under parallel load these exceed the 5s default, so give them headroom.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,gif,svg,woff,woff2}'],
        // Two educational GIF animations are ~2 MB; raise the precache cap above
        // the 2 MiB default so every figure/animation is available offline.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: base + 'index.html',
      },
      manifest: {
        name: 'EM&AC Lab — Electromagnetism & Circuit Analysis',
        short_name: 'EM&AC Lab',
        description: 'Interactive virtual laboratory for electromagnetics and circuit analysis',
        theme_color: '#2563eb',
        background_color: '#f8fafc',
        display: 'standalone',
        scope: base,
        start_url: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@em': path.resolve(__dirname, './src/em'),
      '@circuits': path.resolve(__dirname, './src/circuits'),
      '@transmission': path.resolve(__dirname, './src/transmission'),
    },
  },
})
