"""Extra admin routes (groups, backup, printers, seed)."""
from __future__ import annotations

import logging
import secrets
from datetime import datetime
from zoneinfo import ZoneInfo

UTC = ZoneInfo("UTC")

import bcrypt
from bson import ObjectId
import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)


def register_extra_routes(api_router: APIRouter) -> None:
    from server import (
        BackupData,
        GlobalOptionGroup,
        GlobalOptionGroupCreate,
        db,
        serialize_doc,
        verify_token,
    )

    @api_router.get("/global-groups", response_model=list[GlobalOptionGroup])
    async def get_global_groups():
        return [GlobalOptionGroup(**serialize_doc(g)) for g in await db.global_groups.find().to_list(1000)]

    @api_router.post("/admin/global-groups", response_model=GlobalOptionGroup)
    async def create_global_group(group: GlobalOptionGroupCreate, username: str = Depends(verify_token)):
        result = await db.global_groups.insert_one(group.model_dump())
        return GlobalOptionGroup(**serialize_doc(await db.global_groups.find_one({"_id": result.inserted_id})))

    @api_router.put("/admin/global-groups/{group_id}", response_model=GlobalOptionGroup)
    async def update_global_group(
        group_id: str, group: GlobalOptionGroupCreate, username: str = Depends(verify_token)
    ):
        await db.global_groups.update_one({"_id": ObjectId(group_id)}, {"$set": group.model_dump()})
        updated = await db.global_groups.find_one({"_id": ObjectId(group_id)})
        if not updated:
            raise HTTPException(status_code=404, detail="Group not found")
        return GlobalOptionGroup(**serialize_doc(updated))

    @api_router.delete("/admin/global-groups/{group_id}")
    async def delete_global_group(group_id: str, username: str = Depends(verify_token)):
        result = await db.global_groups.delete_one({"_id": ObjectId(group_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Group not found")
        return {"message": "Deleted successfully"}

    @api_router.post("/admin/sync-backup")
    async def sync_backup(backup: BackupData, username: str = Depends(verify_token)):
        if backup.settings:
            await db.settings.update_one({}, {"$set": backup.settings}, upsert=True)
        if backup.categories is not None:
            await db.categories.delete_many({})
            if backup.categories:
                for item in backup.categories:
                    item.pop("id", None)
                    item.pop("_id", None)
                await db.categories.insert_many(backup.categories)
        if backup.products is not None:
            await db.products.delete_many({})
            if backup.products:
                for item in backup.products:
                    item.pop("id", None)
                    item.pop("_id", None)
                await db.products.insert_many(backup.products)
        if backup.global_groups is not None:
            await db.global_groups.delete_many({})
            if backup.global_groups:
                for item in backup.global_groups:
                    item.pop("id", None)
                    item.pop("_id", None)
                await db.global_groups.insert_many(backup.global_groups)
        return {"message": "Backup synchronized successfully"}

    optional_bearer = HTTPBearer(auto_error=False)

    async def require_admin_unless_bootstrap(
        credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    ) -> str:
        admin_count = await db.admin_users.count_documents({})
        if admin_count == 0:
            return "bootstrap"
        if not credentials:
            raise HTTPException(status_code=401, detail="Not authenticated")
        from server import ALGORITHM, SECRET_KEY
        try:
            payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if not username:
                raise HTTPException(status_code=401, detail="Invalid token")
            return username
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

    @api_router.post("/admin/seed")
    async def seed_database(force: bool = False, username: str = Depends(require_admin_unless_bootstrap)):
        existing = await db.categories.count_documents({})
        if existing > 0 and not force:
            return {"message": "Database already seeded"}
        if force:
            await db.categories.delete_many({})
            await db.products.delete_many({})
            await db.orders.delete_many({})
            await db.admin_users.delete_many({})
            await db.settings.delete_many({})

        await db.settings.insert_one(
            {
                "restaurant_name": "TOTEM RISTORANTE",
                "logo": "",
                "auto_print_courtesy": True,
                "auto_print_kitchen": True,
                "order_reset_mode": "daily",
                "reset_time": "06:00",
                "last_reset_at": None,
                "admin_pin": None,
                "updated_at": datetime.now(UTC),
            }
        )
        generated_password = secrets.token_urlsafe(12)
        logger.info("Seed completed. Generated admin password (store securely): %s", generated_password)
        password_hash = bcrypt.hashpw(generated_password.encode(), bcrypt.gensalt()).decode()
        await db.admin_users.insert_one(
            {"username": "admin", "password_hash": password_hash, "created_at": datetime.now(UTC)}
        )
        return {"message": "Database seeded successfully", "admin_username": "admin"}

    # --- Totem Kiosk Hardware REST API Endpoints ---
    @api_router.get("/kiosk/status")
    async def get_kiosk_status():
        cfg = await db.kiosk_config.find_one({}) or {}
        return {
            "status": "active" if cfg.get("kioskEnabled", True) else "disabled",
            "kiosk_mode": cfg.get("kioskEnabled", True),
            "immersive_fullscreen": cfg.get("immersiveFullscreen", True),
            "screen_brightness": cfg.get("brightnessLevel", 90),
            "screensaver_mode": cfg.get("screensaverMode", "promo_banner"),
            "inactivity_timeout_sec": cfg.get("inactivityTimeoutSec", 60),
            "auto_reset_cart_timeout_sec": cfg.get("autoResetCartTimeoutSec", 45),
            "night_dimming_enabled": cfg.get("nightDimmingEnabled", True),
            "uptime_seconds": 3600,
            "version": "1.2.10",
            "timestamp": datetime.now(UTC).isoformat(),
        }

    @api_router.get("/kiosk/config")
    async def get_kiosk_config_endpoint():
        cfg = await db.kiosk_config.find_one({})
        if not cfg:
            return {
                "kioskEnabled": True,
                "immersiveFullscreen": True,
                "keepScreenAwake": True,
                "autoStartOnBoot": True,
                "inactivityTimeoutSec": 60,
                "screensaverMode": "promo_banner",
                "autoResetCartOnInactivity": True,
                "autoResetCartTimeoutSec": 45,
                "brightnessLevel": 90,
                "nightDimmingEnabled": True,
                "nightDimmingStart": "23:00",
                "nightDimmingEnd": "07:00",
                "screenOrientation": "portrait",
                "secretTapsCount": 7,
                "secretTriggerLocation": "top-right",
                "requirePinForExit": True,
                "restApiEnabled": True,
            }
        cfg.pop("_id", None)
        return cfg

    @api_router.post("/kiosk/config")
    async def save_kiosk_config_endpoint(config: dict, username: str = Depends(verify_token)):
        config.pop("_id", None)
        await db.kiosk_config.update_one({}, {"$set": config}, upsert=True)
        return {"status": "ok", "message": "Kiosk configuration saved"}

    @api_router.post("/kiosk/wake")
    async def kiosk_wake():
        logger.info("Totem Kiosk API: wake screen triggered")
        return {"status": "ok", "action": "wake", "timestamp": datetime.now(UTC).isoformat()}

    @api_router.post("/kiosk/screensaver")
    async def kiosk_screensaver():
        logger.info("Totem Kiosk API: screensaver triggered")
        return {"status": "ok", "action": "screensaver", "timestamp": datetime.now(UTC).isoformat()}

    @api_router.post("/kiosk/brightness")
    async def kiosk_set_brightness(payload: dict):
        level = payload.get("brightness", 90)
        await db.kiosk_config.update_one({}, {"$set": {"brightnessLevel": level}}, upsert=True)
        return {"status": "ok", "brightness": level}

    @api_router.post("/kiosk/reload")
    async def kiosk_reload():
        logger.info("Totem Kiosk API: reload requested")
        return {"status": "ok", "action": "reload", "timestamp": datetime.now(UTC).isoformat()}

