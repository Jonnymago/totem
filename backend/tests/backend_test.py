"""
Backend API tests for Restaurant Totem app.
Covers new data model (combo products, base_ingredients, extra_additions),
number-only orders, daily order-number reset, and existing CRUD flows.
"""
import os
import pytest
import requests

BASE_URL = (
    os.environ.get("EXPO_BACKEND_URL")
    or os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or "https://quick-order-station-1.preview.emergentagent.com"
).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USER = os.environ.get("TOTEM_ADMIN_USER", "").strip()
ADMIN_PASS = os.environ.get("TOTEM_ADMIN_PASS", "").strip()
if not ADMIN_USER or not ADMIN_PASS:
    import warnings
    warnings.warn("TOTEM_ADMIN_USER / TOTEM_ADMIN_PASS not set; admin tests will fail")


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/admin/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- Health / Root ----------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        body = r.json()
        assert "message" in body
        assert body.get("version") == "2.0"


class TestAdminLogin:
    def test_login_success(self, session):
        r = session.post(f"{API}/admin/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/admin/login", json={"username": ADMIN_USER, "password": "wrong"})
        assert r.status_code == 401

    def test_login_unknown_user(self, session):
        r = session.post(f"{API}/admin/login", json={"username": "nobody", "password": "x"})
        assert r.status_code == 401


class TestCategories:
    def test_get_categories_count_6(self, session):
        r = session.get(f"{API}/categories")
        assert r.status_code == 200
        cats = r.json()
        assert isinstance(cats, list)
        assert len(cats) == 6, f"Expected 6 categories, got {len(cats)}"
        names = [c["name"] for c in cats]
        assert "Combo" in names, f"'Combo' category missing. Got: {names}"
        order_idxs = [c["order_index"] for c in cats]
        assert order_idxs == sorted(order_idxs), "Categories not sorted by order_index"

    def test_create_requires_auth(self, session):
        r = session.post(f"{API}/admin/categories", json={"name": "TEST_x", "description": "d"})
        assert r.status_code in (401, 403)

    def test_category_crud_flow(self, session, auth_headers):
        payload = {"name": "TEST_Category", "description": "TEST desc", "order_index": 99, "image": ""}
        r = session.post(f"{API}/admin/categories", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        cid = r.json()["id"]
        upd = {"name": "TEST_Category_Updated", "description": "upd", "order_index": 100, "image": ""}
        r = session.put(f"{API}/admin/categories/{cid}", json=upd, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Category_Updated"
        r = session.delete(f"{API}/admin/categories/{cid}", headers=auth_headers)
        assert r.status_code == 200
        r = session.get(f"{API}/categories")
        assert not any(c["id"] == cid for c in r.json())


class TestProducts:
    def test_public_products_available(self, session):
        r = session.get(f"{API}/products")
        assert r.status_code == 200
        products = r.json()
        assert isinstance(products, list)

    def test_new_fields_present_on_all_products(self, session):
        r = session.get(f"{API}/products")
        products = r.json()
        required = {"product_type", "base_ingredients", "extra_additions", "combo_groups"}
        for p in products:
            missing = required - set(p.keys())
            assert not missing, f"Product '{p.get('name')}' missing keys {missing}"
            assert p["product_type"] in ("simple", "combo")

    def test_product_crud_with_new_fields(self, session, auth_headers):
        cats = session.get(f"{API}/categories").json()
        assert cats, "Need at least one category for product CRUD"
        cat_id = cats[0]["id"]
        payload = {
            "name": "TEST_Product_New",
            "description": "TEST product new-model",
            "price": 9.99,
            "category_id": cat_id,
            "available": True,
            "allergens": ["glutine"],
            "customization_options": [],
            "product_type": "simple",
            "base_ingredients": ["Pane", "Formaggio"],
            "extra_additions": [{"name": "Bacon", "price": 1.5}],
            "combo_groups": [],
            "image": "",
        }
        r = session.post(f"{API}/admin/products", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        created = r.json()
        pid = created["id"]
        assert created["base_ingredients"] == ["Pane", "Formaggio"]
        r = session.delete(f"{API}/admin/products/{pid}", headers=auth_headers)
        assert r.status_code == 200


class TestOrders:
    def test_number_only_order(self, session):
        r = session.post(f"{API}/orders/number-only")
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["order_type"] == "number_only"
        assert order["items"] == []
        assert order["total_price"] == 0.0
        assert order["status"] == "pending"
        assert isinstance(order["order_number"], int) and order["order_number"] >= 1

    def test_order_status_update_requires_auth(self, session):
        r = session.put(
            f"{API}/admin/orders/000000000000000000000000/status",
            json={"status": "ready"},
        )
        assert r.status_code in (401, 403)

    def test_current_orders_lists_active(self, session):
        r = session.get(f"{API}/orders/current")
        assert r.status_code == 200
        orders = r.json()
        assert isinstance(orders, list)
        for o in orders:
            assert o["status"] != "completed"


class TestSettings:
    def test_get_settings_public_no_auth(self, session):
        r = session.get(f"{API}/settings")
        assert r.status_code == 200, r.text
        body = r.json()
        for k in ("restaurant_name", "logo", "auto_print_courtesy", "auto_print_kitchen"):
            assert k in body, f"Missing '{k}' in settings response"

    def test_put_settings_requires_auth(self, session):
        r = session.put(f"{API}/admin/settings", json={"restaurant_name": "TEST_X"})
        assert r.status_code in (401, 403)

    def test_put_settings_invalid_token_rejected(self, session):
        r = session.put(
            f"{API}/admin/settings",
            json={"restaurant_name": "TEST_X"},
            headers={"Authorization": "Bearer not-a-valid-token", "Content-Type": "application/json"},
        )
        assert r.status_code == 401

    def test_seed_force_creates_default_settings(self, session, auth_headers):
        r = session.post(f"{API}/admin/seed", params={"force": "true"}, headers=auth_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "seeded" in str(body.get("message", "")).lower() or body.get("admin_username") == "admin"
        got = session.get(f"{API}/settings").json()
        assert got["restaurant_name"] == "TOTEM RISTORANTE"
        assert got["auto_print_courtesy"] is True
        assert got["auto_print_kitchen"] is True
