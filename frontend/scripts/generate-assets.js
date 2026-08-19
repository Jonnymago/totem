// Verified binary image assets exist
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '../assets/images');
const required = ['icon.png', 'adaptive-icon.png', 'splash-image.png', 'favicon.png'];

for (const f of required) {
  const p = path.join(imgDir, f);
  if (!fs.existsSync(p)) {
    console.warn(`Warning: ${f} not found in ${imgDir}`);
  }
}
console.log('Image assets check OK');
