const fs = require('fs');
const file = 'frontend/src/api/api.impl.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /export const createGlobalGroup[\s\S]*?export const updateGlobalGroup/m,
  `export const createGlobalGroup = async (group: Partial<GlobalOptionGroup>) => {
  await ensureLocalDbLoaded();
  const newGroup = { ...group, id: 'gg_' + Date.now().toString(36) } as GlobalOptionGroup;
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
};

export const updateGlobalGroup`
);

content = content.replace(
  /export const updateGlobalGroup[\s\S]*?export const deleteGlobalGroup/m,
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
  return clone(localDb.global_groups.find(g => g.id === id)!);
};

export const deleteGlobalGroup`
);

fs.writeFileSync(file, content);
