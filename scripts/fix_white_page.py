#!/usr/bin/env python3
from pathlib import Path
import json
import re

src = Path('public/admin.html')
html = src.read_text(encoding='utf-8')

html = html.replace(
    'const m = trimmed.match(/^data:([^;]+);base64,(.+)$/s);',
    'const m = trimmed.match(/^data:([^;]+);base64,([\\s\\S]+)$/);',
)

if 'function money(' not in html:
    html = html.replace(
        'function escapeHtml(text) {',
        'function money(v) {\n'
        '      const n = Number(v);\n'
        '      return (Number.isFinite(n) ? n : 0).toFixed(2);\n'
        '    }\n\n'
        '    function escapeHtml(text) {',
    )

html = re.sub(r'\(p\.price \|\| 0\)\.toFixed\(2\)', 'money(p.price)', html)
html = re.sub(r'\(ord\.total_price \|\| 0\)\.toFixed\(2\)', 'money(ord.total_price)', html)
html = re.sub(
    r'\(\(it\.price \|\| 0\) \* \(it\.quantity \|\| 1\)\)\.toFixed\(2\)',
    'money((Number(it.price)||0)*(Number(it.quantity)||1))',
    html,
)

old_init = """    function init() {
      try {
        if (authToken) {
          showApp();
        } else {
          showAuth();
        }
      } catch (err) {
        console.error('Init error:', err);
        showAuth();
      }"""
new_init = """    function init() {
      try {
        showAuth();
        if (!authToken) return;
        fetch('/api/admin/settings', { headers: { Authorization: 'Bearer ' + authToken, Accept: 'application/json' } })
          .then(function(r) { if (r && r.ok) showApp(); else { authToken = ''; try { localStorage.removeItem('totem_sess'); } catch (e) {} } })
          .catch(function() {});
      } catch (err) {
        console.error('Init error:', err);
        showAuth();
      }"""
if old_init in html:
    html = html.replace(old_init, new_init)

old_render = """    function renderCurrentTab() {
      if (currentTab === 'products') renderProducts();
      else if (currentTab === 'categories') renderCategories();
      else if (currentTab === 'groups') renderGroups();
      else if (currentTab === 'orders') loadOrders();
      else if (currentTab === 'settings') renderSettings();
    }"""
new_render = """    function renderCurrentTab() {
      try {
        if (currentTab === 'products') renderProducts();
        else if (currentTab === 'categories') renderCategories();
        else if (currentTab === 'groups') renderGroups();
        else if (currentTab === 'orders') loadOrders();
        else if (currentTab === 'settings') renderSettings();
      } catch (err) {
        console.error('renderCurrentTab error:', err);
        toast('Errore visualizzazione: ' + (err && err.message ? err.message : err), '⚠\ufe0f');
      }
    }"""
if old_render in html:
    html = html.replace(old_render, new_render)

src.write_text(html, encoding='utf-8')
for p in [
    Path('public/admin/index.html'),
    Path('public/remote.html'),
    Path('public/remote/index.html'),
    Path('backend/static/remote/index.html'),
    Path('frontend/public/admin.html'),
    Path('frontend/public/admin/index.html'),
    Path('frontend/public/remote.html'),
    Path('frontend/public/remote/index.html'),
    Path('frontend/backend/static/remote/index.html'),
]:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(html, encoding='utf-8')

ls = Path('frontend/src/utils/LocalServer.ts')
ls_txt = ls.read_text(encoding='utf-8')
ls_txt = ls_txt.replace(
    "file = wb['/index.html'] || wb['/remote/index.html'] || wb['/remote.html'];",
    "file = wb['/remote/index.html'] || wb['/remote.html'] || wb['/admin/index.html'] || wb['/admin.html'] || wb['/index.html'];",
)
old_fb = """    if (!file) {
      if (cleanPath.startsWith('/remote') || cleanPath.startsWith('/admin')) {
        file = wb['/remote/index.html'] || wb['/remote.html'] || wb['/admin/index.html'] || wb['/index.html'];
      } else if (!cleanPath.includes('.')) {
        file = wb['/remote/index.html'] || wb['/remote.html'] || wb['/admin/index.html'] || wb['/admin.html'] || wb['/index.html'];
      }
    }"""
# after first replace the else-if branch already prefers remote
if 'Pannello Gestione Totem' not in ls_txt:
    needle = "    if (!file) {\n      writeResponse(socket, '404 Not Found', 'text/html; charset=utf-8'"
    insert = (
        "    if (file && String(file.ext || '').toLowerCase() === '.html') {\n"
        "      const htmlText = file.type === 'base64' ? Buffer.from(file.data, 'base64').toString('utf8') : String(file.data || '');\n"
        "      if (!htmlText.includes('Pannello Gestione Totem')) {\n"
        "        const admin = wb['/remote/index.html'] || wb['/remote.html'] || wb['/admin/index.html'] || wb['/admin.html'];\n"
        "        if (admin) file = admin;\n"
        "      }\n"
        "    }\n\n"
        "    if (!file) {\n      writeResponse(socket, '404 Not Found', 'text/html; charset=utf-8'"
    )
    if needle in ls_txt:
        ls_txt = ls_txt.replace(needle, insert, 1)
ls.write_text(ls_txt, encoding='utf-8')

bw = Path('frontend/scripts/bundle-web.js')
bw_txt = bw.read_text(encoding='utf-8')
bw_txt = bw_txt.replace(
    "if (!result['/index.html']) {\n  result['/index.html'] = { type: 'text', data: remoteHtml, ext: '.html' };\n}",
    "setRemote('/index.html');",
)
bw.write_text(bw_txt, encoding='utf-8')

app = Path('frontend/app.json')
cfg = json.loads(app.read_text(encoding='utf-8'))
cfg['expo']['version'] = '1.2.4'
cfg['expo']['android']['versionCode'] = 125
app.write_text(json.dumps(cfg, indent=2) + '\n', encoding='utf-8')
print('fix_white_page.py done')
