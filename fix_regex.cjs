const fs = require('fs');
const file = 'frontend/app/admin/(tabs)/settings.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/customBackendUrl\.replace\([^)]*\)/g, 'customBackendUrl');
fs.writeFileSync(file, content);
