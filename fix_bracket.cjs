const fs = require('fs');
const file = 'frontend/app/admin/(tabs)/settings.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/style=\{\[styles\.label, \{(.*?)\}\}>/g, 'style={[styles.label, {$1}]}>');
fs.writeFileSync(file, content);
