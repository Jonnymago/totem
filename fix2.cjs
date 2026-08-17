const fs = require('fs');
const file = 'frontend/app/admin/(tabs)/settings.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\{customBackendUrl \? [^\}]+\}/g, '{customBackendUrl ? customBackendUrl.replace(/\\/+$/, "") + "/remote/" : getRemoteAdminUrl()}');
fs.writeFileSync(file, content);
