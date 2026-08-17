const fs = require('fs');
let code = fs.readFileSync('frontend/src/api/api.impl.ts', 'utf8');
code = code.replace(
  "const rawBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\\/+$/, '') || '';",
  "const rawBackendUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : (process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\\/+$/, '') || '');"
);
fs.writeFileSync('frontend/src/api/api.impl.ts', code);
console.log('patched api');
