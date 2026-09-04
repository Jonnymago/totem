"""ZIP backup export / import for Python FastAPI backend (mirrors app backup)."""
from __future__ import annotations

import base64
import io
import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from zipfile import ZIP_DEFLATED, ZipFile

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class ZipImportBody(BaseModel):
    base64: str


def _safe_id(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "_", str(value or "x"))


def _data_uri_to_bytes(value: Optional[str]) -> tuple[Optional[bytes], str]:
    if not value or not isinstance(value, str):
        return None, "png"
    m = re.match(r"^data:image/([\w+.-]+);base64,(.+)$", value.strip(), re.I | re.S)
    if m:
        ext = m.group(1).lower().replace("jpeg", "jpg")
        if ext not in ("png", "jpg", "webp", "gif"):
            ext = "png"
        try:
            return base64.b64decode(re.sub(r"\s", "", m.group(2))), ext
        except Exception:
            return None, "png"
    raw = value.strip()
    if len(raw) > 64 and re.match(r"^[A-Za-z0-9+/=\s]+$", raw[:200]):
        try:
            return base64.b64decode(re.sub(r"\s", "", raw)), "png"
        except Exception:
            return None, "png"
    return None, "png"


def register_backup_zip(api_router: APIRouter, db, verify_token) -> None:
    @api_router.get("/admin/backup.zip")
    async def export_backup_zip(username: str = Depends(verify_token)):
        settings = await db.settings.find_one({}) or {}
        categories = await db.categories.find().sort("order_index", 1).to_list(5000)
        products = await db.products.find().to_list(10000)
        groups = await db.global_groups.find().to_list(2000)
        orders = await db.orders.find().sort("created_at", -1).to_list(2000)
        glossary = await db.translation_glossary.find_one({}) or {}

        def ser(doc):
            if not doc:
                return {}
            d = dict(doc)
            if "_id" in d:
                d["id"] = str(d.pop("_id"))
            for k, v in list(d.items()):
                if hasattr(v, "isoformat"):
                    d[k] = v.isoformat()
            return d

        buf = io.BytesIO()
        with ZipFile(buf, "w", ZIP_DEFLATED) as zf:
            images_meta: Dict[str, Any] = {}
            settings_pub = ser(settings)
            settings_pub.pop("admin_pin", None)

            logo_bytes, logo_ext = _data_uri_to_bytes(settings.get("logo"))
            logo_ref = None
            if logo_bytes:
                name = f"logo.{logo_ext}"
                zf.writestr(f"images/{name}", logo_bytes)
                logo_ref = f"images/{name}"
                settings_pub["logo"] = logo_ref

            cats_out: List[Dict[str, Any]] = []
            for c in categories:
                sc = ser(c)
                b, ext = _data_uri_to_bytes(c.get("image"))
                if b:
                    name = f"cat_{_safe_id(sc.get('id', ''))}.{ext}"
                    zf.writestr(f"images/{name}", b)
                    sc["image"] = f"images/{name}"
                cats_out.append(sc)

            prods_out: List[Dict[str, Any]] = []
            for p in products:
                sp = ser(p)
                b, ext = _data_uri_to_bytes(p.get("image"))
                if b:
                    name = f"prod_{_safe_id(sp.get('id', ''))}.{ext}"
                    zf.writestr(f"images/{name}", b)
                    sp["image"] = f"images/{name}"
                prods_out.append(sp)

            manifest = {
                "version": 3,
                "app": "totem",
                "exported_at": datetime.now(timezone.utc).isoformat(),
                "settings": settings_pub,
                "categories": cats_out,
                "products": prods_out,
                "global_groups": [ser(g) for g in groups],
                "orders": [ser(o) for o in orders],
                "translation_glossary": {
                    k: v for k, v in ser(glossary).items() if k != "id"
                },
            }
            zf.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
            zf.writestr(
                "README.txt",
                "Backup Totem QuickBite (backend)\n"
                f"Creato: {manifest['exported_at']}\n"
                f"Categorie: {len(cats_out)} Prodotti: {len(prods_out)}\n",
            )

        data = buf.getvalue()
        fname = f"totem-backup-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.zip"
        return Response(
            content=data,
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{fname}"'},
        )

    @api_router.post("/admin/backup.zip")
    async def import_backup_zip(body: ZipImportBody, username: str = Depends(verify_token)):
        try:
            raw = base64.b64decode(re.sub(r"\s", "", body.base64))
        except Exception as e:
            raise HTTPException(400, f"base64 non valido: {e}")

        try:
            zf = ZipFile(io.BytesIO(raw))
        except Exception as e:
            raise HTTPException(400, f"ZIP non valido: {e}")

        try:
            manifest_raw = zf.read("manifest.json")
            manifest = json.loads(manifest_raw.decode("utf-8"))
        except Exception as e:
            raise HTTPException(400, f"manifest.json mancante o corrotto: {e}")

        def resolve_image(ref: Optional[str]) -> str:
            if not ref:
                return ""
            if isinstance(ref, str) and ref.startswith("data:image"):
                return ref
            path = str(ref).lstrip("./")
            try:
                data = zf.read(path)
            except KeyError:
                try:
                    data = zf.read(path.replace("images/", ""))
                except KeyError:
                    return ref if isinstance(ref, str) else ""
            ext = path.split(".")[-1].lower() if "." in path else "png"
            mime = {
                "png": "image/png",
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "webp": "image/webp",
                "gif": "image/gif",
            }.get(ext, "image/png")
            return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"

        settings = dict(manifest.get("settings") or {})
        if settings.get("logo"):
            settings["logo"] = resolve_image(settings.get("logo"))

        categories = []
        for c in manifest.get("categories") or []:
            cc = dict(c)
            cc["image"] = resolve_image(cc.get("image"))
            categories.append(cc)

        products = []
        for p in manifest.get("products") or []:
            pp = dict(p)
            pp["image"] = resolve_image(pp.get("image"))
            products.append(pp)

        groups = list(manifest.get("global_groups") or [])

        # Replace menu data (keep admin users)
        await db.categories.delete_many({})
        await db.products.delete_many({})
        await db.global_groups.delete_many({})

        if categories:
            for c in categories:
                c.pop("id", None)
                if c.get("_id"):
                    c.pop("_id", None)
            await db.categories.insert_many(categories)
        if products:
            for p in products:
                p.pop("id", None)
                p.pop("_id", None)
            await db.products.insert_many(products)
        if groups:
            for g in groups:
                g.pop("id", None)
                g.pop("_id", None)
            await db.global_groups.insert_many(groups)

        existing = await db.settings.find_one({})
        settings.pop("id", None)
        settings.pop("_id", None)
        # never wipe PIN from zip if empty
        if existing and not settings.get("admin_pin"):
            settings["admin_pin"] = existing.get("admin_pin")
        if existing:
            await db.settings.update_one({"_id": existing["_id"]}, {"$set": settings})
        else:
            await db.settings.insert_one(settings)

        glossary = manifest.get("translation_glossary") or {}
        if glossary:
            await db.translation_glossary.delete_many({})
            await db.translation_glossary.insert_one(glossary)

        return {
            "message": "Backup ZIP ripristinato",
            "categories": len(categories),
            "products": len(products),
            "global_groups": len(groups),
        }
