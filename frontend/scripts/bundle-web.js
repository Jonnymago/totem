const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const remoteSrc = path.join(rootDir, 'public', 'remote', 'index.html');

if (fs.existsSync(remoteSrc)) {
  const remoteHtml = fs.readFileSync(remoteSrc, 'utf8');

  // Sync to public aliases
  const targets = [
    path.join(rootDir, 'public', 'remote.html'),
    path.join(rootDir, 'public', 'admin.html'),
    path.join(rootDir, 'public', 'admin', 'index.html'),
    path.join(rootDir, 'backend', 'static', 'remote', 'index.html')
  ];

  for (const t of targets) {
    const parent = path.dirname(t);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    fs.writeFileSync(t, remoteHtml);
  }
}

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
  // Ensure dist has all remote html aliases
  if (fs.existsSync(remoteSrc)) {
    const remoteHtml = fs.readFileSync(remoteSrc, 'utf8');
    const distTargets = [
      path.join(distPath, 'remote', 'index.html'),
      path.join(distPath, 'admin', 'index.html'),
      path.join(distPath, 'remote.html'),
      path.join(distPath, 'admin.html')
    ];
    for (const dt of distTargets) {
      const parent = path.dirname(dt);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.writeFileSync(dt, remoteHtml);
    }
  }

  walk(distPath);
  fs.writeFileSync(outPath, JSON.stringify(result));
  console.log(`Web build bundled to web_build.json from ${distPath} (${Object.keys(result).length} assets)`);
} else {
  console.error('dist directory not found');
}

