"""Remote admin panel routes — import this from server.py"""
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
REMOTE_ADMIN_DIR = ROOT_DIR / "static" / "remote"


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
        return FileResponse(index_path, media_type="text/html; charset=utf-8")

    assets_dir = REMOTE_ADMIN_DIR / "assets"
    if assets_dir.is_dir():
        app.mount("/remote/assets", StaticFiles(directory=str(assets_dir)), name="remote_admin_assets")
    else:
        logger.warning("Remote admin assets directory missing: %s", assets_dir)
