import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Base para GitHub Pages: https://iancotosoto.github.io/weekly_todo/
export default defineConfig({
  base: '/weekly_todo/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Pizarra Semanal',
        short_name: 'Pizarra',
        description: 'Tareas con tabla y pizarra semanal',
        lang: 'es',
        start_url: '/weekly_todo/',
        scope: '/weekly_todo/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#e9e6df',
        theme_color: '#e9e6df',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
