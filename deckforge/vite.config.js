import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.js',
    registerType: 'prompt',
    injectRegister: false,

    manifest: {
      name: 'DeckForge',
      short_name: 'DeckForge',
      description: 'Explore cartas, monte decks e gerencie sua coleção.',
      lang: 'pt-BR',
      start_url: '/',
      display: 'standalone',
      background_color: '#0c0e12',
      theme_color: '#dfb15b',

      icons: [{
        src: '/icons/pwa-64x64.png',
        sizes: '64x64',
        type: 'image/png',
      }, {
        src: '/icons/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      }, {
        src: '/icons/pwa-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      }, {
        src: '/icons/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      }, {
        src: '/icons/pwa-192x192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/pwa-512x512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      }],
    },

    injectManifest: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
    },

    devOptions: {
      enabled: false,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })],
})