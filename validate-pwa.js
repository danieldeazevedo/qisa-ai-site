#!/usr/bin/env node

// PWA Validation Script for Render deployment

import fs from 'fs';
import path from 'path';

const distDir = 'dist/public';

console.log('🔍 Validating PWA build for Render...\n');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ Build directory not found. Run ./build-render.sh first.');
  process.exit(1);
}

// Required PWA files
const requiredFiles = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  '_redirects',
  'icon-192x192.png',
  'icon-512x512.png',
  'apple-touch-icon.png'
];

let allFilesExist = true;

console.log('📋 Checking required files:');
requiredFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
  } else {
    console.log(`❌ ${file} - Missing!`);
    allFilesExist = false;
  }
});

// Check manifest content
console.log('\n🔧 Validating manifest.webmanifest:');
try {
  const manifestPath = path.join(distDir, 'manifest.webmanifest');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
  requiredFields.forEach(field => {
    if (manifest[field]) {
      console.log(`✅ ${field}: ${typeof manifest[field] === 'object' ? 'configured' : manifest[field]}`);
    } else {
      console.log(`❌ ${field}: Missing!`);
      allFilesExist = false;
    }
  });

  // Check icons
  if (manifest.icons && manifest.icons.length >= 2) {
    console.log(`✅ Icons: ${manifest.icons.length} configured`);
    manifest.icons.forEach(icon => {
      console.log(`   📱 ${icon.sizes} - ${icon.src}`);
    });
  } else {
    console.log('❌ Icons: Insufficient (need at least 192x192 and 512x512)');
    allFilesExist = false;
  }
} catch (error) {
  console.log('❌ Manifest validation failed:', error.message);
  allFilesExist = false;
}

// Check HTML for manifest link
console.log('\n🔗 Checking HTML manifest link:');
try {
  const htmlPath = path.join(distDir, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  
  if (html.includes('rel="manifest"') && html.includes('manifest.webmanifest')) {
    console.log('✅ Manifest linked correctly in HTML');
  } else {
    console.log('❌ Manifest not properly linked in HTML');
    allFilesExist = false;
  }
} catch (error) {
  console.log('❌ HTML validation failed:', error.message);
  allFilesExist = false;
}

// Check _redirects
console.log('\n🔄 Checking _redirects:');
try {
  const redirectsPath = path.join(distDir, '_redirects');
  const redirects = fs.readFileSync(redirectsPath, 'utf8').trim();
  
  if (redirects.includes('/*') && redirects.includes('/index.html')) {
    console.log('✅ Client-side routing configured');
  } else {
    console.log('❌ Invalid _redirects configuration');
    allFilesExist = false;
  }
} catch (error) {
  console.log('❌ _redirects validation failed:', error.message);
  allFilesExist = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 PWA validation passed! Ready for Render deployment.');
  console.log('\n📋 Next steps:');
  console.log('1. Push code to GitHub');
  console.log('2. Create Static Site on Render');
  console.log('3. Set Build Command: ./build-render.sh');
  console.log('4. Set Publish Directory: dist/public');
  console.log('5. Deploy and test PWA installation!');
} else {
  console.log('❌ PWA validation failed. Fix issues above before deploying.');
  process.exit(1);
}