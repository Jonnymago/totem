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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

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

security = HTTPBearer()
app = FastAPI()
api_router = APIRouter(prefix="/api")


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
    admin_pin: Optional[str] = "1234"
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


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)})
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
    return {"message": "Totem Ristorante API", "version": "2.0"}


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
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
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
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.orders.insert_one(order_dict)
    order_dict["id"] = str(result.inserted_id)
    return Order(**order_dict)


@api_router.get("/orders/current", response_model=List[Order])
async def get_current_orders():
    orders = await db.orders.find({"status": {"$ne": "completed"}}).sort("created_at", -1).to_list(1000)
    return [Order(**serialize_doc(o)) for o in orders]


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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sistema non inizializzato")
    expected_pin = str(settings.get("admin_pin") or "").strip()
    entered = (credentials.pin or "").strip()
    if not expected_pin or entered != expected_pin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="PIN non valido")
    admin = await db.admin_users.find_one({})
    username = admin["username"] if admin else "admin"
    return Token(access_token=create_access_token({"sub": username}))


@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({})
    if settings:
        return Settings(**serialize_doc(settings))
    return Settings(restaurant_name="TOTEM RISTORANTE", logo="", auto_print_courtesy=True, auto_print_kitchen=True, order_reset_mode="daily", reset_time="06:00", admin_pin="1234")


@api_router.put("/admin/settings", response_model=Settings)
async def update_settings(settings_update: SettingsUpdate, username: str = Depends(verify_token)):
    existing = await db.settings.find_one({})
    data = {k: v for k, v in settings_update.dict().items() if v is not None}
    data["updated_at"] = datetime.utcnow()
    if existing:
        await db.settings.update_one({"_id": existing["_id"]}, {"$set": data})
        updated = await db.settings.find_one({"_id": existing["_id"]})
    else:
        base = {"restaurant_name": "TOTEM RISTORANTE", "logo": "", "auto_print_courtesy": True, "auto_print_kitchen": True, "order_reset_mode": "daily", "reset_time": "06:00", "last_reset_at": None, "admin_pin": "1234"}
        base.update(data)
        result = await db.settings.insert_one(base)
        updated = await db.settings.find_one({"_id": result.inserted_id})
    return Settings(**serialize_doc(updated))


@api_router.post("/admin/reset-order-number")
async def reset_order_number(username: str = Depends(verify_token)):
    now = datetime.utcnow()
    existing = await db.settings.find_one({})
    if existing:
        await db.settings.update_one({"_id": existing["_id"]}, {"$set": {"last_reset_at": now, "order_reset_mode": "manual", "updated_at": now}})
    else:
        await db.settings.insert_one({"restaurant_name": "TOTEM RISTORANTE", "logo": "", "auto_print_courtesy": True, "auto_print_kitchen": True, "order_reset_mode": "manual", "reset_time": "06:00", "last_reset_at": now, "admin_pin": "1234", "updated_at": now})
    return {"message": "Order number reset successfully", "reset_at": now.isoformat()}


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
    return {"message": "Test print request received", "success": True, "data": data or {}}


@api_router.post("/admin/categories", response_model=Category)
async def create_category(category: CategoryCreate, username: str = Depends(verify_token)):
    d = category.dict()
    d["created_at"] = datetime.utcnow()
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
    d["created_at"] = datetime.utcnow()
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
async def update_order_status(order_id: str, status_update: OrderStatusUpdate, username: str = Depends(verify_token)):
    await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": status_update.status, "updated_at": datetime.utcnow()}})
    return Order(**serialize_doc(await db.orders.find_one({"_id": ObjectId(order_id)})))


@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders_admin(username: str = Depends(verify_token)):
    return [Order(**serialize_doc(o)) for o in await db.orders.find().sort("created_at", -1).to_list(1000)]


if register_extra_routes:
    register_extra_routes(api_router)

app.include_router(api_router)
if register_remote_admin:
    register_remote_admin(app)

app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
