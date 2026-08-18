const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const outPath = path.join(rootDir, 'src', 'utils', 'web_build.json');

function sanitizeRemoteHtml(html) {
  const secureLogin = `async function doLogin(customPin) {
      hideLoginError();
      const pinInput = document.getElementById('auth-pin');
      const pin = (typeof customPin === 'string' ? customPin : (pinInput ? pinInput.value : '')).trim();
      if (!pin) {
        showLoginError('Inserisci PIN o password per accedere.');
        toast('Inserisci PIN o password', '⚠️');
        return;
      }
      const submitBtn = document.getElementById('login-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Accesso...';
      }
      try {
        const res = await fetch('/api/admin/pin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        });
        if (!res.ok) {
          let detail = 'Credenziali non valide';
          try { const err = await res.json(); detail = err.detail || detail; } catch (e) {}
          showLoginError(detail);
          toast(detail, '❌');
          return;
        }
        const data = await res.json();
        const token = data.access_token || data.token;
        if (!token) {
          showLoginError('Risposta login non valida');
          return;
        }
        authToken = token;
        toast('Accesso effettuato!');
        showApp();
      } catch (err) {
        console.error('Login error:', err);
        showLoginError(err.message || 'Rete non disponibile. Riprova.');
        toast(err.message || 'Errore di rete', '❌');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Accedi al Pannello';
        }
      }
    }`;

  html = html.replace(
    "let authToken = localStorage.getItem('totem_admin_token') || '';",
    "let authToken = '';"
  );
  html = html.replace(/async function doLogin\(customPin\) \{[\s\S]*?\n    \}/, secureLogin);
  html = html.replace(/function doLogin\(customPin\) \{[\s\S]*?\n    \}/, secureLogin);
  html = html.replace(
    /function doLogout\(\) \{[\s\S]*?\n    \}/,
    `function stopOrdersPolling() {
      if (typeof ordersPollTimer !== 'undefined' && ordersPollTimer) {
        clearInterval(ordersPollTimer);
        ordersPollTimer = null;
      }
    }
    function doLogout() {
      stopOrdersPolling();
      authToken = '';
      showAuth();
      toast('Disconnesso');
    }`
  );
  html = html.replace(/\s*<!-- Quick access buttons -->[\s\S]*?<\/div>\s*<\/div>/, '');
  html = html.replace(/\n\s*(async )?function quickLogin\(presetPin\) \{[\s\S]*?\n    \}\n/, '\n');
  html = html.replace("localStorage.setItem('totem_admin_token', authToken);", '');
  html = html.replace("localStorage.removeItem('totem_admin_token');", '');
  if (html.includes('function stopOrdersPolling')) {
    html = html.replace('if (ordersPollTimer) clearInterval(ordersPollTimer);', 'stopOrdersPolling();');
  }
  if (!html.includes('if (!authToken) return;')) {
    html = html.replace('async function loadOrders() {', 'async function loadOrders() {\n      if (!authToken) return;');
  }
  return html;
}

const sourceCandidates = [
  path.join(rootDir, 'backend', 'static', 'remote', 'index.html'),
  path.join(rootDir, '..', 'backend', 'static', 'remote', 'index.html'),
  path.join(rootDir, 'public', 'remote', 'index.html')
];
const remoteSrc = sourceCandidates.find(fs.existsSync);

if (!remoteSrc) {
  throw new Error(`Remote Admin source not found. Checked: ${sourceCandidates.join(', ')}`);
}

const remoteHtml = sanitizeRemoteHtml(fs.readFileSync(remoteSrc, 'utf8'));
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

fs.writeFileSync(outPath, JSON.stringify(result));
console.log(`Remote Admin bundle updated from ${remoteSrc}: ${outPath}${distPath ? ` + ${distPath}` : ' (no dist; existing web assets preserved)'}`);
