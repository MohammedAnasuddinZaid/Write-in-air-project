/**
 * Generate PWA icons from SVG template.
 * Run: node scripts/generate-icons.js
 * Requires: npm install sharp
 */

const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const svgPath = path.join(__dirname, '..', 'public', 'icons', 'icon.svg');
const outputDir = path.join(__dirname, '..', 'public', 'icons');

async function generate() {
  try {
    const sharp = require('sharp');
    const svgBuffer = fs.readFileSync(svgPath);

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`Generated ${outputPath}`);
    }
    console.log('All icons generated!');
  } catch (error) {
    console.log('To generate PNG icons:');
    console.log('1. npm install sharp');
    console.log('2. node scripts/generate-icons.js');
    console.log('Or manually place 192x192 and 512x512 PNG icons in public/icons/');
  }
}

generate();
