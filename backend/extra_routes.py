"""Extra admin routes that were dropped during the server.py revert."""
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException


def register_extra_routes(api_router: APIRouter, db, verify_token, serialize_doc, GlobalOptionGroup, GlobalOptionGroupCreate, BackupData, bcrypt):
    @api_router.get("/global-groups", response_model=list[GlobalOptionGroup])
    async def get_global_groups():
        return [GlobalOptionGroup(**serialize_doc(g)) for g in await db.global_groups.find().to_list(1000)]

    @api_router.post("/admin/global-groups", response_model=GlobalOptionGroup)
    async def create_global_group(group: GlobalOptionGroupCreate, username: str = Depends(verify_token)):
        d = group.model_dump()
        r = await db.global_groups.insert_one(d)
        return GlobalOptionGroup(**serialize_doc(await db.global_groups.find_one({"_id": r.inserted_id})))

    @api_router.put("/admin/global-groups/{group_id}", response_model=GlobalOptionGroup)
    async def update_global_group(group_id: str, group: GlobalOptionGroupCreate, username: str = Depends(verify_token)):
        await db.global_groups.update_one({"_id": ObjectId(group_id)}, {"$set": group.model_dump()})
        updated = await db.global_groups.find_one({"_id": ObjectId(group_id)})
        if not updated:
            raise HTTPException(status_code=404, detail="Group not found")
        return GlobalOptionGroup(**serialize_doc(updated))

    @api_router.delete("/admin/global-groups/{group_id}")
    async def delete_global_group(group_id: str, username: str = Depends(verify_token)):
        r = await db.global_groups.delete_one({"_id": ObjectId(group_id)})
        if r.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Group not found")
        return {"message": "Deleted successfully"}

    @api_router.post("/admin/sync-backup")
    async def sync_backup(backup: BackupData, username: str = Depends(verify_token)):
        if backup.settings:
            await db.settings.update_one({}, {"$set": backup.settings}, upsert=True)
        if backup.categories is not None:
            await db.categories.delete_many({})
            if backup.categories:
                for c in backup.categories:
                    c.pop("id", None)
                    c.pop("_id", None)
                await db.categories.insert_many(backup.categories)
        if backup.products is not None:
            await db.products.delete_many({})
            if backup.products:
                for p in backup.products:
                    p.pop("id", None)
                    p.pop("_id", None)
                await db.products.insert_many(backup.products)
        if backup.global_groups is not None:
            await db.global_groups.delete_many({})
            if backup.global_groups:
                for g in backup.global_groups:
                    g.pop("id", None)
                    g.pop("_id", None)
                await db.global_groups.insert_many(backup.global_groups)
        return {"message": "Backup synchronized successfully"}

    @api_router.post("/admin/scan-printers")
    @api_router.get("/admin/scan-printers")
    async def scan_printers_endpoint(username: str = Depends(verify_token)):
        current = await db.settings.find_one() or {}
        known = current.get("known_printers", [])
        devices = [{"name": p, "address": p, "id": p, "type": "classic"} for p in known]
        return {"devices": devices, "settings": serialize_doc(current) if current else {}, "message": f"Trovati {len(devices)} dispositivi"}

    @api_router.post("/admin/seed")
    async def seed_database(force: bool = False):
        existing = await db.categories.count_documents({})
        if existing > 0 and not force:
            return {"message": "Database already seeded"}
        if force:
            await db.categories.delete_many({})
            await db.products.delete_many({})
            await db.orders.delete_many({})
            await db.admin_users.delete_many({})
            await db.settings.delete_many({})
        await db.settings.insert_one({
            "restaurant_name": "TOTEM RISTORANTE",
            "logo": "",
            "auto_print_courtesy": True,
            "auto_print_kitchen": True,
            "order_reset_mode": "daily",
            "reset_time": "06:00",
            "last_reset_at": None,
            "admin_pin": "1234",
            "updated_at": datetime.utcnow(),
        })
        password_hash = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
        await db.admin_users.insert_one({"username": "admin", "password_hash": password_hash, "created_at": datetime.utcnow()})
        return {"message": "Database seeded successfully", "admin_username": "admin", "admin_password": "admin123"}
