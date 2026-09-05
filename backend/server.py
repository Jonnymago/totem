from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

import bcrypt
import jwt
import logging
import os

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

try:
    from remote_admin import register_remote_admin
except ImportError:
    register_remote_admin = None

try:
    from extra_routes import register_extra_routes
except ImportError:
    register_extra_routes = None

try:
    from display_queue import register_display_queue, register_display_queue_api
except ImportError:
    register_display_queue = None
    register_display_queue_api = None

try:
    from kitchen_display import register_kitchen_display
except ImportError:
    register_kitchen_display = None

try:
    from backup_zip import register_backup_zip
except ImportError:
    register_backup_zip = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "totem")]

_DEFAULT_JWT = "your-secret-key-change-in-production"
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", _DEFAULT_JWT)
if SECRET_KEY == _DEFAULT_JWT:
    logging.getLogger(__name__).warning(
        "JWT_SECRET_KEY is using the insecure default. Set it in backend/.env for production."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480
ROME = ZoneInfo("Europe/Rome")
UTC = ZoneInfo("UTC")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    client.close()


security = HTTPBearer()
app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")


class Category(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    image: Optional[str] = None
    order_index: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


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
    is_featured: Optional[bool] = False
    allergens: Optional[List[str]] = []
    customization_options: Optional[List[str]] = []
    product_type: str = "simple"
    base_ingredients: Optional[List[str]] = []
    extra_additions: Optional[List[ExtraAddition]] = []
    combo_groups: Optional[List[ComboGroup]] = []
    ui_sections: Optional[List[Any]] = []
    global_group_ids: Optional[List[str]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    image: Optional[str] = None
    category_id: str
    available: bool = True
    is_featured: Optional[bool] = False
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
    translation_glossary: Optional[Dict[str, Any]] = None


class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    category_id: Optional[str] = None
    product_category_id: Optional[str] = None
    customizations: Optional[List[str]] = []
    notes: Optional[str] = ""
    removed_ingredients: Optional[List[str]] = []
    added_extras: Optional[List[ExtraAddition]] = []
    combo_selections: Optional[Dict[str, List[str]]] = {}


class Order(BaseModel):
    id: Optional[str] = None
    order_number: int
    order_prefix: Optional[str] = None
    items: List[OrderItem]
    total_price: float
    status: str = "pending"
    order_type: str = "full"
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class OrderCreate(BaseModel):
    items: List[OrderItem]
    total_price: float
    order_type: str = "full"
    order_prefix: Optional[str] = None


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


class DepartmentPrinter(BaseModel):
    id: Optional[str] = None
    name: str = "Reparto"
    address: str = ""
    category_ids: List[str] = []
    enabled: bool = True


class DepartmentKdsModel(BaseModel):
    id: Optional[str] = None
    name: str = "Reparto"
    assigned_category_ids: List[str] = []
    icon: Optional[str] = "restaurant"
    printer_id: Optional[str] = None


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
    department_printers: List[DepartmentPrinter] = []
    department_kds: List[DepartmentKdsModel] = []
    order_reset_mode: str = "daily"
    reset_time: Optional[str] = "06:00"
    last_reset_at: Optional[datetime] = None
    admin_pin: Optional[str] = None
    accent_color: Optional[str] = None
    remote_ip_override: Optional[str] = None
    totem_role: str = "master"
    master_host: Optional[str] = None
    order_prefix: Optional[str] = None
    display_queue_config: Optional[dict] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class SettingsUpdate(BaseModel):
    restaurant_name: Optional[str] = None
    logo: Optional[str] = None
    auto_print_courtesy: Optional[bool] = None
    auto_print_kitchen: Optional[bool] = None
    kitchen_display_enabled: Optional[bool] = None
    printer_courtesy: Optional[str] = None
    printer_kitchen: Optional[str] = None
    known_printers: Optional[list[str]] = None
    department_printers: Optional[List[DepartmentPrinter]] = None
    department_kds: Optional[List[DepartmentKdsModel]] = None
    order_reset_mode: Optional[str] = None
    reset_time: Optional[str] = None
    admin_pin: Optional[str] = None
    accent_color: Optional[str] = None
    remote_ip_override: Optional[str] = None
    totem_role: Optional[str] = None
    master_host: Optional[str] = None
    order_prefix: Optional[str] = None
    display_queue_config: Optional[dict] = None


class ChangeCredentials(BaseModel):
    current_username: str
    current_password: str
    new_username: str
    new_password: str


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_next_order_number() -> int:
    settings = await db.settings.find_one({})
    reset_mode = settings.get("order_reset_mode", "daily") if settings else "daily"
    query: Dict[str, Any] = {}
    if reset_mode == "daily":
        reset_time_str = settings.get("reset_time", "06:00") if settings else "06:00"
        try:
            reset_h, reset_m = map(int, reset_time_str.split(":"))
        except (ValueError, AttributeError):
            reset_h, reset_m = 6, 0
        now_local = datetime.now(ROME)
        cutoff = now_local.replace(hour=reset_h, minute=reset_m, second=0, microsecond=0)
        if now_local < cutoff:
            cutoff -= timedelta(days=1)
        cutoff_utc = cutoff.astimezone(UTC)
        query = {"created_at": {"$gte": cutoff_utc}}
    elif reset_mode == "manual":
        last_reset = settings.get("last_reset_at") if settings else None
        if last_reset:
            query = {"created_at": {"$gt": last_reset}}
    last_order = await db.orders.find_one(query, sort=[("order_number", -1)])
    return last_order["order_number"] + 1 if last_order else 1


def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@api_router.get("/")
async def root():
    return {
        "message": "Totem Ristorante API",
        "version": "2.2",
        "screens": {
            "remote": "/remote/",
            "display_queue": "/display-queue/",
            "kitchen": "/kitchen/",
            "hub": "/hub/",
        },
    }


@api_router.get("/license")
@api_router.get("/admin/license")
async def get_license_status():
    doc = await db.license.find_one({}) or {}
    return {
        "status": doc.get("status", "unknown"),
        "planName": doc.get("planName"),
        "expiresAt": doc.get("expiresAt"),
        "verificationState": doc.get("verificationState", "app_managed"),
        "isPlayStorePurchase": doc.get("isPlayStorePurchase", False),
        "note": "La licenza Google Play è gestita sull'app Android; questo endpoint espone solo un eventuale mirror locale.",
    }


@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    cats = await db.categories.find().sort("order_index", 1).to_list(1000)
    return [Category(**serialize_doc(c)) for c in cats]


@api_router.get("/products", response_model=List[Product])
async def get_all_products():
    products = await db.products.find({"available": True}).to_list(1000)
    return [Product(**serialize_doc(p)) for p in products]


@api_router.get("/products/category/{category_id}", response_model=List[Product])
async def get_products_by_category(category_id: str):
    products = await db.products.find({"category_id": category_id, "available": True}).to_list(1000)
    return [Product(**serialize_doc(p)) for p in products]


@api_router.post("/orders", response_model=Order)
async def create_order(order_input: OrderCreate):
    order_dict = order_input.dict()
    order_dict.update(
        order_number=await get_next_order_number(),
        status="pending",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    result = await db.orders.insert_one(order_dict)
    order_dict["id"] = str(result.inserted_id)
    return Order(**order_dict)


@api_router.post("/orders/number-only", response_model=Order)
async def create_number_only_order():
    order_dict = {
        "order_number": await get_next_order_number(),
        "items": [],
        "total_price": 0.0,
        "status": "pending",
        "order_type": "number_only",
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    result = await db.orders.insert_one(order_dict)
    order_dict["id"] = str(result.inserted_id)
    return Order(**order_dict)


@api_router.get("/orders/current", response_model=List[Order])
async def get_current_orders():
    orders = await db.orders.find({"status": {"$ne": "completed"}}).sort("created_at", -1).to_list(1000)
    return [Order(**serialize_doc(o)) for o in orders]


@api_router.get("/orders/next-number")
async def get_next_order_number_endpoint():
    num = await get_next_order_number()
    return {"order_number": num, "ok": True}


@api_router.post("/admin/login", response_model=Token)
async def admin_login(credentials: AdminLogin):
    admin = await db.admin_users.find_one({"username": credentials.username.strip()})
    if not admin or not bcrypt.checkpw(credentials.password.encode(), admin["password_hash"].encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return Token(access_token=create_access_token({"sub": admin["username"]}))


@api_router.post("/admin/pin-login", response_model=Token)
async def admin_pin_login(credentials: PinLogin):
    settings = await db.settings.find_one({})
    if not settings:
        settings = {}
    expected_pin = str(settings.get("admin_pin") or "").strip() or "1234"
    entered = (credentials.pin or "").strip()
    allowed = {expected_pin}
    if expected_pin in ("", "1234", "0000"):
        allowed.update({"1234", "0000"})
    if entered not in allowed:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="PIN non valido")
    admin = await db.admin_users.find_one({})
    username = admin["username"] if admin else "admin"
    return Token(access_token=create_access_token({"sub": username}))


def _settings_or_default(doc):
    default_dq = {
        "show_only_number": False,
        "show_header": True,
        "show_clock": True,
        "show_ready_list": True,
        "show_prep_list": True,
        "show_instruction": True,
        "number_size": "gigantic",
        "theme": "dark-pure",
        "sound_enabled": True,
        "call_label": "",
        "instruction_text": "",
        "show_prefix": False,
    }
    if doc:
        d = serialize_doc(doc)
        if not d.get("display_queue_config"):
            d["display_queue_config"] = default_dq
        else:
            d["display_queue_config"] = {**default_dq, **d["display_queue_config"]}
        return Settings(**d)
    return Settings(
        restaurant_name="TOTEM RISTORANTE",
        logo="",
        auto_print_courtesy=True,
        auto_print_kitchen=True,
        order_reset_mode="daily",
        reset_time="06:00",
        admin_pin=None,
        display_queue_config=default_dq,
    )


def _public_settings(settings: Settings) -> dict:
    data = settings.dict()
    data.pop("admin_pin", None)
    return data


@api_router.get("/settings")
async def get_settings():
    return _public_settings(_settings_or_default(await db.settings.find_one({})))


@api_router.get("/admin/settings", response_model=Settings)
async def get_admin_settings(username: str = Depends(verify_token)):
    return _settings_or_default(await db.settings.find_one({}))


@api_router.put("/admin/settings", response_model=Settings)
async def update_settings(settings_update: SettingsUpdate, username: str = Depends(verify_token)):
    existing = await db.settings.find_one({})
    data = {k: v for k, v in settings_update.dict().items() if v is not None}
    if "department_printers" in data and data["department_printers"] is not None:
        data["department_printers"] = [
            p.dict() if hasattr(p, "dict") else p for p in data["department_printers"]
        ]
    if "department_kds" in data and data["department_kds"] is not None:
        data["department_kds"] = [
            p.dict() if hasattr(p, "dict") else p for p in data["department_kds"]
        ]
    if "display_queue_config" in data and data["display_queue_config"] is not None:
        merged_dq = (existing.get("display_queue_config") or {}) if existing else {}
        merged_dq = {**merged_dq, **data["display_queue_config"]}
        data["display_queue_config"] = merged_dq
    data["updated_at"] = datetime.now(UTC)
    if existing:
        await db.settings.update_one({"_id": existing["_id"]}, {"$set": data})
        updated = await db.settings.find_one({"_id": existing["_id"]})
    else:
        base = {
            "restaurant_name": "TOTEM RISTORANTE",
            "logo": "",
            "auto_print_courtesy": True,
            "auto_print_kitchen": True,
            "kitchen_display_enabled": True,
            "order_reset_mode": "daily",
            "reset_time": "06:00",
            "last_reset_at": None,
            "admin_pin": None,
            "department_printers": [],
            "department_kds": [],
            "totem_role": "master",
        }
        base.update(data)
        result = await db.settings.insert_one(base)
        updated = await db.settings.find_one({"_id": result.inserted_id})
    return Settings(**serialize_doc(updated))


@api_router.get("/admin/department-kds")
@api_router.get("/department-kds")
async def get_department_kds_list():
    settings = _settings_or_default(await db.settings.find_one({}))
    return settings.department_kds or []


@api_router.post("/admin/department-kds")
@api_router.put("/admin/department-kds")
@api_router.post("/department-kds")
@api_router.put("/department-kds")
async def save_department_kds_list(request: Request):
    body = await request.json()
    departments = body if isinstance(body, list) else body.get("departments", [])
    now = datetime.now(UTC)
    existing = await db.settings.find_one({})
    if existing:
        await db.settings.update_one({"_id": existing["_id"]}, {"$set": {"department_kds": departments, "updated_at": now}})
    else:
        await db.settings.insert_one({"department_kds": departments, "updated_at": now})
    return departments


@api_router.post("/admin/reset-order-number")
async def reset_order_number(username: str = Depends(verify_token)):
    now = datetime.now(UTC)
    existing = await db.settings.find_one({})
    if existing:
        await db.settings.update_one({"_id": existing["_id"]}, {"$set": {"last_reset_at": now, "order_reset_mode": "manual", "updated_at": now}})
    else:
        await db.settings.insert_one({
            "restaurant_name": "TOTEM RISTORANTE",
            "logo": "",
            "auto_print_courtesy": True,
            "auto_print_kitchen": True,
            "order_reset_mode": "manual",
            "reset_time": "06:00",
            "last_reset_at": now,
            "admin_pin": None,
            "updated_at": now,
        })
    await db.orders.delete_many({})
    return {"message": "Order number and orders reset successfully", "reset_at": now.isoformat()}


@api_router.post("/admin/change-credentials")
async def change_credentials(credentials: ChangeCredentials, username: str = Depends(verify_token)):
    admin = await db.admin_users.find_one({"username": credentials.current_username})
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current username not found")
    if not bcrypt.checkpw(credentials.current_password.encode(), admin["password_hash"].encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    new_hash = bcrypt.hashpw(credentials.new_password.encode(), bcrypt.gensalt()).decode()
    await db.admin_users.update_one({"_id": admin["_id"]}, {"$set": {"username": credentials.new_username, "password_hash": new_hash}})
    return {"message": "Credentials updated successfully"}


@api_router.post("/admin/test-print")
async def test_print(data: Optional[Dict[str, Any]] = None, username: str = Depends(verify_token)):
    payload = data or {}
    address = payload.get("address") or payload.get("printer") or ""
    lines = payload.get("lines") or [
        "=== TEST STAMPA TOTEM ===",
        "Totem QuickBite",
        datetime.now(ROME).strftime("%d/%m/%Y %H:%M"),
        "------------------------",
        "Stampa di prova OK",
    ]
    if address:
        try:
            import httpx

            BT_BRIDGE_URL = os.environ.get("BT_BRIDGE_URL", "http://127.0.0.1:8765")
            async with httpx.AsyncClient(timeout=12.0) as client:
                r = await client.post(
                    f"{BT_BRIDGE_URL}/print",
                    json={"address": address, "lines": lines, "timeout": 10.0},
                )
                body = r.json() if r.content else {}
                return {"message": "Test print sent to bridge", "success": True, "bridge": body}
        except Exception as e:
            return {
                "message": "Bridge BT non raggiungibile; richiesta registrata",
                "success": False,
                "error": str(e),
                "hint": "Avvia bt_bridge.py oppure usa la stampa nativa dall'app Android",
            }
    return {
        "message": "Test print request received (no printer address; use app for hardware print)",
        "success": True,
        "data": payload,
    }


@api_router.post("/admin/categories", response_model=Category)
async def create_category(category: CategoryCreate, username: str = Depends(verify_token)):
    d = category.dict()
    d["created_at"] = datetime.now(UTC)
    result = await db.categories.insert_one(d)
    d["id"] = str(result.inserted_id)
    return Category(**d)


@api_router.put("/admin/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category: CategoryCreate, username: str = Depends(verify_token)):
    await db.categories.update_one({"_id": ObjectId(category_id)}, {"$set": category.dict()})
    return Category(**serialize_doc(await db.categories.find_one({"_id": ObjectId(category_id)})))


@api_router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, username: str = Depends(verify_token)):
    await db.categories.delete_one({"_id": ObjectId(category_id)})
    return {"message": "Category deleted"}


@api_router.post("/admin/products", response_model=Product)
async def create_product(product: ProductCreate, username: str = Depends(verify_token)):
    d = product.dict()
    d["created_at"] = datetime.now(UTC)
    result = await db.products.insert_one(d)
    d["id"] = str(result.inserted_id)
    return Product(**d)


@api_router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate, username: str = Depends(verify_token)):
    await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": product.dict()})
    return Product(**serialize_doc(await db.products.find_one({"_id": ObjectId(product_id)})))


@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, username: str = Depends(verify_token)):
    await db.products.delete_one({"_id": ObjectId(product_id)})
    return {"message": "Product deleted"}


@api_router.get("/admin/products", response_model=List[Product])
async def get_all_products_admin(username: str = Depends(verify_token)):
    return [Product(**serialize_doc(p)) for p in await db.products.find().to_list(1000)]


@api_router.put("/admin/orders/{order_id}/status", response_model=Order)
@api_router.put("/orders/{order_id}/status", response_model=Order)
@api_router.put("/kitchen/orders/{order_id}/status", response_model=Order)
async def update_order_status(order_id: str, status_update: OrderStatusUpdate, credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    query = {"_id": ObjectId(order_id)} if ObjectId.is_valid(order_id) else {"$or": [{"id": order_id}, {"order_number": int(order_id) if order_id.isdigit() else -1}]}
    existing = await db.orders.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Ordine non trovato")
    await db.orders.update_one({"_id": existing["_id"]}, {"$set": {"status": status_update.status, "updated_at": datetime.now(UTC)}})
    return Order(**serialize_doc(await db.orders.find_one({"_id": existing["_id"]})))


@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders_admin(username: str = Depends(verify_token)):
    return [Order(**serialize_doc(o)) for o in await db.orders.find().sort("created_at", -1).to_list(1000)]


import httpx

BT_BRIDGE_URL = os.environ.get("BT_BRIDGE_URL", "http://127.0.0.1:8765")


class BtPrintRequest(BaseModel):
    address: str
    lines: list[str]
    timeout: float = 10.0


@api_router.get("/admin/bt/printers")
async def bt_scan_printers(username: str = Depends(verify_token)):
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(f"{BT_BRIDGE_URL}/printers")
            return r.json()
    except Exception as e:
        raise HTTPException(503, f"Bridge BT non raggiungibile: {e}. "
                               f"Assicurati che bt_bridge.py sia in esecuzione.")


@api_router.post("/admin/bt/print")
async def bt_print(req: BtPrintRequest, username: str = Depends(verify_token)):
    try:
        async with httpx.AsyncClient(timeout=req.timeout + 5) as client:
            r = await client.post(f"{BT_BRIDGE_URL}/print", json=req.dict())
            return r.json()
    except Exception as e:
        raise HTTPException(503, f"Bridge BT non raggiungibile: {e}. "
                               f"Assicurati che bt_bridge.py sia in esecuzione.")


@api_router.get("/admin/bt/health")
async def bt_bridge_health(username: str = Depends(verify_token)):
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{BT_BRIDGE_URL}/health")
            return {"bridge_online": True, **r.json()}
    except Exception:
        return {"bridge_online": False, "message": "Bridge non raggiungibile"}


if register_extra_routes:
    register_extra_routes(api_router)

if register_display_queue_api:
    register_display_queue_api(api_router)

if register_backup_zip:
    register_backup_zip(api_router, db, verify_token)

app.include_router(api_router)

if register_remote_admin:
    register_remote_admin(app)

if register_display_queue:
    register_display_queue(app)

if register_kitchen_display:
    register_kitchen_display(app)


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_react_app(full_path: str):
    if full_path.startswith("api/") or full_path == "api":
        raise HTTPException(status_code=404, detail="API endpoint non trovato")

    for prefix in ("display-queue", "kitchen", "hub", "kds"):
        if full_path == prefix or full_path.startswith(prefix + "/"):
            raise HTTPException(status_code=404, detail="Pagina non trovata")

    static_remote_dir = ROOT_DIR / "static" / "remote"
    static_dir = ROOT_DIR / "static"
    dist_dir = ROOT_DIR.parent / "dist"

    remote_file = static_remote_dir / full_path
    if remote_file.is_file():
        return FileResponse(remote_file)

    static_file = static_dir / full_path
    if static_file.is_file():
        return FileResponse(static_file)

    dist_file = dist_dir / full_path
    if dist_file.is_file():
        return FileResponse(dist_file)

    remote_index = static_remote_dir / "index.html"
    if remote_index.is_file():
        return FileResponse(remote_index)

    static_index = static_dir / "index.html"
    if static_index.is_file():
        return FileResponse(static_index)

    dist_index = dist_dir / "index.html"
    if dist_index.is_file():
        return FileResponse(dist_index)

    return {"error": "Frontend not built. Run: npm run build"}


app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
