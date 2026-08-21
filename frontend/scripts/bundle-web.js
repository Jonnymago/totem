const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const outCandidates = [
  path.join(rootDir, 'frontend', 'src', 'utils', 'web_build.json'),
  path.join(rootDir, 'src', 'utils', 'web_build.json'),
  path.join(__dirname, '../src/utils/web_build.json')
];
const outPath = outCandidates.find(p => fs.existsSync(path.dirname(p))) || outCandidates[0];

function sanitizeRemoteHtml(html) {
  return html;
}

const remoteSrc = path.resolve(__dirname, '../../backend/static/remote/index.html');

if (!fs.existsSync(remoteSrc)) {
  console.warn(`[bundle-web] Remote Admin source not found, skipping HTML injection: ${remoteSrc}`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  if (!fs.existsSync(outPath)) {
    fs.writeFileSync(outPath, JSON.stringify({}));
  }
  process.exit(0);
}

const remoteHtml = sanitizeRemoteHtml(fs.readFileSync(remoteSrc, 'utf8'));
// The bundled HTML is served by the native local server from web_build.json.
// Deliberately do not create mirror files: they would become stale sources.

let result = {};
if (fs.existsSync(outPath)) {
  try { result = JSON.parse(fs.readFileSync(outPath, 'utf8')); } catch { result = {}; }
}

function setRemote(key) {
  result[key] = { type: 'text', data: remoteHtml, ext: '.html' };
}

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
  setRemote('/remote/index.html');
  setRemote('/remote.html');
  setRemote('/admin/index.html');
  setRemote('/admin.html');
}

setRemote('/index.html');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result));
console.log(`Remote Admin bundle updated from ${remoteSrc}: ${outPath}`);
