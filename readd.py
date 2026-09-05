with open('frontend/src/utils/i18n.ts', 'r') as f:
    content = f.read()

content = content.replace("Object.assign(LITERAL_TRANSLATIONS.en, {", "Object.assign(LITERAL_TRANSLATIONS.en, {\n  'Gestione catalogo e personalizzazioni': 'Catalog and customization management',\n  'Nuovo': 'New',")

with open('frontend/src/utils/i18n.ts', 'w') as f:
    f.write(content)
