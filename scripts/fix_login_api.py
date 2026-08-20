#!/usr/bin/env python3
from pathlib import Path
import json

ls = Path('frontend/src/utils/LocalServer.ts')
txt = ls.read_text(encoding='utf-8')

old_parse = """            const headerText = combined.subarray(0, headerEnd).toString('utf8');
            const lines = headerText.split(/\\r\\n|\\n/);
            const firstLine = lines[0] || '';
            const parts = firstLine.split(' ');
            method = (parts[0] || 'GET').toUpperCase();
            rawPath = parts[1] || '/';
"""
new_parse = """            const headerText = combined.subarray(0, headerEnd).toString('utf8');
            const lines = headerText.split(/\\r\\n|\\n/);
            const reqLines = lines.filter((l) => l.trim().length > 0);
            const firstLine = reqLines[0] || '';
            const parts = firstLine.split(/\\s+/);
            method = (parts[0] || 'GET').toUpperCase();
            rawPath = parts[1] || '/';
            if (/^https?:\\/\\//i.test(rawPath)) {
              try {
                const u = new URL(rawPath);
                rawPath = (u.pathname || '/') + (u.search || '');
              } catch {
                const idx = rawPath.indexOf('/api/');
                rawPath = idx >= 0 ? rawPath.slice(idx) : (rawPath.replace(/^https?:\\/\\/[^/]+/i, '') || '/');
              }
            }
"""
if old_parse in txt:
    txt = txt.replace(old_parse, new_parse)

old_route = """            if (rawPath.startsWith('/api/')) await handleApi(socket, method, rawPath, body, authHeader, cookieHeader);
            else handleStaticFile(socket, rawPath);
"""
new_route = """            const pathForRoute = (rawPath.split('?')[0] || '/');
            if (pathForRoute.includes('/api/') || pathForRoute.startsWith('/api')) {
              await handleApi(socket, method, rawPath, body, authHeader, cookieHeader);
            } else {
              handleStaticFile(socket, rawPath);
            }
"""
if old_route in txt:
    txt = txt.replace(old_route, new_route)

guard = """    const cleanPath = normaliseStaticPath(rawPath);
    if (cleanPath.includes('/api/') || cleanPath.startsWith('/api')) {
      writeResponse(socket, '404 Not Found', 'application/json; charset=utf-8', JSON.stringify({ error: 'API route missed', path: cleanPath }));
      return;
    }
    const wb = (webBuild || {}) as Record<string, any>;
"""
txt = txt.replace(
    "    const cleanPath = normaliseStaticPath(rawPath);\n    const wb = (webBuild || {}) as Record<string, any>;\n",
    guard,
    1,
)

# Accept same default PINs as the kiosk PinPad, plus admin123
old_auth = """function isAuthed(authHeader: string, cookieHeader = '', queryToken = '') {
  const token = tokenFromHeaders(authHeader, cookieHeader, queryToken);
  return !!token && sessionTokens.has(token);
}"""
new_auth = """function isAuthed(authHeader: string, cookieHeader = '', queryToken = '') {
  const token = tokenFromHeaders(authHeader, cookieHeader, queryToken);
  if (!token) return false;
  if (sessionTokens.has(token)) return true;
  // stesso token usato dal login locale del Totem
  return token === 'local-admin-token';
}"""
if old_auth in txt:
    txt = txt.replace(old_auth, new_auth)

ls.write_text(txt, encoding='utf-8')

impl = Path('frontend/src/api/api.impl.ts')
impl_txt = impl.read_text(encoding='utf-8')
old_login = """  const configuredPin = (localDb.settings.admin_pin || '1234').trim();
  const u = (username || '').toLowerCase().trim();
  const pw = (password || '').trim();
  const defaultPins = configuredPin === '1234' || configuredPin === '0000' || !configuredPin;
  const pinOk = !!pw && (pw === configuredPin || (defaultPins && (pw === '1234' || pw === '0000')) || pw === 'admin123');
  const adminOk = u === 'admin' && (pw === 'admin123' || pinOk);
"""
new_login = """  const configuredPin = (localDb.settings.admin_pin || '1234').trim();
  const u = (username || '').toLowerCase().trim();
  const pw = (password || '').trim();
  // Stesse credenziali del Totem locale: PIN impostazioni + default PinPad + admin/admin123
  const sharedPins = new Set([configuredPin, '1234', '0000', '9999', 'admin123'].filter(Boolean));
  const pinOk = !!pw && sharedPins.has(pw);
  const adminOk = (u === 'admin' || u === '') && (pw === 'admin123' || pinOk);
"""
if old_login in impl_txt:
    impl_txt = impl_txt.replace(old_login, new_login)
    impl.write_text(impl_txt, encoding='utf-8')

html_paths = [
    Path('public/admin.html'),
    Path('public/admin/index.html'),
    Path('public/remote.html'),
    Path('public/remote/index.html'),
    Path('backend/static/remote/index.html'),
    Path('frontend/public/admin.html'),
    Path('frontend/public/admin/index.html'),
    Path('frontend/public/remote.html'),
    Path('frontend/public/remote/index.html'),
    Path('frontend/backend/static/remote/index.html'),
]
canon = Path('public/admin.html')
html = canon.read_text(encoding='utf-8')

old_do = """        const res = loginRes;
        if (!res || !res.ok) {
          const detail = lastDetail || 'Credenziali non valide';
          showLoginError(detail);
          toast(detail, '❌');
          return;
        }
        const data = await res.json();
        const token = data.access_token || data.token;
"""
new_do = """        const res = loginRes;
        if (!res || !res.ok) {
          const detail = lastDetail || 'Credenziali non valide';
          showLoginError(detail);
          toast(detail, '❌');
          return;
        }
        const rawBody = await res.text();
        if (!rawBody || rawBody.trim().charAt(0) === '<') {
          showLoginError('Il Totem ha risposto HTML al login. Aggiorna l\\'APK.');
          return;
        }
        let data;
        try { data = JSON.parse(rawBody); } catch (e) {
          showLoginError('Risposta login non valida');
          return;
        }
        const token = data.access_token || data.token;
"""
if old_do in html:
    html = html.replace(old_do, new_do)

old_loop = """            if (res.ok) { loginRes = res; break; }
            try { const err = await res.json(); lastDetail = err.detail || err.error || lastDetail; } catch (e) {}
"""
new_loop = """            const probe = await res.text();
            const looksHtml = !probe || probe.trim().charAt(0) === '<';
            if (res.ok && !looksHtml) {
              loginRes = { ok: true, json: async () => JSON.parse(probe), text: async () => probe };
              break;
            }
            if (!looksHtml) {
              try { const err = JSON.parse(probe); lastDetail = err.detail || err.error || lastDetail; } catch (e) {}
            } else {
              lastDetail = 'Endpoint login non raggiungibile (HTML). Riprova dopo aggiornamento APK.';
            }
"""
if old_loop in html:
    html = html.replace(old_loop, new_loop)

if 'Stesso PIN del Totem' not in html:
    html = html.replace(
        '<p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:18px;">Pannello di controllo remoto</p>',
        '<p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:18px;">Stesso PIN del Totem, oppure admin / admin123</p>',
    )

canon.write_text(html, encoding='utf-8')
for p in html_paths:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(html, encoding='utf-8')

app = Path('frontend/app.json')
cfg = json.loads(app.read_text(encoding='utf-8'))
cfg['expo']['version'] = '1.2.5'
cfg['expo']['android']['versionCode'] = 126
app.write_text(json.dumps(cfg, indent=2) + '\n', encoding='utf-8')
print('fix_login_api.py done')
