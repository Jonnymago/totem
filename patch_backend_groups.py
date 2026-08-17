import re

with open('backend/server.py', 'r') as f:
    content = f.read()

# Add GlobalOptionGroup models
models = """
class GlobalOptionGroup(BaseModel):
    id: Optional[str] = None
    name: str
    title: str
    type: str
    items: Optional[List[str]] = []
    extras: Optional[List[ExtraAddition]] = []
    options: Optional[List[ComboGroupOption]] = []

class GlobalOptionGroupCreate(BaseModel):
    name: str
    title: str
    type: str
    items: Optional[List[str]] = []
    extras: Optional[List[ExtraAddition]] = []
    options: Optional[List[ComboGroupOption]] = []

class BackupData(BaseModel):
    settings: Optional[Dict[str, Any]] = None
    categories: Optional[List[Dict[str, Any]]] = None
    products: Optional[List[Dict[str, Any]]] = None
    global_groups: Optional[List[Dict[str, Any]]] = None
"""

content = content.replace('class OrderItem(BaseModel):', models + '\nclass OrderItem(BaseModel):')

# Add endpoints for global groups
endpoints = """
# ============ GLOBAL GROUPS ============

@api_router.get("/global-groups", response_model=List[GlobalOptionGroup])
async def get_global_groups():
    groups = await db.global_groups.find().to_list(1000)
    return [GlobalOptionGroup(**serialize_doc(g)) for g in groups]

@api_router.post("/admin/global-groups", response_model=GlobalOptionGroup)
async def create_global_group(group: GlobalOptionGroupCreate, username: str = Depends(verify_token)):
    group_dict = group.model_dump()
    result = await db.global_groups.insert_one(group_dict)
    new_group = await db.global_groups.find_one({"_id": result.inserted_id})
    return GlobalOptionGroup(**serialize_doc(new_group))

@api_router.put("/admin/global-groups/{group_id}", response_model=GlobalOptionGroup)
async def update_global_group(group_id: str, group: GlobalOptionGroupCreate, username: str = Depends(verify_token)):
    await db.global_groups.update_one(
        {"_id": ObjectId(group_id)},
        {"$set": group.model_dump()}
    )
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

# ============ SYNC BACKUP ============

@api_router.post("/admin/sync-backup")
async def sync_backup(backup: BackupData, username: str = Depends(verify_token)):
    if backup.settings:
        await db.settings.update_one({}, {"$set": backup.settings}, upsert=True)
    
    if backup.categories is not None:
        await db.categories.delete_many({})
        if backup.categories:
            # Fix _id if needed, or remove id to let Mongo assign it
            for c in backup.categories:
                c.pop('id', None)
                c.pop('_id', None)
            await db.categories.insert_many(backup.categories)
            
    if backup.products is not None:
        await db.products.delete_many({})
        if backup.products:
            for p in backup.products:
                p.pop('id', None)
                p.pop('_id', None)
            await db.products.insert_many(backup.products)
            
    if backup.global_groups is not None:
        await db.global_groups.delete_many({})
        if backup.global_groups:
            for g in backup.global_groups:
                g.pop('id', None)
                g.pop('_id', None)
            await db.global_groups.insert_many(backup.global_groups)
            
    return {"message": "Backup synchronized successfully"}

"""

content = content.replace('# ============ ORDERS ============', endpoints + '\n# ============ ORDERS ============')

with open('backend/server.py', 'w') as f:
    f.write(content)
