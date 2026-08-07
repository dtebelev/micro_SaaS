import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = env.API_PORT || '8787'

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png'],
        manifest: {
          name: 'NaturoPin 1.0',
          short_name: 'NaturoPin',
          description: 'Превращает экспертную статью в пак карточек для Pinterest.',
          lang: 'ru',
          dir: 'ltr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#fafcd5',
          theme_color: '#0e401c',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // /landing — отдельная статическая страница (не часть SPA-приложения),
          // живёт в public/landing/ и публикуется на Vercel через свой rewrite
          // (см. vercel.json). Без этих двух исключений service worker приложения
          // перехватывает переход на /landing и подменяет его на само приложение
          // (navigateFallback подставляет /index.html на любой "непойманный" путь) —
          // это и было причиной бага "landing ведёт в приложение".
          globIgnores: ['landing/**'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/landing(\/|$)/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        // Локально фронт зовёт /api, Vite проксирует на Node API.
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})
