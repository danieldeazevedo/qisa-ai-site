// Custom PWA configuration for Vite
// This file provides PWA configuration that works with the existing setup

import type { VitePWAOptions } from 'vite-plugin-pwa';

export const vitePWAConfig: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  devOptions: {
    enabled: false // Disable in development to avoid conflicts
  },
  includeAssets: [
    'icon-192x192.png', 
    'icon-512x512.png', 
    'apple-touch-icon.png',
    'screenshot-mobile.png',
    'screenshot-desktop.png'
  ],
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5 // 5 minutes
          }
        }
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
          }
        }
      }
    ]
  },
  // Use existing manifest.json instead of generating new one
  useCredentials: false,
  filename: 'sw.js', // Use our custom service worker
  strategies: 'generateSW', // Generate service worker
  srcDir: 'client',
  outDir: '../dist/public',
  base: '/',
  scope: '/',
  
  // Manifest configuration - this will be used to validate/enhance existing manifest.json
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
};