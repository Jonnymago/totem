#!/usr/bin/env python3
from pathlib import Path
import re
import sys

NEW_LOGIN = """        const res = await fetch('/api/admin/pin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        });
        if (!res.ok) {
          let detail = 'Credenziali non valide';
          try { const err = await res.json(); detail = err.detail || detail; } catch (e) {}
          showLoginError(detail);
          toast(detail, '\u274c');
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

FAKE_LOGIN_RE = re.compile(
    r"[ \t]*// Universal instant token assignment[^\n]*\n"
    r".*?authToken = token;\n"
    r"(?:[ \t]*localStorage\.setItem\('totem_admin_token', authToken\);\n)?"
    r"[ \t]*toast\('Accesso effettuato!'\);\n"
    r"[ \t]*showApp\(\);",
    re.S,
)

QUICK_RE = re.compile(
    r"[ \t]*<!-- Quick access buttons -->\s*"
    r"<div[^>]*>\s*"
    r"<div[^>]*>Accesso Rapido PIN Predefinito:</div>\s*"
    r"<div[^>]*>\s*"
    r"<button[^>]*onclick=\"quickLogin\('0000'\)\"[^>]*>.*?</button>\s*"
    r"<button[^>]*onclick=\"quickLogin\('1234'\)\"[^>]*>.*?</button>\s*"
    r"</div>\s*"
    r"</div>",
    re.S,
)

paths = [
    Path('backend/static/remote/index.html'),
    Path('public/remote/index.html'),
    Path('public/remote.html'),
    Path('public/admin.html'),
    Path('public/admin/index.html'),
]

failed = False
for p in paths:
    if not p.is_file():
        print('missing', p)
        continue
    h = p.read_text(encoding='utf-8')
    orig = h
    h2, n_login = FAKE_LOGIN_RE.subn(lambda _m: NEW_LOGIN, h, count=1)
    h = h2
    if n_login:
        print('replaced login', p)
    elif "let token = 'local-admin-token'" in h:
        print('WARNING leftover fake token in', p)
        failed = True
    else:
        print('login block not found or already clean', p)

    h2, n_quick = QUICK_RE.subn('', h, count=1)
    h = h2
    if n_quick:
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

    if "let token = 'local-admin-token'" in h:
        print('ERROR still has fake token after sanitize:', p)
        failed = True

if failed:
    sys.exit(1)
print('sanitize ok')
