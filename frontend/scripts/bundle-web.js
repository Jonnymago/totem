const fs = require('fs');
const path = require('path');

let distPath = path.join(__dirname, '../../dist');
if (!fs.existsSync(distPath)) {
  distPath = path.join(__dirname, '../dist');
}
if (!fs.existsSync(distPath)) {
  distPath = path.join(process.cwd(), 'dist');
}

const outPath = path.join(__dirname, '../src/utils/web_build.json');

const result = {};

function walk(dir, prefix = '') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = prefix + '/' + file;
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, relPath);
    } else {
      const ext = path.extname(file).toLowerCase();
      const isBinary = ['.png', '.jpg', '.jpeg', '.gif', '.ttf', '.woff', '.woff2', '.ico'].includes(ext);
      if (isBinary) {
        result[relPath] = {
          type: 'base64',
          data: fs.readFileSync(fullPath).toString('base64'),
          ext
        };
      } else {
        result[relPath] = {
          type: 'text',
          data: fs.readFileSync(fullPath, 'utf8'),
          ext
        };
      }
    }
  }
}

if (fs.existsSync(distPath)) {
  walk(distPath);
  fs.writeFileSync(outPath, JSON.stringify(result));
  console.log(`Web build bundled to web_build.json from ${distPath}`);
} else {
  console.error('dist directory not found');
}
