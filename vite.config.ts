/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// Petits Lecteurs : `BASE_PATH` (ex. /petits-lecteurs/) est fixé par le workflow de déploiement GitHub Pages.
const APP_NAME = 'Petits Lecteurs';
const APP_DESCRIPTION = 'Apprendre à lire en maternelle, en jouant';

export default defineConfig(() => {
  return {
    base: process.env.BASE_PATH ?? '/',
    build: { outDir: 'dist' },
    plugins: [
      preact(),
      {
        // Titre de l'onglet et de l'écran d'accueil iOS : celui de l'app construite.
        name: 'app-title',
        transformIndexHtml: (html: string) => html.replace(/<title>[^<]*<\/title>/, `<title>${APP_NAME}</title>`),
      },
      VitePWA({
        // F12 : "prompt" (pas "autoUpdate") — la mise à jour n'est appliquée qu'au moment sûr choisi
        // par src/main.tsx (montage de l'écran profils), jamais en pleine partie.
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['favicon.svg', 'icons/*.png'],
        manifest: {
          id: 'petits-lecteurs',
          name: APP_NAME,
          short_name: APP_NAME,
          description: APP_DESCRIPTION,
          lang: 'fr',
          display: 'fullscreen',
          display_override: ['fullscreen', 'standalone'],
          orientation: 'portrait',
          background_color: '#FFF7E8',
          theme_color: '#825FD8',
          start_url: '.',
          scope: '.',
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icons/maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
          // Fredoka embarque un sous-ensemble hébreu inutile ici : jamais précaché.
          globIgnores: ['**/*hebrew*'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          navigateFallback: 'index.html',
        },
      }),
    ],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
