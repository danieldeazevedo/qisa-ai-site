#!/bin/bash

# PWA Build Script for Vite
# This script builds the project with proper PWA configuration

echo "🔧 Building project with PWA support..."

# Clean previous build
rm -rf dist/

# Run the PWA integration build
echo "📦 Running Vite build with PWA plugin..."
node integrate-pwa.js

# Verify build output
if [ -d "dist/public" ]; then
    echo "✅ Build completed successfully!"
    
    # Check for PWA files
    echo ""
    echo "📋 PWA Files Generated:"
    ls -la dist/public/ | grep -E "(manifest|sw\.js)" || echo "⚠️  Some PWA files may be missing"
    
    echo ""
    echo "🎯 Build ready for deployment!"
    echo "📁 Deploy folder: dist/public/"
    
else
    echo "❌ Build failed - dist/public not found"
    exit 1
fi