"""Remote admin panel routes — import this from server.py"""
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

ROOT_DIR = Path(__file__).parent
REMOTE_ADMIN_DIR = ROOT_DIR / "static" / "remote"
REMOTE_ADMIN_DIR.mkdir(parents=True, exist_ok=True)

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
        if not index_path.exists():
            # Fallback to public/remote/index.html if exists
            fallback = ROOT_DIR.parent / "public" / "remote" / "index.html"
            if fallback.exists():
                return FileResponse(fallback, media_type="text/html; charset=utf-8")
            raise HTTPException(status_code=404, detail="Pannello remoto non trovato")
        return FileResponse(index_path, media_type="text/html; charset=utf-8")

    if REMOTE_ADMIN_DIR.exists():
        app.mount("/remote/assets", StaticFiles(directory=str(REMOTE_ADMIN_DIR)), name="remote_admin_assets")
