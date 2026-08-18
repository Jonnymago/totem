"""Remote admin panel routes — import this from server.py"""
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

ROOT_DIR = Path(__file__).parent
REMOTE_ADMIN_DIR = ROOT_DIR / "static" / "remote"


def register_remote_admin(app: FastAPI) -> None:
    """Register the single canonical Remote Admin application.

    The backend/static/remote directory is the source of truth. Keeping one
    canonical location prevents the remote web panel and the embedded APK
    bundle from silently diverging.
    """
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

    if REMOTE_ADMIN_DIR.is_dir():
        app.mount(
            "/remote/assets",
            StaticFiles(directory=str(REMOTE_ADMIN_DIR)),
            name="remote_admin_assets",
        )
