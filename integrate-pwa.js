#!/usr/bin/env node

/**
 * PWA Integration Script
 * 
 * This script integrates vite-plugin-pwa with the existing Vite configuration
 * without modifying the protected vite.config.ts file.
 * 
 * It works by:
 * 1. Creating a temporary vite config that includes PWA plugin
 * 2. Using the existing manifest.json file
 * 3. Generating proper service worker
 * 4. Ensuring manifest is accessible at root
 */

import { build } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔧 Configurando PWA com vite-plugin-pwa...\n');

// Read existing manifest
const manifestPath = path.resolve(__dirname, 'client/manifest.json');
let existingManifest = {};

if (fs.existsSync(manifestPath)) {
  try {
    existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('✅ Manifest existente carregado');
  } catch (error) {
    console.log('⚠️  Erro ao ler manifest existente, usando configuração padrão');
  }
} else {
  console.log('⚠️  Manifest não encontrado, usando configuração padrão');
}

// PWA Configuration
const pwaConfig = {
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
    runtimeCaching: [
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
  includeAssets: [
    'icon-192x192.png', 
    'icon-512x512.png', 
    'apple-touch-icon.png',
    'screenshot-mobile.png',
    'screenshot-desktop.png'
  ],
  manifest: existingManifest,
  devOptions: {
    enabled: false
  }
};

// Create temporary Vite config with PWA
const vitePWAConfig = {
  plugins: [
    react(),
    VitePWA(pwaConfig)
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  base: '/'
};

// Build with PWA
async function buildWithPWA() {
  try {
    console.log('📦 Iniciando build com PWA...');
    
    await build(vitePWAConfig);
    
    console.log('✅ Build PWA concluído com sucesso!');
    
    // Copy existing service worker if it exists and we want to keep custom logic
    const customSW = path.resolve(__dirname, 'client/sw.js');
    const generatedSW = path.resolve(__dirname, 'dist/public/sw.js');
    
    if (fs.existsSync(customSW) && fs.existsSync(generatedSW)) {
      console.log('🔄 Mantendo service worker customizado...');
      fs.copyFileSync(customSW, generatedSW);
    }
    
    // Ensure manifest is at root
    const builtManifest = path.resolve(__dirname, 'dist/public/manifest.webmanifest');
    const targetManifest = path.resolve(__dirname, 'dist/public/manifest.json');
    
    if (fs.existsSync(builtManifest)) {
      fs.copyFileSync(builtManifest, targetManifest);
      console.log('✅ Manifest copiado para /manifest.json');
    }
    
    console.log('\n🎉 PWA configurado com sucesso!');
    console.log('📁 Arquivos prontos em: dist/public/');
    console.log('🌐 Manifesto acessível em: /manifest.json');
    console.log('⚙️  Service Worker: /sw.js');
    
  } catch (error) {
    console.error('❌ Erro no build PWA:', error);
    process.exit(1);
  }
}

// Run build
buildWithPWA();