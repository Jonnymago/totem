"""Remote admin panel routes — import this from server.py"""
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
REMOTE_ADMIN_DIR = ROOT_DIR / "static" / "remote"


def sanitize_remote_html(html: str) -> str:
    """Sanitizza minimamente l'HTML del pannello remoto senza alterare blocchi JS o rompere la sintassi."""
    # Nessuna regex distruttiva su funzioni JavaScript. Ritorna l'HTML integro.
    return html


def register_remote_admin(app: FastAPI) -> None:
    assets_dir = REMOTE_ADMIN_DIR / "assets"
    if not assets_dir.exists():
        try:
            assets_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logger.warning("Could not create remote admin assets dir: %s", e)

    index_path = REMOTE_ADMIN_DIR / "index.html"
    logger.info(
        "[RemoteAdmin] Initialized. Index path: %s (exists: %s), Assets dir: %s (exists: %s)",
        index_path,
        index_path.is_file(),
        assets_dir,
        assets_dir.is_dir(),
    )

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

    if assets_dir.is_dir():
        app.mount("/remote/assets", StaticFiles(directory=str(assets_dir)), name="remote_admin_assets")
    else:
        logger.warning("[RemoteAdmin] Assets directory missing: %s", assets_dir)
