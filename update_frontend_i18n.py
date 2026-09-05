import re

I18N_FILE = 'frontend/src/utils/i18n.ts'

with open(I18N_FILE, 'r') as f:
    content = f.read()

def inject(key, en_val, es_val, fr_val, de_val):
    global content
    for lang, val in [('en', en_val), ('es', es_val), ('fr', fr_val), ('de', de_val)]:
        target = f"Object.assign(LITERAL_TRANSLATIONS.{lang}, {{"
        replacement = f"{target}\n  \"{key}\": \"{val}\","
        content = content.replace(target, replacement)

inject("Varianti", "Variants", "Variantes", "Variantes", "Varianten")
inject("Prodotti", "Products", "Productos", "Produits", "Produkte")
inject("Categorie", "Categories", "Categorías", "Catégories", "Kategorien")
inject("Comande & KDS", "Orders & KDS", "Pedidos y KDS", "Commandes & KDS", "Bestellungen & KDS")
inject("Impostazioni", "Settings", "Ajustes", "Paramètres", "Einstellungen")

with open(I18N_FILE, 'w') as f:
    f.write(content)
print("Injected into frontend/src/utils/i18n.ts")
