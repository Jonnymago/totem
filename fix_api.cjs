const fs = require('fs');
const file = 'frontend/src/api/api.impl.ts';
let content = fs.readFileSync(file, 'utf8');

// fix getAllProductsAdmin
content = content.replace(
  "export const getAllProductsAdmin = async (): Promise<Product[]> => {\n  const token = await AsyncStorage.getItem('admin_token');\n  return getRemoteJson<Product[]>('/admin/products', { headers: { Authorization: `Bearer ${token}` } });\n};",
  "export const getAllProductsAdmin = async (): Promise<Product[]> => {\n  await ensureLocalDbLoaded();\n  try {\n    const token = await AsyncStorage.getItem('admin_token');\n    const remote = await getRemoteJson<Product[]>('/admin/products', { headers: { Authorization: `Bearer ${token}` } });\n    localDb.products = remote;\n    await saveLocalDb();\n  } catch {}\n  return clone(localDb.products);\n};"
);

// fix createProduct
content = content.replace(
  "export const createProduct = async (product: Partial<Product>) => {\n  const token = await AsyncStorage.getItem('admin_token');\n  return getRemoteJson<Product>('/admin/products', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },\n    body: JSON.stringify(product),\n  });\n};",
  "export const createProduct = async (product: Partial<Product>) => {\n  await ensureLocalDbLoaded();\n  const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) } as Product;\n  try {\n    const token = await AsyncStorage.getItem('admin_token');\n    const remote = await getRemoteJson<Product>('/admin/products', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },\n      body: JSON.stringify(product),\n    });\n    newProduct.id = remote.id;\n  } catch {}\n  localDb.products = [...localDb.products, newProduct];\n  await saveLocalDb();\n  return clone(newProduct);\n};"
);

fs.writeFileSync(file, content);
