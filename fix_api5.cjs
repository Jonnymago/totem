const fs = require('fs');
const file = 'frontend/src/api/api.impl.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /export const deleteGlobalGroup[\s\S]*?\};$/m,
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
fs.writeFileSync(file, content);
