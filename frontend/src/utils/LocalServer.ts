import { Buffer } from 'buffer';
import TcpSocket from 'react-native-tcp-socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import webBuild from './web_build.json';
import * as api from '../api/api.impl';

export const STORAGE_KEY_SERVER_IP = 'totem_server_ip';
export const STORAGE_KEY_LOCAL_IP = 'totem_local_ip';

export async function saveStoredServerIp(ip: string): Promise<boolean> {
  const clean = (ip || '').trim();
  if (!clean || clean === '0.0.0.0' || clean.startsWith('0.') || clean === '127.0.0.1') return false;
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SERVER_IP, clean);
    await AsyncStorage.setItem(STORAGE_KEY_LOCAL_IP, clean);
    return true;
  } catch (e) {
    console.warn('[LocalServer] saveStoredServerIp error:', e);
    return false;
  }
}

export async function getStoredServerIp(): Promise<string | null> {
  try {
    const primary = await AsyncStorage.getItem(STORAGE_KEY_SERVER_IP);
    if (primary && primary.trim() && primary !== '0.0.0.0' && !primary.startsWith('0.') && primary !== '127.0.0.1') {
      return primary.trim();
    }
    const legacy = await AsyncStorage.getItem(STORAGE_KEY_LOCAL_IP);
    if (legacy && legacy.trim() && legacy !== '0.0.0.0' && !legacy.startsWith('0.') && legacy !== '127.0.0.1') {
      return legacy.trim();
    }
    return null;
  } catch (e) {
    console.warn('[LocalServer] getStoredServerIp error:', e);
    return null;
  }
}

const PORT = 3000;
const MAX_HEADER_BYTES = 32 * 1024;
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const SOCKET_TIMEOUT_MS = 15_000;

let server: any = null;
let starting = false;
const sessionTokens = new Set<string>();
const SESSION_STORE_KEY = 'totem_remote_sessions';
async function persistSessions() {
  try { await AsyncStorage.setItem(SESSION_STORE_KEY, JSON.stringify(Array.from(sessionTokens))); } catch {}
}
async function restoreSessions() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_STORE_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    if (Array.isArray(list)) list.forEach((tok: string) => { if (tok) sessionTokens.add(String(tok)); });
  } catch {}
}

function issueSessionToken() {
  const token = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
  sessionTokens.add(token);
  persistSessions();
  return token;
}

function extractBearer(authHeader: string) {
  const raw = (authHeader || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (lower.startsWith('bearer ')) return raw.slice(7).trim();
  return raw;
}
function tokenFromHeaders(authHeader: string, cookieHeader = '', queryToken = '') {
  const fromAuth = extractBearer(authHeader);
  if (fromAuth) return fromAuth;
  if ((queryToken || '').trim()) return queryToken.trim();
  const m = (cookieHeader || '').match(/(?:^|;\s*)totem_session=([^;]+)/i);
  return m ? decodeURIComponent(m[1].trim()) : '';
}
function isAuthed(authHeader: string, cookieHeader = '', queryToken = '') {
  const token = tokenFromHeaders(authHeader, cookieHeader, queryToken);
  if (!token) return false;
  if (sessionTokens.has(token)) return true;
  // stesso token usato dal login locale del Totem
  return token === 'local-admin-token';
}

function normalizeApiPath(path: string) {
  let p = (path || '/').split('?')[0].trim();
  if (!p.startsWith('/')) p = '/' + p;
  if (p.startsWith('/remote/api/')) p = p.slice('/remote'.length);
  if (p.startsWith('/admin/api/')) p = p.slice('/admin'.length);
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

function isLoginPath(path: string) {
  const p = normalizeApiPath(path);
  return (
    p === '/api/admin/login' ||
    p === '/api/admin/pin-login' ||
    p === '/api/login' ||
    p === '/api/pin-login' ||
    p === '/api/auth' ||
    p === '/api/admin/auth' ||
    p.endsWith('/pin-login') ||
    p.endsWith('/login') ||
    p.endsWith('/auth')
  );
}

function isPublicApi(method: string, path: string) {
  const p = normalizeApiPath(path);
  if (method === 'GET' && (p === '/api/health' || p === '/api/settings' || p === '/api/categories' || p === '/api/products' || p === '/api/global-groups' || p === '/api/orders/current')) return true;
  if (method === 'GET' && p.startsWith('/api/products/category/')) return true;
  if (method === 'POST' && (p === '/api/orders' || p === '/api/orders/number-only')) return true;
  if (isLoginPath(p)) return true;
  return false;
}

function decodeBytes(data: any): string {
  if (!data) return '';
  if (typeof data === 'string') {
    if (/^\d+(?:\s*,\s*\d+)+$/.test(data.trim())) {
      try {
        const nums = data.split(',').map((n) => Number.parseInt(n.trim(), 10));
        return String.fromCharCode.apply(null, nums);
      } catch {}
    }
    return data;
  }
  if (Buffer.isBuffer(data)) {
    return data.toString('utf8');
  }
  if (data instanceof Uint8Array) {
    try {
      if (typeof TextDecoder !== 'undefined') {
        return new TextDecoder('utf-8').decode(data);
      }
    } catch {}
    try {
      return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8');
    } catch {}
  }
  if (Array.isArray(data)) {
    try {
      return String.fromCharCode.apply(null, data);
    } catch {}
    try {
      return Buffer.from(data).toString('utf8');
    } catch {}
  }
  try {
    return Buffer.from(data).toString('utf8');
  } catch {
    return String(data);
  }
}

function toBuffer(data: any): Buffer {
  if (!data) return Buffer.alloc(0);
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }
  if (Array.isArray(data)) {
    return Buffer.from(data);
  }
  if (typeof data === 'string') {
    if (/^\d+(?:\s*,\s*\d+)+$/.test(data.trim())) {
      try {
        const nums = data.split(',').map((n) => Number.parseInt(n.trim(), 10));
        return Buffer.from(nums);
      } catch {}
    }
    return Buffer.from(data, 'utf8');
  }
  try {
    return Buffer.from(data);
  } catch {
    return Buffer.alloc(0);
  }
}

function findHeaderEnd(buf: Buffer | Uint8Array): number {
  if (!buf || buf.length < 2) return -1;
  for (let i = 0; i <= buf.length - 4; i++) {
    if (buf[i] === 13 && buf[i + 1] === 10 && buf[i + 2] === 13 && buf[i + 3] === 10) return i;
  }
  for (let i = 0; i <= buf.length - 2; i++) {
    if (buf[i] === 10 && buf[i + 1] === 10) return i;
  }
  return -1;
}

function writeResponse(socket: any, status: string, contentType: string, body: Buffer | string | Uint8Array, extra = '') {
  let data: Buffer;
  if (Buffer.isBuffer(body)) {
    data = body;
  } else if (body instanceof Uint8Array) {
    data = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  } else if (typeof body === 'string') {
    data = Buffer.from(body, 'utf8');
  } else {
    data = Buffer.from(String(body || ''), 'utf8');
  }

  const header =
    `HTTP/1.1 ${status}\r\n` +
    `Content-Type: ${contentType}\r\n` +
    `Access-Control-Allow-Origin: *\r\n` +
    `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH\r\n` +
    `Access-Control-Allow-Headers: *\r\n` +
    `Access-Control-Allow-Private-Network: true\r\n` +
    `Access-Control-Expose-Headers: *\r\n` +
    `Access-Control-Max-Age: 86400\r\n` +
    `Cache-Control: no-store, no-cache, must-revalidate\r\n` +
    `Pragma: no-cache\r\n` +
    `Connection: close\r\n` +
    `Content-Length: ${data.length}\r\n` +
    `${extra}\r\n`;

  try {
    const fullBuffer = Buffer.concat([Buffer.from(header, 'utf8'), data]);
    socket.write(fullBuffer, () => {
      setTimeout(() => {
        try { socket.end(); } catch {}
      }, 25);
    });
  } catch {
    try { socket.destroy(); } catch {}
  }
}

function stopServerInstance() {
  const current = server;
  server = null;
  starting = false;
  if (current) {
    try { current.close(); } catch {}
    try { current.destroy?.(); } catch {}
  }
}

export function stopLocalServer() {
  stopServerInstance();
}

export function restartLocalServer() {
  stopServerInstance();
  setTimeout(() => startLocalServer(), 250);
}

export function isLocalServerRunning() {
  return !!server;
}

export function startLocalServer() {
  if (server || starting) return;
  starting = true;
  restoreSessions();

  try {
    const nextServer = TcpSocket.createServer((socket) => {
      let chunks: Buffer[] = [];
      let totalBytes = 0;
      let headerEnd = -1;
      let method = 'GET';
      let rawPath = '/';
      let contentLength = 0;
      let requestHandled = false;
      let authHeader = '';
      let cookieHeader = '';
      let expectContinue = false;
      let continueSent = false;

      try { socket.setTimeout?.(SOCKET_TIMEOUT_MS); } catch {}
      socket.on('timeout', () => { try { socket.destroy(); } catch {} });
      socket.on('close', () => {});
      socket.on('error', () => { try { socket.destroy(); } catch {} });

      socket.on('data', async (data: any) => {
        if (requestHandled) return;
        try {
          const chunk = toBuffer(data);
          if (!chunk || chunk.length === 0) return;
          totalBytes += chunk.length;
          if (totalBytes > MAX_HEADER_BYTES + MAX_BODY_BYTES) {
            requestHandled = true;
            writeResponse(socket, '413 Payload Too Large', 'application/json; charset=utf-8', JSON.stringify({ error: 'Request too large' }));
            return;
          }
          chunks.push(chunk);
          const combined = Buffer.concat(chunks);

          if (headerEnd === -1) {
            headerEnd = findHeaderEnd(combined);
            if (headerEnd === -1) {
              if (combined.length > MAX_HEADER_BYTES) {
                requestHandled = true;
                writeResponse(socket, '431 Request Header Fields Too Large', 'application/json; charset=utf-8', JSON.stringify({ error: 'Headers too large' }));
              }
              return;
            }

            if (headerEnd > MAX_HEADER_BYTES) {
              requestHandled = true;
              writeResponse(socket, '431 Request Header Fields Too Large', 'application/json; charset=utf-8', JSON.stringify({ error: 'Headers too large' }));
              return;
            }

            const headerBytes = combined.subarray(0, headerEnd);
            const headerText = decodeBytes(headerBytes);
            const lines = headerText.split(/\r\n|\n/);
            const reqLines = lines.filter((l) => l.trim().length > 0);
            const firstLine = reqLines[0] || '';
            const parts = firstLine.split(/\s+/);
            method = (parts[0] || 'GET').toUpperCase().trim();
            rawPath = parts[1] || '/';

            // Multi-layer defense if method or path was malformed or comma-separated
            if (!/^[A-Z]+$/.test(method)) {
              const dec = decodeBytes(method);
              const mParts = dec.trim().split(/\s+/);
              method = (mParts[0] || 'GET').toUpperCase().trim();
              if (mParts.length > 1 && (!rawPath || rawPath === '/')) {
                rawPath = mParts[1] || '/';
              }
            }

            if (/^https?:\/\//i.test(rawPath)) {
              try {
                const u = new URL(rawPath);
                rawPath = (u.pathname || '/') + (u.search || '');
              } catch {
                const idx = rawPath.indexOf('/api/');
                rawPath = idx >= 0 ? rawPath.slice(idx) : (rawPath.replace(/^https?:\/\/[^/]+/i, '') || '/');
              }
            }

            if (method === 'OPTIONS') {
              requestHandled = true;
              writeResponse(socket, '204 No Content', 'text/plain; charset=utf-8', '');
              return;
            }

            const headerVal = (name: string) => {
              const line = lines.find((l) => l.toLowerCase().startsWith(name.toLowerCase() + ':'));
              return line ? line.slice(line.indexOf(':') + 1).trim() : '';
            };
            authHeader = headerVal('authorization') || headerVal('x-totem-token');
            cookieHeader = headerVal('cookie');
            expectContinue = headerVal('expect').toLowerCase().includes('100-continue');

            const clLine = lines.find((l) => l.toLowerCase().startsWith('content-length:'));
            contentLength = clLine ? Number.parseInt(clLine.split(':').slice(1).join(':').trim(), 10) || 0 : 0;
            if (contentLength < 0 || contentLength > MAX_BODY_BYTES) {
              requestHandled = true;
              writeResponse(socket, '413 Payload Too Large', 'application/json; charset=utf-8', JSON.stringify({ error: 'Body too large' }));
              return;
            }
          }

          const sepLen = (combined[headerEnd] === 13) ? 4 : 2;
          if (expectContinue && !continueSent) {
            continueSent = true;
            try { socket.write('HTTP/1.1 100 Continue\r\n\r\n'); } catch {}
          }
          const requiredTotal = headerEnd + sepLen + contentLength;
          if (headerEnd !== -1 && combined.length >= requiredTotal) {
            requestHandled = true;
            const bodyBytes = combined.subarray(headerEnd + sepLen, requiredTotal);
            const body = decodeBytes(bodyBytes);
            const pathForRoute = (rawPath.split('?')[0] || '/').trim();
            const pathLower = pathForRoute.toLowerCase();
            const looksApi = pathLower.includes('api') || pathLower.includes('login') || pathLower.includes('pin-login') || pathLower.includes('auth');
            const isPostOrPut = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH';
            if (looksApi || isPostOrPut) {
              await handleApi(socket, method, rawPath.startsWith('/') ? rawPath : '/' + rawPath, body, authHeader, cookieHeader);
            } else {
              handleStaticFile(socket, rawPath, method);
            }
          }
        } catch (error: any) {
          console.error('LocalServer request error:', error);
          requestHandled = true;
          writeResponse(socket, '400 Bad Request', 'application/json; charset=utf-8', JSON.stringify({ error: error?.message || 'Bad Request' }));
        }
      });
    });

    nextServer.on('error', (error: any) => {
      console.warn('LocalServer error:', error?.message || error);
      starting = false;
      try { nextServer.close(); } catch {}
      try { (nextServer as any).destroy?.(); } catch {}
      if (server === nextServer) server = null;
      setTimeout(() => startLocalServer(), 1000);
    });

    nextServer.on('close', () => {
      if (server === nextServer) {
        server = null;
        starting = false;
      }
    });

    nextServer.listen({ port: PORT, host: '0.0.0.0', reuseAddress: true }, () => {
      server = nextServer;
      starting = false;
      console.log(`Totem Embedded Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start LocalServer:', error);
    starting = false;
    server = null;
    setTimeout(() => startLocalServer(), 1500);
  }
}

function normaliseStaticPath(rawPath: string) {
  let path = (rawPath || '/').split('?')[0].trim();
  if (!path.startsWith('/')) path = '/' + path;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
}

function handleStaticFile(socket: any, rawPath: string, method = 'GET') {
  try {
    let cleanPath = normaliseStaticPath(rawPath);
    let m = (method || 'GET').toUpperCase().trim();
    if (!/^[A-Z]+$/.test(m)) {
      const dec = decodeBytes(m).trim();
      const parts = dec.split(/\s+/);
      m = (parts[0] || 'GET').toUpperCase().trim();
      if (parts.length > 1 && (!cleanPath || cleanPath === '/')) {
        cleanPath = normaliseStaticPath(parts[1] || '/');
      }
    }
    if (m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS') {
      writeResponse(socket, '405 Method Not Allowed', 'application/json; charset=utf-8', JSON.stringify({ error: 'Method not allowed for static files', method: m, path: cleanPath }));
      return;
    }
    const lower = cleanPath.toLowerCase();
    if (lower.startsWith('/api') || lower.includes('/api/') || lower.includes('/login') || lower.includes('pin-login') || lower.includes('/auth')) {
      writeResponse(socket, '404 Not Found', 'application/json; charset=utf-8', JSON.stringify({ error: 'API route not found', path: cleanPath }));
      return;
    }
    const wb = (webBuild || {}) as Record<string, any>;

    let file: any = null;

    // Direct exact match
    if (wb[cleanPath]) {
      file = wb[cleanPath];
    }

    // Remote / Admin aliases
    if (!file && ['/remote', '/remote/index.html', '/remote.html', '/admin', '/admin/index.html', '/admin.html'].includes(cleanPath)) {
      file = wb['/remote/index.html'] || wb['/remote.html'] || wb['/admin/index.html'] || wb['/admin.html'] || wb['/index.html'];
    }

    // Root and client routes
    if (!file && ['', '/', '/totem', '/kitchen', '/categories', '/take-number', '/products', '/cart'].includes(cleanPath)) {
      file = wb['/remote/index.html'] || wb['/remote.html'] || wb['/admin/index.html'] || wb['/admin.html'] || wb['/index.html'];
    }

    // Stripped path for subdirectories
    if (!file && cleanPath.startsWith('/remote/')) {
      const stripped = cleanPath.replace('/remote', '');
      if (wb[stripped]) file = wb[stripped];
    }
    if (!file && cleanPath.startsWith('/admin/')) {
      const stripped = cleanPath.replace('/admin', '');
      if (wb[stripped]) file = wb[stripped];
    }

    // Static assets
    if (!file && cleanPath.startsWith('/assets/')) {
      const filename = cleanPath.split('/').pop();
      if (filename) {
        for (const [k, v] of Object.entries(wb)) {
          if (k.endsWith('/' + filename) || k === filename) {
            file = v;
            break;
          }
        }
      }
      if (!file) {
        writeResponse(socket, '404 Not Found', 'application/json; charset=utf-8', JSON.stringify({ error: 'Asset not found', path: cleanPath }));
        return;
      }
    }

    // Fallback for HTML routes
    if (!file) {
      if (cleanPath.startsWith('/remote') || cleanPath.startsWith('/admin')) {
        file = wb['/remote/index.html'] || wb['/remote.html'] || wb['/admin/index.html'] || wb['/index.html'];
      } else if (!cleanPath.includes('.')) {
        file = wb['/remote/index.html'] || wb['/remote.html'] || wb['/admin/index.html'] || wb['/admin.html'] || wb['/index.html'];
      }
    }

    if (file && String(file.ext || '').toLowerCase() === '.html') {
      const htmlText = file.type === 'base64' ? Buffer.from(file.data, 'base64').toString('utf8') : String(file.data || '');
      if (!htmlText.includes('Pannello Gestione Totem')) {
        const admin = wb['/remote/index.html'] || wb['/remote.html'] || wb['/admin/index.html'] || wb['/admin.html'];
        if (admin) file = admin;
      }
    }

    if (!file) {
      writeResponse(socket, '404 Not Found', 'text/html; charset=utf-8', '<!doctype html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p>Path: ' + cleanPath + '</p></body></html>');
      return;
    }

    const ext = String(file.ext || '').toLowerCase();
    const mimeMap: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.htm': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.ttf': 'font/ttf',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2'
    };
    const defaultMime = ext ? (mimeMap[ext] || 'application/octet-stream') : 'text/html; charset=utf-8';
    const data = file.type === 'base64' ? Buffer.from(file.data, 'base64') : Buffer.from(file.data || '', 'utf8');
    writeResponse(socket, '200 OK', defaultMime, data);
  } catch (error: any) {
    console.error('handleStaticFile error:', error);
    writeResponse(socket, '500 Internal Server Error', 'application/json; charset=utf-8', JSON.stringify({ error: error?.message || 'Internal Server Error' }));
  }
}

async function handleApi(socket: any, method: string, rawPath: string, bodyText: string, authHeader = '', cookieHeader = '') {
  try {
    let path = normalizeApiPath(rawPath || '/');
    const query = ((rawPath || '').split('?')[1] || '');
    const queryToken = (query.match(/(?:^|&)token=([^&]+)/i) || [])[1] || '';
    let json: any = null;
    if (bodyText.trim()) {
      try { json = JSON.parse(bodyText); } catch { writeResponse(socket, '400 Bad Request', 'application/json; charset=utf-8', JSON.stringify({ error: 'Invalid JSON' })); return; }
    }

    if (!isPublicApi(method, path) && !isAuthed(authHeader, cookieHeader, decodeURIComponent(queryToken))) {
      writeResponse(socket, '401 Unauthorized', 'application/json; charset=utf-8', JSON.stringify({ detail: 'Autenticazione richiesta' }));
      return;
    }

    let result: any;
    const p = normalizeApiPath(path);
    if (method === 'GET' && (p === '/api/health')) {
      result = { status: 'ok', server: 'local', port: PORT, remote_admin: true };
    } else if (method === 'GET' && (p === '/api/settings' || p === '/api/admin/settings')) {
      const settings = await api.getSettings();
      if (isAuthed(authHeader, cookieHeader, decodeURIComponent(queryToken))) {
        result = settings;
      } else {
        const { admin_pin, admin_password, admin_username, ...publicSettings } = settings as any;
        result = publicSettings;
      }
    } else if ((method === 'PUT' || method === 'POST') && (p === '/api/admin/settings' || p === '/api/settings')) {
      result = await api.updateSettings(json || {});
      if (json?.language) {
        const { setLanguage } = await import('./i18n');
        await setLanguage(json.language);
      }
    } else if (method === 'GET' && (p === '/api/admin/translation-glossary' || p === '/api/translation-glossary')) {
      result = await api.getTranslationGlossary();
    } else if ((method === 'PUT' || method === 'POST') && (p === '/api/admin/translation-glossary' || p === '/api/translation-glossary')) {
      result = await api.mergeTranslationGlossary(json?.entries || json || {});
    } else if (method === 'GET' && (p === '/api/categories' || p === '/api/admin/categories')) {
      result = await api.getCategories();
    } else if (method === 'POST' && (p === '/api/admin/categories' || p === '/api/categories')) {
      result = await api.createCategory(json || {});
    } else if (method === 'PUT' && (p.startsWith('/api/admin/categories/') || p.startsWith('/api/categories/'))) {
      result = await api.updateCategory(p.split('/').pop() || '', json || {});
    } else if (method === 'DELETE' && (p.startsWith('/api/admin/categories/') || p.startsWith('/api/categories/'))) {
      result = await api.deleteCategory(p.split('/').pop() || '');
    } else if (method === 'GET' && (p === '/api/products' || p === '/api/admin/products')) {
      result = await api.getAllProductsAdmin();
    } else if (method === 'GET' && p.startsWith('/api/products/category/')) {
      result = await api.getProductsByCategory(p.split('/').pop() || '');
    } else if (method === 'POST' && (p === '/api/admin/products' || p === '/api/products')) {
      result = await api.createProduct(json || {});
    } else if (method === 'PUT' && (p.startsWith('/api/admin/products/') || p.startsWith('/api/products/'))) {
      result = await api.updateProduct(p.split('/').pop() || '', json || {});
    } else if (method === 'DELETE' && (p.startsWith('/api/admin/products/') || p.startsWith('/api/products/'))) {
      result = await api.deleteProduct(p.split('/').pop() || '');
    } else if (method === 'GET' && (p === '/api/global-groups' || p === '/api/admin/global-groups')) {
      result = await api.getGlobalGroups();
    } else if (method === 'POST' && (p === '/api/admin/global-groups' || p === '/api/global-groups')) {
      result = await api.createGlobalGroup(json || {});
    } else if (method === 'PUT' && (p.startsWith('/api/admin/global-groups/') || p.startsWith('/api/global-groups/'))) {
      result = await api.updateGlobalGroup(p.split('/').pop() || '', json || {});
    } else if (method === 'DELETE' && (p.startsWith('/api/admin/global-groups/') || p.startsWith('/api/global-groups/'))) {
      result = await api.deleteGlobalGroup(p.split('/').pop() || '');
    } else if (method === 'GET' && (p === '/api/orders' || p === '/api/admin/orders')) {
      result = await api.getAllOrdersAdmin();
    } else if (method === 'GET' && p === '/api/orders/current') {
      const all = await api.getOrders();
      result = all.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
    } else if (method === 'POST' && p === '/api/orders') {
      result = await api.createOrder(json?.items || [], json?.total_price || 0, json?.order_type || 'totem');
    } else if (method === 'POST' && p === '/api/orders/number-only') {
      result = await api.createNumberOnlyOrder();
    } else if (method === 'PUT' && (p.startsWith('/api/admin/orders/') || p.startsWith('/api/orders/')) && p.endsWith('/status')) {
      const parts = p.split('/');
      result = await api.updateOrderStatus(parts[parts.length - 2] || '', json?.status || 'pending');
    } else if (isLoginPath(p) || (method === 'POST' && json && (json.pin || json.password))) {
      try {
        if (!json && bodyText && bodyText.includes('=')) {
          json = Object.fromEntries(bodyText.split('&').map((part) => {
            const [k, v = ''] = part.split('=');
            return [decodeURIComponent((k || '').replace(/\+/g, ' ')), decodeURIComponent((v || '').replace(/\+/g, ' '))];
          }));
        }
        const qPin = decodeURIComponent((query.match(/(?:^|&)(?:pin|password)=([^&]+)/i) || [])[1] || '');
        const qUser = decodeURIComponent((query.match(/(?:^|&)(?:username|user)=([^&]+)/i) || [])[1] || '');
        const username = String(json?.username || json?.user || qUser || 'admin').trim();
        const secret = String(json?.pin || json?.password || json?.admin_pin || qPin || '').trim();
        await api.adminLogin(username || 'admin', secret);
        const token = issueSessionToken();
        writeResponse(socket, '200 OK', 'application/json; charset=utf-8', JSON.stringify({ access_token: token, token, ok: true }), `Set-Cookie: totem_session=${token}; Path=/; SameSite=Lax\r\n`);
        return;
      } catch (e: any) {
        writeResponse(socket, '401 Unauthorized', 'application/json; charset=utf-8', JSON.stringify({ detail: e?.message || 'PIN non valido' }));
        return;
      }
    } else if (method === 'POST' && (p === '/api/admin/reset-order-number' || p === '/api/reset-order-number')) {
      const resetResult = await api.resetOrderNumber();
      result = { ...resetResult, message: resetResult?.message || 'Order number and orders reset successfully' };
    } else if (method === 'GET' && (p === '/api/admin/backup' || p === '/api/backup')) {
      result = await api.getLocalBackupSnapshot();
    } else if (method === 'POST' && (p === '/api/admin/sync-backup' || p === '/api/sync-backup' || p === '/api/admin/backup' || p === '/api/backup')) {
      const restored = await api.restoreLocalBackupSnapshot(json || {});
      result = { message: 'Backup restored successfully', count: restored };
    } else if (method === 'POST' && (p === '/api/admin/change-credentials' || p === '/api/change-credentials')) {
      if (json?.new_pin) await api.setAdminPin(String(json.new_pin).trim());
      if (json?.new_username || json?.new_password) {
        await api.changeRemoteCredentials(
          String(json.current_username || json.username || ''),
          String(json.current_password || json.password || json.pin || ''),
          String(json.new_username || ''),
          String(json.new_password || '')
        );
      }
      result = { message: 'Credentials updated successfully' };
    } else if ((method === 'POST' || method === 'GET') && ['/api/admin/scan-printers', '/api/scan-printers', '/api/admin/scan', '/api/scan', '/api/admin/bt/printers', '/api/bt/printers'].includes(p)) {
      const scanned = await api.scanBluetoothPrinters();
      result = { ...scanned, printers: scanned?.devices || [] };
    } else if (method === 'POST' && (p === '/api/admin/test-print' || p === '/api/test-print')) {
      result = await api.testPrintHardware(json?.type || 'courtesy');
    } else if (method === 'POST' && (p === '/api/admin/seed' || p === '/api/seed')) {
      result = { message: 'Seed restored successfully' };
    } else if (method === 'GET' && (p === '/api/kiosk/status' || p === '/api/admin/kiosk/status')) {
      const { getKioskTelemetry } = await import('./kiosk');
      result = await getKioskTelemetry();
    } else if (method === 'GET' && (p === '/api/kiosk/config' || p === '/api/admin/kiosk/config')) {
      const { getKioskConfig } = await import('./kiosk');
      result = await getKioskConfig();
    } else if (method === 'POST' && (p === '/api/kiosk/config' || p === '/api/admin/kiosk/config')) {
      const { saveKioskConfig } = await import('./kiosk');
      result = await saveKioskConfig(json || {});
    } else if (method === 'POST' && p === '/api/kiosk/wake') {
      const { useKioskStore } = await import('../store/kioskStore');
      useKioskStore.getState().triggerWake();
      result = { status: 'ok', action: 'wake' };
    } else if (method === 'POST' && p === '/api/kiosk/screensaver') {
      const { useKioskStore } = await import('../store/kioskStore');
      useKioskStore.getState().triggerScreensaver();
      result = { status: 'ok', action: 'screensaver' };
    } else if (method === 'POST' && p === '/api/kiosk/brightness') {
      const { useKioskStore } = await import('../store/kioskStore');
      const brightness = json?.brightness ?? 90;
      await useKioskStore.getState().updateConfig({ brightnessLevel: brightness });
      result = { status: 'ok', brightness };
    } else if (method === 'POST' && p === '/api/kiosk/reload') {
      const { useKioskStore } = await import('../store/kioskStore');
      useKioskStore.getState().triggerWake();
      result = { status: 'ok', action: 'reload' };
    } else {
      writeResponse(socket, '404 Not Found', 'application/json; charset=utf-8', JSON.stringify({ error: 'Endpoint not found', path: p }));
      return;
    }

    writeResponse(socket, '200 OK', 'application/json; charset=utf-8', JSON.stringify(result ?? { ok: true }));
  } catch (error: any) {
    console.error('handleApi error:', error);
    writeResponse(socket, '500 Internal Server Error', 'application/json; charset=utf-8', JSON.stringify({ error: error?.message || 'Internal Server Error' }));
  }
}
