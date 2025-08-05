#!/bin/bash

# Build script for Render deployment with PWA support

echo "🏗️ Starting Render PWA build..."

# Build the Vite project
echo "📦 Building Vite project..."
vite build

# Copy PWA files to the dist directory
echo "📋 Copying PWA files..."
# The manifest.webmanifest is processed by Vite, so we need to overwrite it at root
cp client/manifest.webmanifest dist/public/manifest.webmanifest
cp client/_redirects dist/public/
cp client/sw.js dist/public/

# Fix HTML to point to correct manifest location
echo "🔧 Fixing manifest path in HTML..."
sed -i 's|href="/assets/manifest-[^"]*\.webmanifest"|href="/manifest.webmanifest"|g' dist/public/index.html

# Copy PWA icons
echo "🎨 Copying PWA icons..."
cp client/icon-192x192.png dist/public/
cp client/icon-512x512.png dist/public/
cp client/apple-touch-icon.png dist/public/
cp client/screenshot-mobile.png dist/public/
cp client/screenshot-desktop.png dist/public/

echo "✅ Render PWA build completed!"
echo "📁 Static files ready in: dist/public/"
echo "🌐 Deploy the dist/public/ folder as a Static Site on Render"