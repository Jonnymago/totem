#!/usr/bin/env python3
from pathlib import Path

OLD = """        // Universal instant token assignment for seamless offline/online admin access
        let token = 'local-admin-token';

        // Try syncing with backend in background with quick timeout
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
          
          const res = await fetch('/api/admin/pin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data.access_token || data.token) token = data.access_token || data.token;
          }
        } catch (e) {
          // Network fetch ignored; local access token will proceed
        }

        authToken = token;
        
        toast('Accesso effettuato!');
        showApp();"""

NEW = """        const res = await fetch('/api/admin/pin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        });
        if (!res.ok) {
          let detail = 'Credenziali non valide';
          try { const err = await res.json(); detail = err.detail || detail; } catch (e) {}
          showLoginError(detail);
          toast(detail, '\\u274c');
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
        showApp();"""

QUICK = '''      <!-- Quick access buttons -->
      <div style="margin-top:14px; padding-top:12px; border-top:1px dashed var(--border);">
        <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:8px;">Accesso Rapido PIN Predefinito:</div>
        <div style="display:flex; gap:8px; justify-content:center;">
          <button type="button" class="btn btn-outline btn-sm" style="flex:1; border-radius:8px; font-weight:700;" onclick="quickLogin('0000')">\\u26a1 PIN 0000</button>
          <button type="button" class="btn btn-outline btn-sm" style="flex:1; border-radius:8px; font-weight:700;" onclick="quickLogin('1234')">\\u26a1 PIN 1234</button>
        </div>
      </div>'''

paths = [
    Path('backend/static/remote/index.html'),
    Path('public/remote/index.html'),
    Path('public/remote.html'),
    Path('public/admin.html'),
    Path('public/admin/index.html'),
]
for p in paths:
    if not p.is_file():
        print('missing', p)
        continue
    h = p.read_text(encoding='utf-8')
    orig = h
    if OLD in h:
        h = h.replace(OLD, NEW, 1)
        print('replaced login', p)
    elif "let token = 'local-admin-token'" in h:
        print('WARNING leftover fake token in', p)
    else:
        print('login block not found', p)
    if QUICK in h:
        h = h.replace(QUICK, '', 1)
        print('removed quick buttons', p)
    else:
        print('quick buttons not found', p)
    h = h.replace("localStorage.setItem('totem_admin_token', authToken);", '')
    h = h.replace("localStorage.removeItem('totem_admin_token');", '')
    h = h.replace("let authToken = localStorage.getItem('totem_admin_token') || '';", "let authToken = '';")
    if h != orig:
        p.write_text(h, encoding='utf-8')
        print('wrote', p)
    else:
        print('unchanged', p)
