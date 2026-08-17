const fs = require('fs');
const file = 'frontend/src/api/api.impl.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix updateProduct
content = content.replace(
  "export const updateProduct = async (id: string, product: Partial<Product>) => {\n  const token = await AsyncStorage.getItem('admin_token');\n  return getRemoteJson<Product>('/admin/products/' + id, {\n    method: 'PUT',\n    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },\n    body: JSON.stringify(product),\n  });\n};",
  `export const updateProduct = async (id: string, product: Partial<Product>) => {
  await ensureLocalDbLoaded();
  try {
    const token = await AsyncStorage.getItem('admin_token');
    await getRemoteJson<Product>('/admin/products/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
      body: JSON.stringify(product),
    });
  } catch {}
  localDb.products = localDb.products.map(p => p.id === id ? { ...p, ...product } : p);
  await saveLocalDb();
  return clone(localDb.products.find(p => p.id === id)!);
};`
);

// Fix createGlobalGroup
content = content.replace(
  "export const createGlobalGroup = async (group: Partial<GlobalOptionGroup>) => {\n  const token = await AsyncStorage.getItem('admin_token');\n  return getRemoteJson<GlobalOptionGroup>('/admin/global-groups', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },\n    body: JSON.stringify(group),\n  });\n};",
  `export const createGlobalGroup = async (group: Partial<GlobalOptionGroup>) => {
  await ensureLocalDbLoaded();
  const newGroup = { ...group, id: Math.random().toString(36).substr(2, 9) } as GlobalOptionGroup;
  try {
    const token = await AsyncStorage.getItem('admin_token');
    const remote = await getRemoteJson<GlobalOptionGroup>('/admin/global-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
      body: JSON.stringify(group),
    });
    newGroup.id = remote.id;
  } catch {}
  localDb.global_groups = [...(localDb.global_groups || []), newGroup];
  await saveLocalDb();
  return clone(newGroup);
};`
);

// Fix updateGlobalGroup
content = content.replace(
  "export const updateGlobalGroup = async (id: string, group: Partial<GlobalOptionGroup>) => {\n  const token = await AsyncStorage.getItem('admin_token');\n  return getRemoteJson<GlobalOptionGroup>('/admin/global-groups/' + id, {\n    method: 'PUT',\n    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },\n    body: JSON.stringify(group),\n  });\n};",
  `export const updateGlobalGroup = async (id: string, group: Partial<GlobalOptionGroup>) => {
  await ensureLocalDbLoaded();
  try {
    const token = await AsyncStorage.getItem('admin_token');
    await getRemoteJson<GlobalOptionGroup>('/admin/global-groups/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
      body: JSON.stringify(group),
    });
  } catch {}
  localDb.global_groups = (localDb.global_groups || []).map(g => g.id === id ? { ...g, ...group } : g);
  await saveLocalDb();
  return clone(localDb.global_groups!.find(g => g.id === id)!);
};`
);

fs.writeFileSync(file, content);
