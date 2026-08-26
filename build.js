#!/usr/bin/env node
/**
 * LinkedSpace Build & Packaging Script
 * Creates a clean, minified distribution directory and .zip bundle
 * ready for the Chrome Web Store.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ZIP_FILE = path.join(ROOT_DIR, 'linkedspace.zip');

// Clean dist directory
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'icons'), { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'popup'), { recursive: true });

// Helper to minify simple JS/CSS
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/\s+/g, ' ')             // collapse whitespace
    .replace(/\s*([:;{}])\s*/g, '$1') // remove spaces around delimiters
    .replace(/;}/g, '}')              // remove trailing semicolon
    .trim();
}

function minifyJS(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove multi-line comments
    .replace(/^\s*\/\/.*$/gm, '')      // remove single-line comments
    .replace(/^\s+/gm, '')            // remove leading whitespace
    .replace(/\n+/g, '\n')            // collapse blank lines
    .trim();
}

// 1. Copy & minify core files
console.log('📦 Building LinkedSpace Extension...');

// manifest.json
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'manifest.json'), 'utf8'));
fs.writeFileSync(path.join(DIST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

// styles.css
const stylesCss = fs.readFileSync(path.join(ROOT_DIR, 'styles.css'), 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'styles.css'), minifyCSS(stylesCss));

// content.js
const contentJs = fs.readFileSync(path.join(ROOT_DIR, 'content.js'), 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'content.js'), minifyJS(contentJs));

// popup files
const popupHtml = fs.readFileSync(path.join(ROOT_DIR, 'popup', 'popup.html'), 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'popup', 'popup.html'), popupHtml);

const popupCss = fs.readFileSync(path.join(ROOT_DIR, 'popup', 'popup.css'), 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'popup', 'popup.css'), minifyCSS(popupCss));

const popupJs = fs.readFileSync(path.join(ROOT_DIR, 'popup', 'popup.js'), 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'popup', 'popup.js'), minifyJS(popupJs));

// icons (only 16, 32, 48, 128)
const iconSizes = ['16', '32', '48', '128'];
for (const size of iconSizes) {
  const iconName = `icon${size}.png`;
  fs.copyFileSync(
    path.join(ROOT_DIR, 'icons', iconName),
    path.join(DIST_DIR, 'icons', iconName)
  );
}

// Create ZIP file using system zip command
if (fs.existsSync(ZIP_FILE)) {
  fs.unlinkSync(ZIP_FILE);
}

try {
  execSync(`cd "${DIST_DIR}" && zip -r "${ZIP_FILE}" ./*`, { stdio: 'pipe' });
  const stats = fs.statSync(ZIP_FILE);
  const sizeKb = (stats.size / 1024).toFixed(1);
  console.log(`✅ Build complete!`);
  console.log(`   Dist directory: dist/`);
  console.log(`   Extension zip:  linkedspace.zip (${sizeKb} KB)`);
} catch (e) {
  console.error('Error creating zip:', e.message);
}
