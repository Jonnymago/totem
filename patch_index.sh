sed -i 's/import { getSettings, getAdminPin }/import { getSettings, getAdminPin, getGlobalGroups, getProducts, getCategories }/' frontend/app/index.tsx
sed -i 's/const data = await getSettings();/const data = await getSettings();\n      getGlobalGroups().catch(() => {});\n      getProducts().catch(() => {});\n      getCategories().catch(() => {});/' frontend/app/index.tsx
