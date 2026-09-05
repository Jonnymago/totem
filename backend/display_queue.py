"""Display Queue — digital signage + queue numbers for TV / browser / Firestick."""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse
from pydantic import BaseModel
from typing import Optional

import base64
import re
from fastapi import FastAPI, HTTPException, Request, Response
from bson import ObjectId
from datetime import datetime
from zoneinfo import ZoneInfo

UTC = ZoneInfo("UTC")

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
DISPLAY_QUEUE_DIR = ROOT_DIR / "static" / "display-queue"

_calling_number: Optional[int] = None


class CallingUpdate(BaseModel):
    number: Optional[int] = None


def register_display_queue(app: FastAPI) -> None:
    """Mount HTML page routes for Display Queue signage."""
    index_path = DISPLAY_QUEUE_DIR / "index.html"
    logger.info(
        "[DisplayQueue] Initialized. Index: %s (exists=%s)",
        index_path,
        index_path.is_file(),
    )

    queue_path = DISPLAY_QUEUE_DIR / "queue.html"

    @app.get("/queue", include_in_schema=False)
    @app.get("/queue/", include_in_schema=False)
    @app.get("/coda", include_in_schema=False)
    @app.get("/coda/", include_in_schema=False)
    async def serve_queue_screen():
        if queue_path.is_file():
            return HTMLResponse(queue_path.read_text(encoding="utf-8"), media_type="text/html; charset=utf-8")
        if index_path.is_file():
            return HTMLResponse(index_path.read_text(encoding="utf-8"), media_type="text/html; charset=utf-8")
        raise HTTPException(status_code=404, detail="Display Queue non trovato")

    @app.get("/tv", include_in_schema=False)
    @app.get("/tv.html", include_in_schema=False)
    @app.get("/signage", include_in_schema=False)
    @app.get("/display-queue", include_in_schema=False)
    @app.get("/display-queue.html", include_in_schema=False)
    async def display_queue_redirect(request: Request):
        mode = request.query_params.get("mode", "").lower()
        if mode == "queue" and queue_path.is_file():
            return HTMLResponse(queue_path.read_text(encoding="utf-8"), media_type="text/html; charset=utf-8")
        if index_path.is_file():
            return HTMLResponse(index_path.read_text(encoding="utf-8"), media_type="text/html; charset=utf-8")
        return RedirectResponse(url="/tv/", status_code=307)

    @app.get("/tv/", include_in_schema=False)
    @app.get("/display-queue/", include_in_schema=False)
    @app.get("/display-queue/index.html", include_in_schema=False)
    async def display_queue_index(request: Request):
        mode = request.query_params.get("mode", "").lower()
        if mode == "queue" and queue_path.is_file():
            return HTMLResponse(queue_path.read_text(encoding="utf-8"), media_type="text/html; charset=utf-8")
        if not index_path.is_file():
            if queue_path.is_file():
                return HTMLResponse(queue_path.read_text(encoding="utf-8"), media_type="text/html; charset=utf-8")
            raise HTTPException(status_code=404, detail="Display Queue non trovato")
        html = index_path.read_text(encoding="utf-8")
        return HTMLResponse(html, media_type="text/html; charset=utf-8")

    @app.get("/tv/{full_path:path}", include_in_schema=False)
    @app.get("/display-queue/{full_path:path}", include_in_schema=False)
    async def display_queue_assets(full_path: str):
        candidate = DISPLAY_QUEUE_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        if index_path.is_file():
            return HTMLResponse(
                index_path.read_text(encoding="utf-8"),
                media_type="text/html; charset=utf-8",
            )
        raise HTTPException(status_code=404, detail="Display Queue non trovato")


def register_display_queue_api(api_router) -> None:
    """Public API: calling number sync + signage catalog + info for remote panel & app alignment."""
    from server import db, serialize_doc, verify_token


    @api_router.get("/signage-catalog")
    async def get_signage_catalog():
        """Aggregated, real-time live data feed tailored for TV digital signage."""
        try:
            settings_doc = await db.settings.find_one({}) or {}
            calling_doc = await db.display_queue.find_one({"_id": "state"}) or {}
            
            raw_cats = await db.categories.find().sort("order_index", 1).to_list(1000)
            categories = [
                {
                    "id": str(c.get("_id", c.get("id"))),
                    "name": c.get("name", "Menù"),
                    "description": c.get("description", ""),
                    "image": c.get("image", ""),
                    "order_index": c.get("order_index", 0),
                }
                for c in raw_cats
            ]

            raw_prods = await db.products.find().to_list(2000)
            products = []
            for p in raw_prods:
                pid = str(p.get("_id", p.get("id")))
                img = p.get("image") or ""
                products.append({
                    "id": pid,
                    "name": p.get("name", ""),
                    "description": str(p.get("description", ""))[:220],
                    "price": float(p.get("price", 0.0)),
                    "category_id": str(p.get("category_id", "")),
                    "available": bool(p.get("available", True)),
                    "is_featured": bool(p.get("is_featured", False)),
                    "allergens": p.get("allergens", []) or [],
                    "has_image": bool(img),
                    "image": f"/api/signage-photo/{pid}" if img else "",
                })

            calling_num = calling_doc.get("calling_number")
            if calling_num is None:
                calling_num = _calling_number

            signage_config = settings_doc.get("signage_config") or {}
            screens = settings_doc.get("signage_screens") or []

            return {
                "restaurant_name": settings_doc.get("restaurant_name", "TOTEM RISTORANTE"),
                "logo": settings_doc.get("logo", ""),
                "accent_color": settings_doc.get("accent_color", "#E31C23"),
                "categories": categories,
                "products": products,
                "screens": screens,
                "signage_config": signage_config,
                "calling_number": calling_num,
                "timestamp": datetime.now(UTC).isoformat(),
            }
        except Exception as e:
            logger.error("[DisplayQueue] Error generating signage catalog: %s", e)
            return {
                "restaurant_name": "TOTEM",
                "categories": [],
                "products": [],
                "screens": [],
                "signage_config": {},
                "calling_number": _calling_number,
                "timestamp": datetime.now(UTC).isoformat(),
            }

    @api_router.get("/signage-photo/{product_id}")
    async def get_signage_photo(product_id: str):
        """Stream product photo as binary image directly from DB for TV Silk / Chrome."""
        try:
            p = None
            try:
                p = await db.products.find_one({"_id": ObjectId(product_id)})
            except Exception:
                p = await db.products.find_one({"id": product_id})

            if p and p.get("image"):
                raw_img = str(p["image"]).strip()
                if raw_img.startswith("data:"):
                    match = re.match(r"^data:(image\/[a-zA-Z0-9+\.-]+);base64,(.+)$", raw_img)
                    if match:
                        mime_type = match.group(1)
                        b64data = match.group(2)
                        data = base64.b64decode(b64data)
                        return Response(
                            content=data,
                            media_type=mime_type,
                            headers={"Cache-Control": "public, max-age=180"},
                        )
                elif raw_img.startswith("http://") or raw_img.startswith("https://"):
                    return RedirectResponse(url=raw_img)
        except Exception as e:
            logger.warning("[DisplayQueue] Photo decode error for %s: %s", product_id, e)

        # SVG Placeholder
        svg = """<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
            <rect width="400" height="300" fill="#18181b"/>
            <text x="200" y="150" font-family="-apple-system, sans-serif" font-size="64" text-anchor="middle" dominant-baseline="middle" fill="#52525b">🍽️</text>
        </svg>"""
        return Response(content=svg.encode("utf-8"), media_type="image/svg+xml")

    @api_router.get("/signage-settings")
    @api_router.get("/admin/signage-settings")
    async def get_signage_settings_api():
        settings = await db.settings.find_one({}) or {}
        return settings.get("signage_config") or {}

    @api_router.post("/signage-settings")
    @api_router.put("/signage-settings")
    @api_router.post("/admin/signage-settings")
    async def save_signage_settings_api(payload: dict):
        clean_payload = {k: v for k, v in payload.items() if k != "_id"}
        await db.settings.update_one(
            {},
            {"$set": {"signage_config": clean_payload, "updated_at": datetime.now(UTC)}},
            upsert=True,
        )
        return {"status": "ok", "signage_config": clean_payload}

    @api_router.post("/admin/products/{product_id}/toggle-available")
    async def toggle_product_available(product_id: str):
        """1-Click quick toggle for kitchen/floor staff to mark sold-out items."""
        query = {"_id": ObjectId(product_id)} if ObjectId.is_valid(product_id) else {"id": product_id}
        doc = await db.products.find_one(query)
        if not doc:
            raise HTTPException(status_code=404, detail="Prodotto non trovato")
        next_val = not bool(doc.get("available", True))
        await db.products.update_one(query, {"$set": {"available": next_val, "updated_at": datetime.now(UTC)}})
        return {"id": product_id, "available": next_val, "name": doc.get("name", "")}

    @api_router.get("/display-queue/calling")
    async def get_calling_number():
        global _calling_number
        try:
            doc = await db.display_queue.find_one({"_id": "state"})
            if doc and doc.get("calling_number") is not None:
                return {"number": int(doc["calling_number"])}
        except Exception as e:
            logger.warning("[DisplayQueue] get calling from db: %s", e)
        return {"number": _calling_number}

    @api_router.post("/display-queue/calling")
    async def set_calling_number(body: CallingUpdate):
        global _calling_number
        num = body.number
        if num is not None:
            try:
                num = int(num)
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail="number must be an integer")
        _calling_number = num
        try:
            await db.display_queue.update_one(
                {"_id": "state"},
                {"$set": {"calling_number": num}},
                upsert=True,
            )
        except Exception as e:
            logger.warning("[DisplayQueue] persist calling: %s", e)
        return {"number": _calling_number, "ok": True}

    @api_router.get("/display-queue/info")
    async def display_queue_info(request: Request):
        """Metadata for remote panel & app: URLs, modes, customisation (aligned with signage)."""
        base = str(request.base_url).rstrip("/")
        path = f"{base}/tv/"
        return {
            "name": "Vetrina TV & Digital Signage",
            "path": "/tv/",
            "url": path,
            "modes": {
                "full": {"url": path, "description": "Queue numbers + product signage"},
                "products": {
                    "url": f"{path}?mode=products",
                    "description": "Products only (secondary screens)",
                },
            },
            "query_params": {
                "mode": "full | products",
                "categoryId": "filter single category",
                "lang": "it | en | es | fr | de",
                "layout": "auto | 1-hero-4-grid | 2-hero-2-grid | bento | grid-4 | grid-6 | grid-8",
                "theme": "chalkboard | dark-gold | fastfood-vibrant | trattoria | fresh-emerald | steakhouse",
                "transition": "curtain-slide | fade-blur | zoom-in | flip-3d | ken-burns | slide-left",
                "rotate": "seconds per slide (default 8)",
            },
            "features": [
                "category_slide_rotation",
                "custom_product_animations",
                "video_food_porn_loop",
                "instant_price_sync",
                "smart_sold_out_reflow",
                "queue_numbers_strip",
                "upselling_ticker_banner",
            ],
            "api": {
                "signage_catalog": "/api/signage-catalog",
                "signage_photo": "/api/signage-photo/{id}",
                "signage_settings": "/api/signage-settings",
                "toggle_available": "/api/admin/products/{id}/toggle-available",
                "calling_get": "/api/display-queue/calling",
                "calling_post": "/api/display-queue/calling",
            },
        }
