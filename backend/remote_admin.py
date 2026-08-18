"""Remote admin panel routes — import this from server.py"""
import logging
import re
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
REMOTE_ADMIN_DIR = ROOT_DIR / "static" / "remote"

_SECURE_LOGIN = """
    async function doLogin(customPin) {
      hideLoginError();
      const pinInput = document.getElementById('auth-pin');
      const pin = (typeof customPin === 'string' ? customPin : (pinInput ? pinInput.value : '')).trim();
      if (!pin) {
        showLoginError('Inserisci PIN o password per accedere.');
        toast('Inserisci PIN o password', '\u26a0\ufe0f');
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
        showApp();
      } catch (err) {
        console.error('Login error:', err);
        showLoginError(err.message || 'Rete non disponibile. Riprova.');
        toast(err.message || 'Errore di rete', '\u274c');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Accedi al Pannello';
        }
      }
    }
"""

_SECURE_POLL = """
    function stopOrdersPolling() {
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
    }
"""


def sanitize_remote_html(html: str) -> str:
    html = html.replace(
        "let authToken = localStorage.getItem('totem_admin_token') || '';",
        "let authToken = '';",
    )
    html = re.sub(
        r"async function doLogin\(customPin\) \{.*?\n    \}",
        _SECURE_LOGIN.strip(),
        html,
        count=1,
        flags=re.S,
    )
    html = re.sub(
        r"function doLogin\(customPin\) \{.*?\n    \}",
        _SECURE_LOGIN.strip(),
        html,
        count=1,
        flags=re.S,
    )
    html = re.sub(
        r"function doLogout\(\) \{.*?\n    \}",
        _SECURE_POLL.strip(),
        html,
        count=1,
        flags=re.S,
    )
    html = re.sub(
        r"\s*<!-- Quick access buttons -->.*?</div>\s*</div>",
        "",
        html,
        count=1,
        flags=re.S,
    )
    html = re.sub(
        r"\n\s*(async )?function quickLogin\(presetPin\) \{.*?\n    \}\n",
        "\n",
        html,
        count=1,
        flags=re.S,
    )
    html = html.replace("localStorage.setItem('totem_admin_token', authToken);", "")
    html = html.replace("localStorage.removeItem('totem_admin_token');", "")
    if "function stopOrdersPolling" in html:
        html = html.replace(
            "if (ordersPollTimer) clearInterval(ordersPollTimer);",
            "stopOrdersPolling();",
        )
    if "if (!authToken) return;" not in html:
        html = html.replace(
            "async function loadOrders() {",
            "async function loadOrders() {\n      if (!authToken) return;",
        )
    return html


def register_remote_admin(app: FastAPI) -> None:
    @app.get("/remote", include_in_schema=False)
    @app.get("/admin", include_in_schema=False)
    @app.get("/admin/", include_in_schema=False)
    @app.get("/admin.html", include_in_schema=False)
    @app.get("/remote.html", include_in_schema=False)
    async def remote_admin_redirect():
        return RedirectResponse(url="/remote/", status_code=307)

    @app.get("/remote/", include_in_schema=False)
    @app.get("/remote/index.html", include_in_schema=False)
    async def remote_admin_index():
        index_path = REMOTE_ADMIN_DIR / "index.html"
        if not index_path.is_file():
            raise HTTPException(status_code=404, detail="Pannello remoto non trovato")
        raw = index_path.read_text(encoding="utf-8")
        return HTMLResponse(sanitize_remote_html(raw), media_type="text/html; charset=utf-8")

    assets_dir = REMOTE_ADMIN_DIR / "assets"
    if assets_dir.is_dir():
        app.mount("/remote/assets", StaticFiles(directory=str(assets_dir)), name="remote_admin_assets")
    else:
        logger.warning("Remote admin assets directory missing: %s", assets_dir)
