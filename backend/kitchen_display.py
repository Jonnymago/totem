"""Kitchen Display System (KDS) — web page for TV / tablet on LAN."""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
KITCHEN_DIR = ROOT_DIR / "static" / "kitchen"


def register_kitchen_display(app: FastAPI) -> None:
    index_path = KITCHEN_DIR / "index.html"
    logger.info("[KDS] Initialized. Index: %s (exists=%s)", index_path, index_path.is_file())

    @app.get("/kitchen", include_in_schema=False)
    @app.get("/kitchen/", include_in_schema=False)
    @app.get("/kds", include_in_schema=False)
    @app.get("/kds/", include_in_schema=False)
    @app.get("/reparto", include_in_schema=False)
    @app.get("/reparto/", include_in_schema=False)
    @app.get("/kitchen.html", include_in_schema=False)
    @app.get("/kitchen/index.html", include_in_schema=False)
    async def kitchen_index(request: Request):
        if not index_path.is_file():
            raise HTTPException(status_code=404, detail="Kitchen KDS non trovato")
        return HTMLResponse(index_path.read_text(encoding="utf-8"), media_type="text/html; charset=utf-8")

    @app.get("/kitchen/{full_path:path}", include_in_schema=False)
    async def kitchen_assets(full_path: str):
        candidate = KITCHEN_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        if index_path.is_file():
            return HTMLResponse(index_path.read_text(encoding="utf-8"), media_type="text/html; charset=utf-8")
        raise HTTPException(status_code=404, detail="Kitchen KDS non trovato")
