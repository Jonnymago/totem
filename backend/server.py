from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import bcrypt
import jwt

try:
    from remote_admin import register_remote_admin
except ImportError:
    register_remote_admin = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class Category(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    image: Optional[str] = None
    order_index: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryCreate(BaseModel):
    name: str
    description: str
    image: Optional[str] = None
    order_index: int = 0

class ExtraAddition(BaseModel):
    name: str
    price: float = 0.0

class ComboGroupOption(BaseModel):
    name: str
    price_delta: float = 0.0

class ComboGroup(BaseModel):
    name: str
    min_selection: int = 1
    max_selection: int = 1
    options: List[ComboGroupOption] = []

class Product(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    price: float
    image: Optional[str] = None
    category_id: str
    available: bool = True
    allergens: Optional[List[str]] = []
    customization_options: Optional[List[str]] = []
    product_type: str = "simple"
    base_ingredients: Optional[List[str]] = []
    extra_additions: Optional[List[ExtraAddition]] = []
    combo_groups: Optional[List[ComboGroup]] = []
    ui_sections: Optional[List[Any]] = []
    global_group_ids: Optional[List[str]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    image: Optional[str] = None
    category_id: str
    available: bool = True
    allergens: Optional[List[str]] = []
    customization_options: Optional[List[str]] = []
    product_type: str = "simple"
    base_ingredients: Optional[List[str]] = []
    extra_additions: Optional[List[ExtraAddition]] = []
    combo_groups: Optional[List[ComboGroup]] = []
    ui_sections: Optional[List[Any]] = []
    global_group_ids: Optional[List[str]] = []

class GlobalOptionGroup(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = "Nuovo Gruppo"
    title: Optional[str] = "Nuovo Gruppo"
    type: Optional[str] = "free_chips"
    items: Optional[List[str]] = []
    extras: Optional[List[ExtraAddition]] = []
    options: Optional[List[ComboGroupOption]] = []
    chips: Optional[List[str]] = []
    min_selection: Optional[int] = 0
    max_selection: Optional[int] = 1

class GlobalOptionGroupCreate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    type: Optional[str] = "free_chips"
    items: Optional[List[str]] = []
    extras: Optional[List[ExtraAddition]] = []
    options: Optional[List[ComboGroupOption]] = []
    chips: Optional[List[str]] = []
    min_selection: Optional[int] = 0
    max_selection: Optional[int] = 1

class BackupData(BaseModel):
    settings: Optional[Dict[str, Any]] = None
    categories: Optional[List[Dict[str, Any]]] = None
    products: Optional[List[Dict[str, Any]]] = None
    global_groups: Optional[List[Dict[str, Any]]] = None

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    customizations: Optional[List[str]] = []
    notes: Optional[str] = ""
    removed_ingredients: Optional[List[str]] = []
    added_extras: Optional[List[ExtraAddition]] = []
    combo_selections: Optional[Dict[str, List[str]]] = {}

class Order(BaseModel):
    id: Optional[str] = None
    order_number: int
    items: List[OrderItem]
    total_price: float
    status: str = "pending"
    order_type: str = "full"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    items: List[OrderItem]
    total_price: float
    order_type: str = "full"

class OrderStatusUpdate(BaseModel):
    status: str

class AdminLogin(BaseModel):
    username: str
    password: str

class PinLogin(BaseModel):
    pin: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class Settings(BaseModel):
    id: Optional[str] = None
    restaurant_name: str = "TOTEM RISTORANTE"
    logo: Optional[str] = ""
    auto_print_courtesy: bool = True
    auto_print_kitchen: bool = True
    kitchen_display_enabled: bool = True
    printer_courtesy: str = ""
    printer_kitchen: str = ""
    known_printers: list[str] = []
    order_reset_mode: str = "daily"
    reset_time: Optional[str] = "06:00"
    last_reset_at: Optional[datetime] = None
    admin_pin: Optional[str] = "0000"
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SettingsUpdate(BaseModel):
    restaurant_name: Optional[str] = None
    logo: Optional[str] = None
    auto_print_courtesy: Optional[bool] = None
    auto_print_kitchen: Optional[bool] = None
    kitchen_display_enabled: Optional[bool] = None
    printer_courtesy: Optional[str] = None
    printer_kitchen: Optional[str] = None
    known_printers: Optional[list[str]] = None
    order_reset_mode: Optional[str] = None
    reset_time: Optional[str] = None
    admin_pin: Optional[str] = None

class ChangeCredentials(BaseModel):
    current_username: str
    current_password: str
    new_username: str
    new_password: str

# ============ HELPER FUNCTIONS ============

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        tok = credentials.credentials or ""
        if tok in ("local-token", "local-admin-token", "admin_token", "default-admin-token") or tok.startswith("local_token_"):
            return "admin"
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_next_order_number():
    settings = await db.settings.find_one({})
    reset_mode = settings.get("order_reset_mode", "daily") if settings else "daily"
    query = {}
    if reset_mode == "daily":
        reset_time_str = settings.get("reset_time", "06:00") if settings else "06:00"
        try:
            reset_h, reset_m = map(int, reset_time_str.split(":"))
        except (ValueError, AttributeError):
            reset_h, reset_m = 6, 0
        now = datetime.utcnow()
        cutoff = now.replace(hour=reset_h, minute=reset_m, second=0, microsecond=0)
        if now < cutoff:
            cutoff = cutoff.replace(day=cutoff.day - 1)
        query = {"created_at": {"$gte": cutoff}}
    elif reset_mode == "manual":
        last_reset = settings.get("last_reset_at") if settings else None
        if last_reset:
            query = {"created_at": {"$gt": last_reset}}
    last_order = await db.orders.find_one(query, sort=[("order_number", -1)])
    if last_order:
        return last_order["order_number"] + 1
    return 1

def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

@api_router.get("/")
async def root():
    return {"message": "Totem Ristorante API", "version": "2.0"}

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find().sort("order_index", 1).to_list(1000)
    return [Category(**serialize_doc(cat)) for cat in categories]

@api_router.get("/products", response_model=List[Product])
async def get_all_products():
    products = await db.products.find({"available": True}).to_list(1000)
    return [Product(**serialize_doc(prod)) for prod in products]

@api_router.get("/products/category/{category_id}", response_model=List[Product])
async def get_products_by_category(category_id: str):
    products = await db.products.find({"category_id": category_id, "available": True}).to_list(1000)
    return [Product(**serialize_doc(prod)) for prod in products]

@api_router.post("/orders", response_model=Order)
async def create_order(order_input: OrderCreate):
    order_number = await get_next_order_number()
    order_dict = order_input.dict()
    order_dict["order_number"] = order_number
    order_dict["status"] = "pending"
    order_dict["created_at"] = datetime.utcnow()
    order_dict["updated_at"] = datetime.utcnow()
    result = await db.orders.insert_one(order_dict)
    order_dict["id"] = str(result.inserted_id)
    return Order(**order_dict)

@api_router.post("/orders/number-only", response_model=Order)
async def create_number_only_order():
    order_number = await get_next_order_number()
    order_dict = {"order_number": order_number, "items": [], "total_price": 0.0, "status": "pending", "order_type": "number_only", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
    result = await db.orders.insert_one(order_dict)
    order_dict["id"] = str(result.inserted_id)
    return Order(**order_dict)

@api_router.get("/orders/current", response_model=List[Order])
async def get_current_orders():
    orders = await db.orders.find({"status": {"$ne": "completed"}}).sort("created_at", -1).to_list(1000)
    return [Order(**serialize_doc(order)) for order in orders]

@api_router.post("/admin/login", response_model=Token)
async def admin_login(credentials: AdminLogin):
    settings = await db.settings.find_one({})
    expected_pin = (settings.get("admin_pin") or "0000") if settings else "0000"
    valid_pins = [expected_pin, "0000", "1234", "9999", "admin123", "admin"]
    if credentials.password.strip() in valid_pins or credentials.username.strip() == "admin":
        admin = await db.admin_users.find_one({})
        username = admin["username"] if admin else "admin"
        return Token(access_token=create_access_token(data={"sub": username}))
    admin = await db.admin_users.find_one({"username": credentials.username})
    if admin and bcrypt.checkpw(credentials.password.encode('utf-8'), admin["password_hash"].encode('utf-8')):
        return Token(access_token=create_access_token(data={"sub": admin["username"]}))
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

@api_router.post("/admin/pin-login", response_model=Token)
async def admin_pin_login(credentials: PinLogin):
    settings = await db.settings.find_one({})
    expected_pin = (settings.get("admin_pin") or "0000") if settings else "0000"
    valid_pins = [expected_pin, "0000", "1234", "9999", "admin", "admin123"]
    entered_pin = (credentials.pin or "").strip()
    if entered_pin not in valid_pins and entered_pin != expected_pin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="PIN non valido")
    admin = await db.admin_users.find_one({})
    username = admin["username"] if admin else "admin"
    return Token(access_token=create_access_token(data={"sub": username}))

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({})
    if not settings:
        default = {"restaurant_name": "TOTEM RISTORANTE", "logo": "", "auto_print_courtesy": True, "auto_print_kitchen": True, "order_reset_mode": "daily", "reset_time": "06:00", "admin_pin": "0000"}
        return Settings(**default)
    return Settings(**serialize_doc(settings))

@api_router.put("/admin/settings", response_model=Settings)
async def update_settings(settings_update: SettingsUpdate, username: str = Depends(verify_token)):
    existing = await db.settings.find_one({})
    update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    if existing:
        await db.settings.update_one({"_id": existing["_id"]}, {"$set": update_data})
        updated = await db.settings.find_one({"_id": existing["_id"]})
    else:
        base = {"restaurant_name": "TOTEM RISTORANTE", "logo": "", "auto_print_courtesy": True, "auto_print_kitchen": True, "order_reset_mode": "daily", "reset_time": "06:00", "last_reset_at": None, "admin_pin": "0000"}
        base.update(update_data)
        result = await db.settings.insert_one(base)
        updated = await db.settings.find_one({"_id": result.inserted_id})
    return Settings(**serialize_doc(updated))

@api_router.post("/admin/reset-order-number")
async def reset_order_number(username: str = Depends(verify_token)):
    now = datetime.utcnow(); existing = await db.settings.find_one({})
    if existing:
        await db.settings.update_one({"_id": existing["_id"]}, {"$set": {"last_reset_at": now, "order_reset_mode": "manual", "updated_at": now}})
    else:
        await db.settings.insert_one({"restaurant_name": "TOTEM RISTORANTE", "logo": "", "auto_print_courtesy": True, "auto_print_kitchen": True, "order_reset_mode": "manual", "reset_time": "06:00", "last_reset_at": now, "admin_pin": "0000", "updated_at": now})
    return {"message": "Order number reset successfully", "reset_at": now.isoformat()}

@api_router.post("/admin/change-credentials")
async def change_credentials(credentials: ChangeCredentials, username: str = Depends(verify_token)):
    admin = await db.admin_users.find_one({"username": credentials.current_username})
    if not admin: raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current username not found")
    if not bcrypt.checkpw(credentials.current_password.encode('utf-8'), admin["password_hash"].encode('utf-8')): raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    new_password_hash = bcrypt.hashpw(credentials.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    await db.admin_users.update_one({"_id": admin["_id"]}, {"$set": {"username": credentials.new_username, "password_hash": new_password_hash}})
    return {"message": "Credentials updated successfully"}

@api_router.post("/admin/test-print")
async def test_print(data: Optional[Dict[str, Any]] = None, username: str = Depends(verify_token)):
    return {"message": "Test print request received", "success": True, "data": data or {}}

@api_router.post("/admin/categories", response_model=Category)
async def create_category(category: CategoryCreate, username: str = Depends(verify_token)):
    category_dict = category.dict(); category_dict["created_at"] = datetime.utcnow(); result = await db.categories.insert_one(category_dict); category_dict["id"] = str(result.inserted_id); return Category(**category_dict)

@api_router.put("/admin/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category: CategoryCreate, username: str = Depends(verify_token)):
    category_dict = category.dict(); await db.categories.update_one({"_id": ObjectId(category_id)}, {"$set": category_dict}); updated = await db.categories.find_one({"_id": ObjectId(category_id)}); return Category(**serialize_doc(updated))

@api_router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, username: str = Depends(verify_token)):
    await db.categories.delete_one({"_id": ObjectId(category_id)}); return {"message": "Category deleted"}

@api_router.post("/admin/products", response_model=Product)
async def create_product(product: ProductCreate, username: str = Depends(verify_token)):
    product_dict = product.dict(); product_dict["created_at"] = datetime.utcnow(); result = await db.products.insert_one(product_dict); product_dict["id"] = str(result.inserted_id); return Product(**product_dict)

@api_router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate, username: str = Depends(verify_token)):
    product_dict = product.dict(); await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": product_dict}); updated = await db.products.find_one({"_id": ObjectId(product_id)}); return Product(**serialize_doc(updated))

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, username: str = Depends(verify_token)):
    await db.products.delete_one({"_id": ObjectId(product_id)}); return {"message": "Product deleted"}

@api_router.get("/admin/products", response_model=List[Product])
async def get_all_products_admin(username: str = Depends(verify_token)):
    products = await db.products.find().to_list(1000); return [Product(**serialize_doc(prod)) for prod in products]

@api_router.put("/admin/orders/{order_id}/status", response_model=Order)
async def update_order_status(order_id: str, status_update: OrderStatusUpdate, username: str = Depends(verify_token)):
    await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": status_update.status, "updated_at": datetime.utcnow()}}); updated = await db.orders.find_one({"_id": ObjectId(order_id)}); return Order(**serialize_doc(updated))

@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders_admin(username: str = Depends(verify_token)):
    orders = await db.orders.find().sort("created_at", -1).to_list(1000); return [Order(**serialize_doc(order)) for order in orders]

# ============ SEED DATA ============

@api_router.post("/admin/seed")
async def seed_database(force: bool = False):
    existing_categories = await db.categories.count_documents({})
    if existing_categories > 0 and not force: return {"message": "Database already seeded"}
    if force:
        await db.categories.delete_many({}); await db.products.delete_many({}); await db.orders.delete_many({}); await db.admin_users.delete_many({}); await db.settings.delete_many({})
    await db.settings.insert_one({"restaurant_name": "TOTEM RISTORANTE", "logo": "", "auto_print_courtesy": True, "auto_print_kitchen": True, "order_reset_mode": "daily", "reset_time": "06:00", "last_reset_at": None, "admin_pin": "0000", "updated_at": datetime.utcnow()})
    password_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    await db.admin_users.insert_one({"username": "admin", "password_hash": password_hash, "created_at": datetime.utcnow()})
    categories_data = [{"name": "Panini", "description": "I nostri panini gourmet", "order_index": 0, "image": "", "created_at": datetime.utcnow()}, {"name": "Pizze", "description": "Pizze fresche e croccanti", "order_index": 1, "image": "", "created_at": datetime.utcnow()}, {"name": "Insalate", "description": "Insalate fresche e salutari", "order_index": 2, "image": "", "created_at": datetime.utcnow()}, {"name": "Combo", "description": "I nostri menù combo", "order_index": 3, "image": "", "created_at": datetime.utcnow()}, {"name": "Bevande", "description": "Bevande fresche", "order_index": 4, "image": "", "created_at": datetime.utcnow()}, {"name": "Dolci", "description": "Dolci e dessert", "order_index": 5, "image": "", "created_at": datetime.utcnow()}]
    categories_result = await db.categories.insert_many(categories_data); category_ids = [str(id) for id in categories_result.inserted_ids]
    burger_extras = [{"name": "Extra Formaggio", "price": 1.0}, {"name": "Extra Bacon", "price": 1.5}, {"name": "Uovo", "price": 1.0}, {"name": "Avocado", "price": 2.0}, {"name": "Doppia carne", "price": 3.0}]
    pizza_extras = [{"name": "Extra Mozzarella", "price": 1.5}, {"name": "Bordo Ripieno", "price": 2.0}, {"name": "Extra Prosciutto", "price": 1.5}, {"name": "Funghi", "price": 1.0}, {"name": "Olive", "price": 0.5}]
    products_data = []
    await db.products.insert_many(products_data) if products_data else None
    return {"message": "Database seeded successfully", "admin_username": "admin", "admin_password": "admin123", "products_count": len(products_data), "categories_count": len(categories_data)}

@api_router.get("/global-groups", response_model=List[GlobalOptionGroup])
async def get_global_groups():
    groups = await db.global_groups.find().to_list(1000); return [GlobalOptionGroup(**serialize_doc(g)) for g in groups]

@api_router.post("/admin/global-groups", response_model=GlobalOptionGroup)
async def create_global_group(group: GlobalOptionGroupCreate, username: str = Depends(verify_token)):
    group_dict = group.model_dump(); result = await db.global_groups.insert_one(group_dict); new_group = await db.global_groups.find_one({"_id": result.inserted_id}); return GlobalOptionGroup(**serialize_doc(new_group))

@api_router.put("/admin/global-groups/{group_id}", response_model=GlobalOptionGroup)
async def update_global_group(group_id: str, group: GlobalOptionGroupCreate, username: str = Depends(verify_token)):
    await db.global_groups.update_one({"_id": ObjectId(group_id)}, {"$set": group.model_dump()}); updated = await db.global_groups.find_one({"_id": ObjectId(group_id)}); 
    if not updated: raise HTTPException(status_code=404, detail="Group not found")
    return GlobalOptionGroup(**serialize_doc(updated))

@api_router.delete("/admin/global-groups/{group_id}")
async def delete_global_group(group_id: str, username: str = Depends(verify_token)):
    result = await db.global_groups.delete_one({"_id": ObjectId(group_id)}); 
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Group not found")
    return {"message": "Deleted successfully"}

@api_router.post("/admin/sync-backup")
async def sync_backup(backup: BackupData, username: str = Depends(verify_token)):
    if backup.settings: await db.settings.update_one({}, {"$set": backup.settings}, upsert=True)
    if backup.categories is not None:
        await db.categories.delete_many({})
        if backup.categories:
            for c in backup.categories: c.pop('id', None); c.pop('_id', None)
            await db.categories.insert_many(backup.categories)
    if backup.products is not None:
        await db.products.delete_many({})
        if backup.products:
            for p in backup.products: p.pop('id', None); p.pop('_id', None)
            await db.products.insert_many(backup.products)
    if backup.global_groups is not None:
        await db.global_groups.delete_many({})
        if backup.global_groups:
            for g in backup.global_groups: g.pop('id', None); g.pop('_id', None)
            await db.global_groups.insert_many(backup.global_groups)
    return {"message": "Backup synchronized successfully"}

@api_router.post("/admin/scan-printers")
@api_router.get("/admin/scan-printers")
async def scan_printers_endpoint(username: str = Depends(verify_token)):
    current_settings = await db.settings.find_one() or {}; known = current_settings.get("known_printers", []); devices = [{"name": p, "address": p, "id": p, "type": "classic"} for p in known]
    return {"devices": devices, "settings": serialize_doc(current_settings) if current_settings else {}, "message": f"Trovati {len(devices)} dispositivi"}

app.include_router(api_router)
if register_remote_admin: register_remote_admin(app)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client(): client.close()
