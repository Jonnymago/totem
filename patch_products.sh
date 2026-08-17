sed -i 's/import { getAllProductsAdmin/import { getGlobalGroups, GlobalOptionGroup, getAllProductsAdmin/' frontend/app/admin/\(tabs\)/products.tsx
sed -i 's/const \[categories, setCategories\] = useState<Category\[\]>(\[\]);/const [categories, setCategories] = useState<Category[]>([]);\n  const [globalGroups, setGlobalGroups] = useState<GlobalOptionGroup[]>([]);\n  const [selectedGlobalGroupIds, setSelectedGlobalGroupIds] = useState<string[]>([]);/' frontend/app/admin/\(tabs\)/products.tsx
sed -i 's/const \[productsData, categoriesData\] = await Promise.all(\[/const [productsData, categoriesData, globalGroupsData] = await Promise.all([/' frontend/app/admin/\(tabs\)/products.tsx
sed -i 's/getAllProductsAdmin(),/getAllProductsAdmin(),/' frontend/app/admin/\(tabs\)/products.tsx
sed -i 's/getCategories()/getCategories(),\n        getGlobalGroups()/' frontend/app/admin/\(tabs\)/products.tsx
sed -i 's/setCategories(categoriesData);/setCategories(categoriesData);\n      setGlobalGroups(globalGroupsData);/' frontend/app/admin/\(tabs\)/products.tsx
