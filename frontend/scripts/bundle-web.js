const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const remoteSrc = path.join(rootDir, 'public', 'remote', 'index.html');
const outPath = path.join(rootDir, 'src', 'utils', 'web_build.json');

if (!fs.existsSync(remoteSrc)) throw new Error(`Remote Admin source not found: ${remoteSrc}`);

const remoteHtml = fs.readFileSync(remoteSrc, 'utf8');
const aliases = [
  path.join(rootDir, 'public', 'remote.html'),
  path.join(rootDir, 'public', 'admin.html'),
  path.join(rootDir, 'public', 'admin', 'index.html'),
  path.join(rootDir, 'backend', 'static', 'remote', 'index.html')
];
for (const target of aliases) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, remoteHtml);
}

let result = {};
if (fs.existsSync(outPath)) {
  try { result = JSON.parse(fs.readFileSync(outPath, 'utf8')); } catch { result = {}; }
}

function setRemote(key) {
  result[key] = { type: 'text', data: remoteHtml, ext: '.html' };
}

// Always replace the embedded Remote Admin, even when no web dist exists.
setRemote('/remote/index.html');
setRemote('/remote.html');
setRemote('/admin/index.html');
setRemote('/admin.html');

const distCandidates = [
  path.join(rootDir, '../../dist'),
  path.join(rootDir, '../dist'),
  path.join(rootDir, 'dist')
];
const distPath = distCandidates.find(fs.existsSync);

function walk(dir, prefix = '') {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const rel = `${prefix}/${file}`;
    if (fs.statSync(full).isDirectory()) walk(full, rel);
    else {
      const ext = path.extname(file).toLowerCase();
      const binary = ['.png', '.jpg', '.jpeg', '.gif', '.ttf', '.woff', '.woff2', '.ico'].includes(ext);
      result[rel] = { type: binary ? 'base64' : 'text', data: fs.readFileSync(full).toString(binary ? 'base64' : 'utf8'), ext };
    }
  }
}

if (distPath) {
  walk(distPath);
  // Dist may contain its own remote copies; force them back to the canonical source.
  setRemote('/remote/index.html');
  setRemote('/remote.html');
  setRemote('/admin/index.html');
  setRemote('/admin.html');
}

fs.writeFileSync(outPath, JSON.stringify(result));
console.log(`Remote Admin bundle updated: ${outPath}${distPath ? ` + ${distPath}` : ' (no dist; existing web assets preserved)'}`);
