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

ADMIN_USER = "admin"
ADMIN_PASS = "admin123"


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
        # v2.0 per new server
        assert body.get("version") == "2.0"


# ---------- Admin login ----------
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


# ---------- Categories ----------
class TestCategories:
    def test_get_categories_count_6(self, session):
        """After re-seed there must be 6 categories (added Combo)."""
        r = session.get(f"{API}/categories")
        assert r.status_code == 200
        cats = r.json()
        assert isinstance(cats, list)
        assert len(cats) == 6, f"Expected 6 categories, got {len(cats)}"
        names = [c["name"] for c in cats]
        # Must contain the new "Combo" category
        assert "Combo" in names, f"'Combo' category missing. Got: {names}"
        # Sorted by order_index
        order_idxs = [c["order_index"] for c in cats]
        assert order_idxs == sorted(order_idxs), "Categories not sorted by order_index"

    def test_create_requires_auth(self, session):
        r = session.post(f"{API}/admin/categories", json={"name": "TEST_x", "description": "d"})
        assert r.status_code in (401, 403)

    def test_category_crud_flow(self, session, auth_headers):
        # CREATE
        payload = {"name": "TEST_Category", "description": "TEST desc", "order_index": 99, "image": ""}
        r = session.post(f"{API}/admin/categories", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        cid = r.json()["id"]

        # UPDATE
        upd = {"name": "TEST_Category_Updated", "description": "upd", "order_index": 100, "image": ""}
        r = session.put(f"{API}/admin/categories/{cid}", json=upd, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Category_Updated"

        # DELETE
        r = session.delete(f"{API}/admin/categories/{cid}", headers=auth_headers)
        assert r.status_code == 200

        # verify delete
        r = session.get(f"{API}/categories")
        assert not any(c["id"] == cid for c in r.json())


# ---------- Products (new data model) ----------
class TestProducts:
    def test_public_products_count_52(self, session):
        """After re-seed there must be 52 products."""
        r = session.get(f"{API}/products")
        assert r.status_code == 200
        products = r.json()
        assert isinstance(products, list)
        assert len(products) == 52, f"Expected 52 products, got {len(products)}"

    def test_admin_products_count_52(self, session, auth_headers):
        r = session.get(f"{API}/admin/products", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) == 52

    def test_new_fields_present_on_all_products(self, session):
        r = session.get(f"{API}/products")
        products = r.json()
        required = {"product_type", "base_ingredients", "extra_additions", "combo_groups"}
        for p in products:
            missing = required - set(p.keys())
            assert not missing, f"Product '{p.get('name')}' missing keys {missing}"
            assert p["product_type"] in ("simple", "combo")

    def test_simple_product_has_base_and_extras(self, session):
        """A simple product with customization (e.g., Hamburger Classico) must
        have populated base_ingredients and extra_additions."""
        products = session.get(f"{API}/products").json()
        hamburger = next((p for p in products if p["name"] == "Hamburger Classico"), None)
        assert hamburger is not None, "Seed product 'Hamburger Classico' not found"
        assert hamburger["product_type"] == "simple"
        assert isinstance(hamburger["base_ingredients"], list)
        assert len(hamburger["base_ingredients"]) > 0, "base_ingredients should be populated"
        assert isinstance(hamburger["extra_additions"], list)
        assert len(hamburger["extra_additions"]) > 0, "extra_additions should be populated"
        first_extra = hamburger["extra_additions"][0]
        assert "name" in first_extra and "price" in first_extra
        assert isinstance(first_extra["price"], (int, float))

    def test_combo_category_has_3_combo_products(self, session):
        cats = session.get(f"{API}/categories").json()
        combo_cat = next((c for c in cats if c["name"] == "Combo"), None)
        assert combo_cat is not None, "Combo category missing"

        r = session.get(f"{API}/products/category/{combo_cat['id']}")
        assert r.status_code == 200
        combo_products = r.json()
        assert len(combo_products) == 3, f"Expected 3 combo products, got {len(combo_products)}"

        expected_names = {"Poke Bowl Combo", "Burger Combo", "Pizza Combo"}
        got_names = {p["name"] for p in combo_products}
        assert expected_names <= got_names, f"Missing combos: {expected_names - got_names}"

        for p in combo_products:
            assert p["product_type"] == "combo"
            assert isinstance(p["combo_groups"], list)
            assert len(p["combo_groups"]) > 0, f"Combo '{p['name']}' has no combo_groups"
            for group in p["combo_groups"]:
                assert {"name", "min_selection", "max_selection", "options"} <= set(group.keys())
                assert isinstance(group["options"], list) and len(group["options"]) > 0
                for opt in group["options"]:
                    assert "name" in opt and "price_delta" in opt
                    assert isinstance(opt["price_delta"], (int, float))

    def test_product_crud_with_new_fields(self, session, auth_headers):
        cats = session.get(f"{API}/categories").json()
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
        assert created["extra_additions"][0]["name"] == "Bacon"
        assert created["extra_additions"][0]["price"] == 1.5

        # UPDATE with combo_groups
        upd = {
            **payload,
            "name": "TEST_Product_New_Upd",
            "product_type": "combo",
            "base_ingredients": [],
            "extra_additions": [],
            "combo_groups": [
                {
                    "name": "Base",
                    "min_selection": 1,
                    "max_selection": 1,
                    "options": [{"name": "Riso", "price_delta": 0.0}, {"name": "Quinoa", "price_delta": 1.0}],
                }
            ],
        }
        r = session.put(f"{API}/admin/products/{pid}", json=upd, headers=auth_headers)
        assert r.status_code == 200
        updated = r.json()
        assert updated["product_type"] == "combo"
        assert len(updated["combo_groups"]) == 1
        assert updated["combo_groups"][0]["options"][1]["price_delta"] == 1.0

        # DELETE
        r = session.delete(f"{API}/admin/products/{pid}", headers=auth_headers)
        assert r.status_code == 200


# ---------- Orders (new fields + number-only + daily reset) ----------
class TestOrders:
    def test_number_only_order(self, session):
        """POST /api/orders/number-only creates a voice order with no items."""
        r = session.post(f"{API}/orders/number-only")
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["order_type"] == "number_only"
        assert order["items"] == []
        assert order["total_price"] == 0.0
        assert order["status"] == "pending"
        assert isinstance(order["order_number"], int) and order["order_number"] >= 1

    def test_full_order_with_new_fields(self, session, auth_headers):
        products = session.get(f"{API}/products").json()
        # pick a simple burger with extras
        hamburger = next(p for p in products if p["name"] == "Hamburger Classico")

        item = {
            "product_id": hamburger["id"],
            "product_name": hamburger["name"],
            "quantity": 1,
            "price": hamburger["price"] + 1.5,  # +Bacon
            "customizations": [],
            "notes": "TEST full order",
            "removed_ingredients": ["Cipolla"],
            "added_extras": [{"name": "Extra Bacon", "price": 1.5}],
            "combo_selections": {},
        }
        payload = {"items": [item], "total_price": item["price"], "order_type": "full"}

        r = session.post(f"{API}/orders", json=payload)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["order_type"] == "full"
        assert order["status"] == "pending"
        assert order["items"][0]["removed_ingredients"] == ["Cipolla"]
        assert order["items"][0]["added_extras"][0]["name"] == "Extra Bacon"
        oid = order["id"]

        # Full status transition
        for new_status in ["preparing", "ready", "completed"]:
            r = session.put(
                f"{API}/admin/orders/{oid}/status",
                json={"status": new_status},
                headers=auth_headers,
            )
            assert r.status_code == 200
            assert r.json()["status"] == new_status

    def test_order_with_combo_selections(self, session):
        """Create an order for a combo product using combo_selections."""
        cats = session.get(f"{API}/categories").json()
        combo_cat = next(c for c in cats if c["name"] == "Combo")
        combo_products = session.get(f"{API}/products/category/{combo_cat['id']}").json()
        poke = next(p for p in combo_products if p["name"] == "Poke Bowl Combo")

        item = {
            "product_id": poke["id"],
            "product_name": poke["name"],
            "quantity": 1,
            "price": poke["price"] + 1.5,  # + Avocado topping
            "customizations": [],
            "notes": "TEST combo order",
            "removed_ingredients": [],
            "added_extras": [],
            "combo_selections": {
                "Base": ["Riso bianco"],
                "Proteina": ["Salmone"],
                "Topping (max 4)": ["Avocado"],
                "Salsa": ["Soia"],
                "Bevanda inclusa": ["Acqua naturale"],
            },
        }
        payload = {"items": [item], "total_price": item["price"], "order_type": "full"}

        r = session.post(f"{API}/orders", json=payload)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["items"][0]["combo_selections"]["Proteina"] == ["Salmone"]
        assert order["items"][0]["combo_selections"]["Topping (max 4)"] == ["Avocado"]

    def test_order_number_daily_sequence(self, session):
        """Consecutive number-only orders must have strictly increasing order numbers
        within the same day."""
        r1 = session.post(f"{API}/orders/number-only")
        r2 = session.post(f"{API}/orders/number-only")
        assert r1.status_code == 200 and r2.status_code == 200
        n1 = r1.json()["order_number"]
        n2 = r2.json()["order_number"]
        assert n2 == n1 + 1, f"Order numbers not sequential: {n1} -> {n2}"

    def test_current_orders_lists_active(self, session):
        r = session.get(f"{API}/orders/current")
        assert r.status_code == 200
        orders = r.json()
        assert isinstance(orders, list)
        # No completed orders should be listed
        for o in orders:
            assert o["status"] != "completed"

    def test_order_status_update_requires_auth(self, session):
        r = session.put(
            f"{API}/admin/orders/000000000000000000000000/status",
            json={"status": "ready"},
        )
        assert r.status_code in (401, 403)



# ---------- Settings (new feature) ----------
class TestSettings:
    """Settings singleton: public GET, admin-only PUT."""

    def test_get_settings_public_no_auth(self, session):
        """GET /api/settings must be public (no auth) and return a Settings doc."""
        r = session.get(f"{API}/settings")
        assert r.status_code == 200, r.text
        body = r.json()
        # Required fields
        for k in ("restaurant_name", "logo", "auto_print_courtesy", "auto_print_kitchen"):
            assert k in body, f"Missing '{k}' in settings response"
        assert isinstance(body["restaurant_name"], str)
        assert isinstance(body["auto_print_courtesy"], bool)
        assert isinstance(body["auto_print_kitchen"], bool)

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

    def test_put_settings_partial_restaurant_name(self, session, auth_headers):
        """PUT with only restaurant_name updates only that field, other fields preserved."""
        # capture original
        original = session.get(f"{API}/settings").json()
        new_name = "TEST_Ristorante_Nome"
        r = session.put(f"{API}/admin/settings", json={"restaurant_name": new_name}, headers=auth_headers)
        assert r.status_code == 200, r.text
        updated = r.json()
        assert updated["restaurant_name"] == new_name
        # Other fields preserved
        assert updated["auto_print_courtesy"] == original["auto_print_courtesy"]
        assert updated["auto_print_kitchen"] == original["auto_print_kitchen"]
        assert updated["logo"] == original["logo"]

        # Verify persistence via GET
        got = session.get(f"{API}/settings").json()
        assert got["restaurant_name"] == new_name

        # restore
        session.put(f"{API}/admin/settings", json={"restaurant_name": original["restaurant_name"]}, headers=auth_headers)

    def test_put_settings_logo_base64(self, session, auth_headers):
        """PUT logo (base64) saves and persists."""
        # tiny 1x1 PNG base64 (data URL header optional)
        logo_b64 = (
            "data:image/png;base64,"
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        )
        r = session.put(f"{API}/admin/settings", json={"logo": logo_b64}, headers=auth_headers)
        assert r.status_code == 200, r.text
        assert r.json()["logo"] == logo_b64

        # verify persistence
        got = session.get(f"{API}/settings").json()
        assert got["logo"] == logo_b64

        # cleanup
        session.put(f"{API}/admin/settings", json={"logo": ""}, headers=auth_headers)

    def test_put_settings_auto_print_courtesy_false(self, session, auth_headers):
        r = session.put(
            f"{API}/admin/settings",
            json={"auto_print_courtesy": False},
            headers=auth_headers,
        )
        assert r.status_code == 200
        assert r.json()["auto_print_courtesy"] is False
        # verify GET
        got = session.get(f"{API}/settings").json()
        assert got["auto_print_courtesy"] is False
        # restore default
        session.put(f"{API}/admin/settings", json={"auto_print_courtesy": True}, headers=auth_headers)

    def test_put_settings_multi_field(self, session, auth_headers):
        payload = {
            "restaurant_name": "TEST_Multi_Field",
            "auto_print_courtesy": False,
            "auto_print_kitchen": False,
        }
        r = session.put(f"{API}/admin/settings", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["restaurant_name"] == "TEST_Multi_Field"
        assert body["auto_print_courtesy"] is False
        assert body["auto_print_kitchen"] is False

        got = session.get(f"{API}/settings").json()
        assert got["restaurant_name"] == "TEST_Multi_Field"
        assert got["auto_print_courtesy"] is False
        assert got["auto_print_kitchen"] is False

        # restore
        session.put(
            f"{API}/admin/settings",
            json={"restaurant_name": "TOTEM RISTORANTE", "auto_print_courtesy": True, "auto_print_kitchen": True},
            headers=auth_headers,
        )

    def test_seed_force_creates_default_settings(self, session):
        """POST /api/admin/seed?force=true wipes and recreates default settings doc."""
        r = session.post(f"{API}/admin/seed", params={"force": "true"})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("products_count") == 52
        assert body.get("categories_count") == 6

        # After re-seed, defaults must be present
        got = session.get(f"{API}/settings").json()
        assert got["restaurant_name"] == "TOTEM RISTORANTE"
        assert got["logo"] == ""
        assert got["auto_print_courtesy"] is True
        assert got["auto_print_kitchen"] is True
