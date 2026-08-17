const fs = require('fs');
const file = 'frontend/app/admin/(tabs)/settings.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace the broken line
content = content.replace(/\{customBackendUrl \? customBackendUrl\.replace\(\/\\\\\+\$\/, '\\\\''\).*/g, '{customBackendUrl ? customBackendUrl.replace(/\\\\/+$/, \\"\\") + \\"/remote/\\" : getRemoteAdminUrl()}</Text>');
content = content.replace(/\{customBackendUrl \? customBackendUrl\.replace\(\/\\\+\$\/, \\'\\'\\'\).*/g, '{customBackendUrl ? customBackendUrl.replace(/\\\\/+$/, \\"\\") + \\"/remote/\\" : getRemoteAdminUrl()}</Text>');
content = content.replace(/'\\''\)/g, '\"\"\)');

fs.writeFileSync(file, content);
