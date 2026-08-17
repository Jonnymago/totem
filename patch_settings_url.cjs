const fs = require('fs');
const file = 'frontend/app/admin/(tabs)/settings.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace {getRemoteAdminUrl()} with {customBackendUrl ? customBackendUrl.replace(/\/+$/, '') + '/remote/' : getRemoteAdminUrl()}
content = content.replace(/\{getRemoteAdminUrl\(\)\}/g, '{customBackendUrl ? customBackendUrl.replace(/\\/+$/, \\\'\\\') + \\\'/remote/\\\' : getRemoteAdminUrl()}');

fs.writeFileSync(file, content);
