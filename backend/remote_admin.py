"""Remote admin panel routes — import this from server.py"""
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
REMOTE_ADMIN_DIR = ROOT_DIR / "static" / "remote"

INJECT_BAR = """
<div id="totem-lan-links" style="position:fixed;bottom:12px;left:12px;z-index:99999;display:flex;flex-wrap:wrap;gap:8px;font-family:system-ui,sans-serif">
  <a href="/hub/" style="background:#0F172A;color:#F8FAFC;text-decoration:none;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;border:1px solid #334155">Hub</a>
  <a href="/display-queue/" style="background:#FF6B6B;color:#fff;text-decoration:none;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700">Display Queue</a>
  <a href="/display-queue/?mode=products" style="background:#1E293B;color:#E2E8F0;text-decoration:none;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;border:1px solid #334155">Solo prodotti</a>
  <a href="/kitchen/" style="background:#F59E0B;color:#0F172A;text-decoration:none;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:800">KDS Cucina</a>
</div>
"""


def sanitize_remote_html(html: str) -> str:
    """Inject LAN tool links into remote admin without breaking JS."""
    if "totem-lan-links" in html:
        return html
    if "</body>" in html:
        return html.replace("</body>", INJECT_BAR + "</body>", 1)
    return html + INJECT_BAR


def register_remote_admin(app: FastAPI) -> None:
    assets_dir = REMOTE_ADMIN_DIR / "assets"
    if not assets_dir.exists():
        try:
            assets_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logger.warning("Could not create remote admin assets dir: %s", e)

    index_path = REMOTE_ADMIN_DIR / "index.html"
    hub_path = ROOT_DIR / "static" / "hub" / "index.html"
    logger.info(
        "[RemoteAdmin] Initialized. Index path: %s (exists: %s), Assets dir: %s (exists: %s)",
        index_path,
        index_path.is_file(),
        assets_dir,
        assets_dir.is_dir(),
    )

    @app.get("/hub", include_in_schema=False)
    @app.get("/hub/", include_in_schema=False)
    async def hub_page():
        if hub_path.is_file():
            return HTMLResponse(hub_path.read_text(encoding="utf-8"), media_type="text/html; charset=utf-8")
        raise HTTPException(status_code=404, detail="Hub non trovato")

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
        file_exists = index_path.is_file()
        assets_exists = assets_dir.is_dir()
        logger.info(
            "[RemoteAdmin] Serving index. Path: %s (exists: %s), Assets dir: %s (exists: %s)",
            index_path,
            file_exists,
            assets_dir,
            assets_exists,
        )
        if not file_exists:
            logger.error("[RemoteAdmin] Index file missing at %s", index_path)
            raise HTTPException(status_code=404, detail="Pannello remoto non trovato")

        raw = index_path.read_text(encoding="utf-8")
        sanitized = sanitize_remote_html(raw)
        logger.info(
            "[RemoteAdmin] HTML length - raw: %d chars, sanitized: %d chars",
            len(raw),
            len(sanitized),
        )
        return HTMLResponse(sanitized, media_type="text/html; charset=utf-8")

    @app.get("/remote/{full_path:path}", include_in_schema=False)
    async def serve_remote_subroutes(full_path: str):
        candidate = REMOTE_ADMIN_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        if index_path.is_file():
            raw = index_path.read_text(encoding="utf-8")
            return HTMLResponse(sanitize_remote_html(raw), media_type="text/html; charset=utf-8")
        raise HTTPException(status_code=404, detail="Pannello remoto non trovato")

    if assets_dir.is_dir():
        app.mount("/remote/assets", StaticFiles(directory=str(assets_dir)), name="remote_admin_assets")
    else:
        logger.warning("[RemoteAdmin] Assets directory missing: %s", assets_dir)
