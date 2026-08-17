const fs = require('fs');
const file = 'frontend/src/api/api.impl.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add custom_backend_url to Settings
content = content.replace('export interface Settings {', 'export interface Settings {\n  custom_backend_url?: string;');

// 2. Modify getBackendBaseUrl
content = content.replace('export function getBackendBaseUrl(): string {\n  return rawBackendUrl || \'\';\n}', 'export function getBackendBaseUrl(): string {\n  const custom = localDb?.settings?.custom_backend_url;\n  if (custom && custom.trim() !== \'\') {\n    return custom.replace(/\\/+$/, \'\');\n  }\n  return rawBackendUrl || \'\';\n}');

// 3. Modify getRemoteJson
const oldRemoteJson = `const getRemoteJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (FORCE_LOCAL_MOCK || !API_URL) throw new Error('Local mock enabled');
  const response = await fetch(\`\${API_URL}\${path}\`, init);
  if (!response.ok) throw new Error(\`Request failed: \${response.status}\`);
  return response.json();
};`;

const newRemoteJson = `const getRemoteJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const base = getBackendBaseUrl();
  if (FORCE_LOCAL_MOCK && !base) throw new Error('Local mock enabled');
  if (!base) throw new Error('No backend URL');
  
  const response = await fetch(\`\${base}/api\${path}\`, init);
  if (!response.ok) throw new Error(\`Request failed: \${response.status}\`);
  return response.json();
};`;

content = content.replace(oldRemoteJson, newRemoteJson);

fs.writeFileSync(file, content);
