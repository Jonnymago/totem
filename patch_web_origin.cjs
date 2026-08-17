const fs = require('fs');
const file = 'frontend/src/api/api.impl.ts';
let content = fs.readFileSync(file, 'utf8');

const replaceStr = `export function getBackendBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    if (!window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
      return window.location.origin;
    }
  }
  const custom = localDb?.settings?.custom_backend_url;
  if (custom && custom.trim() !== '') {
    return custom.replace(/\\/+$/, '');
  }
  return rawBackendUrl || '';
}`;

content = content.replace(/export function getBackendBaseUrl\(\): string \{[\s\S]*?rawBackendUrl \|\| '';\n\}/, replaceStr);
fs.writeFileSync(file, content);
