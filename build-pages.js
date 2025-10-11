import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building for GitHub Pages...');

// 1. Copy the GitHub Pages specific HTML file
const sourceHtml = path.join(__dirname, 'client', 'index.pages.html');
const targetHtml = path.join(__dirname, 'client', 'index.html');

if (fs.existsSync(sourceHtml)) {
  fs.copyFileSync(sourceHtml, targetHtml);
  console.log('✅ Copied GitHub Pages HTML template');
} else {
  console.log('⚠️  GitHub Pages HTML template not found, using default');
}

// 2. Build with Vite
try {
  execSync('vite build --config vite.config.pages.ts', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// 3. Create a simple 404.html for GitHub Pages SPA routing
const distDir = path.join(__dirname, 'dist', 'public');
const indexHtml = path.join(distDir, 'index.html');
const notFoundHtml = path.join(distDir, '404.html');

if (fs.existsSync(indexHtml)) {
  fs.copyFileSync(indexHtml, notFoundHtml);
  console.log('✅ Created 404.html for SPA routing');
}

console.log('🎉 GitHub Pages build completed!');
console.log('📁 Build output:', distDir);
