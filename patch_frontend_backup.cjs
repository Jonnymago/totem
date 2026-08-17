const fs = require('fs');
const file = 'frontend/src/api/api.impl.ts';
let content = fs.readFileSync(file, 'utf8');

const backupReplace = `
  try {
    const token = await AsyncStorage.getItem('admin_token');
    if (token && API_URL && !FORCE_LOCAL_MOCK) {
      await getRemoteJson('/admin/sync-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({
          settings: snapshot.settings || null,
          categories: snapshot.categories || null,
          products: snapshot.products || null,
          global_groups: snapshot.global_groups || null
        }),
      });
      // Ripopolare localDb con i veri id assegnati dal backend se vogliamo
      // Ma intanto al prossimo avvio li peschera' dal backend.
    }
  } catch (e) {
    console.warn('Backup push to remote failed', e);
  }
`;

content = content.replace(/try\s*\{\s*const token = await AsyncStorage\.getItem\('admin_token'\);\s*if\s*\(token && API_URL && !FORCE_LOCAL_MOCK\)\s*\{\s*await getRemoteJson\('\/admin\/settings'[\s\S]*?console\.warn\('Backup push to remote failed', e\);\s*\}/, backupReplace.trim());

fs.writeFileSync(file, content);
