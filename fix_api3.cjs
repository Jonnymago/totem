const fs = require('fs');
const file = 'frontend/src/api/api.impl.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix deleteProduct
content = content.replace(
  "export const deleteProduct = async (id: string) => {\n  const token = await AsyncStorage.getItem('admin_token');\n  return getRemoteJson('/admin/products/' + id, {\n    method: 'DELETE',\n    headers: { Authorization: `Bearer ${token}` },\n  });\n};",
  `export const deleteProduct = async (id: string) => {
  await ensureLocalDbLoaded();
  try {
    const token = await AsyncStorage.getItem('admin_token');
    await getRemoteJson('/admin/products/' + id, { method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` } });
  } catch {}
  localDb.products = localDb.products.filter(p => p.id !== id);
  await saveLocalDb();
};`
);

// Fix deleteGlobalGroup
content = content.replace(
  "export const deleteGlobalGroup = async (id: string) => {\n  const token = await AsyncStorage.getItem('admin_token');\n  return getRemoteJson('/admin/global-groups/' + id, {\n    method: 'DELETE',\n    headers: { Authorization: `Bearer ${token}` },\n  });\n};",
  `export const deleteGlobalGroup = async (id: string) => {
  await ensureLocalDbLoaded();
  try {
    const token = await AsyncStorage.getItem('admin_token');
    await getRemoteJson('/admin/global-groups/' + id, { method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` } });
  } catch {}
  localDb.global_groups = (localDb.global_groups || []).filter(g => g.id !== id);
  await saveLocalDb();
};`
);

// Fix createCategory
content = content.replace(
  "export const createCategory = async (cat: Partial<Category>) => {\n  const token = await AsyncStorage.getItem('admin_token');\n  return getRemoteJson<Category>('/admin/categories', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },\n    body: JSON.stringify(cat),\n  });\n};",
  `export const createCategory = async (cat: Partial<Category>) => {
  await ensureLocalDbLoaded();
  const newCat = { ...cat, id: Math.random().toString(36).substr(2, 9) } as Category;
  try {
    const token = await AsyncStorage.getItem('admin_token');
    const remote = await getRemoteJson<Category>('/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
      body: JSON.stringify(cat),
    });
    newCat.id = remote.id;
  } catch {}
  localDb.categories = [...(localDb.categories || []), newCat];
  await saveLocalDb();
  return clone(newCat);
};`
);

// Fix updateCategory
content = content.replace(
  "export const updateCategory = async (id: string, cat: Partial<Category>) => {\n  const token = await AsyncStorage.getItem('admin_token');\n  return getRemoteJson<Category>('/admin/categories/' + id, {\n    method: 'PUT',\n    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },\n    body: JSON.stringify(cat),\n  });\n};",
  `export const updateCategory = async (id: string, cat: Partial<Category>) => {
  await ensureLocalDbLoaded();
  try {
    const token = await AsyncStorage.getItem('admin_token');
    await getRemoteJson<Category>('/admin/categories/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
      body: JSON.stringify(cat),
    });
  } catch {}
  localDb.categories = (localDb.categories || []).map(c => c.id === id ? { ...c, ...cat } : c);
  await saveLocalDb();
  return clone(localDb.categories!.find(c => c.id === id)!);
};`
);

// Fix deleteCategory
content = content.replace(
  "export const deleteCategory = async (id: string) => {\n  const token = await AsyncStorage.getItem('admin_token');\n  return getRemoteJson('/admin/categories/' + id, {\n    method: 'DELETE',\n    headers: { Authorization: `Bearer ${token}` },\n  });\n};",
  `export const deleteCategory = async (id: string) => {
  await ensureLocalDbLoaded();
  try {
    const token = await AsyncStorage.getItem('admin_token');
    await getRemoteJson('/admin/categories/' + id, { method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` } });
  } catch {}
  localDb.categories = (localDb.categories || []).filter(c => c.id !== id);
  await saveLocalDb();
};`
);

fs.writeFileSync(file, content);
