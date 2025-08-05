// PWA Configuration for vite-plugin-pwa
// This file will be imported by the vite config

import { VitePWA } from 'vite-plugin-pwa';

export const pwaConfig = VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
          }
        }
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'gstatic-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
          }
        }
      },
      {
        urlPattern: /\/api\/.*$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5 // 5 minutes
          }
        }
      }
    ]
  },
  includeAssets: ['icon-192x192.png', 'icon-512x512.png', 'apple-touch-icon.png'],
  manifest: {
    name: 'Qisa - Assistente de IA Avançada',
    short_name: 'Qisa',
    description: 'Qisa é sua assistente de IA que conversa naturalmente, gera imagens incríveis e oferece suporte matemático avançado.',
    theme_color: '#6366f1',
    background_color: '#0a0a0a',
    display: 'standalone',
    orientation: 'portrait-primary',
    scope: '/',
    start_url: '/',
    lang: 'pt-BR',
    categories: ['productivity', 'education', 'ai', 'utilities'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ],
    screenshots: [
      {
        src: '/screenshot-mobile.png',
        sizes: '375x812',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Qisa em dispositivos móveis'
      },
      {
        src: '/screenshot-desktop.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Qisa em desktop'
      }
    ],
    prefer_related_applications: false,
    edge_side_panel: {
      preferred_width: 480
    },
    shortcuts: [
      {
        name: 'Nova Conversa',
        short_name: 'Chat',
        description: 'Iniciar uma nova conversa com Qisa',
        url: '/?action=new-chat',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192'
          }
        ]
      },
      {
        name: 'Gerar Imagem',
        short_name: 'Imagem',
        description: 'Gerar uma nova imagem com IA',
        url: '/?action=generate-image',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192'
          }
        ]
      }
    ]
  }
});