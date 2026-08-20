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

function isPublicApi(method: string, path: string) {
  if (method === 'GET' && (path === '/api/health' || path === '/api/settings' || path === '/api/categories' || path === '/api/products' || path === '/api/global-groups' || path === '/api/orders/current')) return true;
  if (method === 'GET' && path.startsWith('/api/products/category/')) return true;
  if (method === 'POST' && (path === '/api/orders' || path === '/api/orders/number-only')) return true;
  if (method === 'POST' && ['/api/admin/login', '/api/admin/pin-login', '/api/login', '/api/pin-login'].includes(path)) return true;
  return false;
}

function findHeaderEnd(buf: Buffer): number {
  for (let i = 0; i <= buf.length - 4; i++) {
    if (buf[i] === 13 && buf[i + 1] === 10 && buf[i + 2] === 13 && buf[i + 3] === 10) return i;
  }
  for (let i = 0; i <= buf.length - 2; i++) {
    if (buf[i] === 10 && buf[i + 1] === 10) return i;
  }
  return -1;
}

function writeResponse(socket: any, status: string, contentType: string, body: Buffer | string, extra = '') {
  const data = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
  const header = `HTTP/1.1 ${status}\r\nContent-Type: ${contentType}\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD\r\nAccess-Control-Allow-Headers: Content-Type, Authorization, Accept, Origin, X-Requested-With\r\nCache-Control: no-store\r\nConnection: close\r\nContent-Length: ${data.length}\r\n${extra}\r\n`;
  try { socket.write(Buffer.concat([Buffer.from(header, 'utf8'), data]), () => { try { socket.end(); } catch {} }); } catch { try { socket.destroy(); } catch {} }
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
          const chunk = Buffer.from(data);
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

            const headerText = combined.subarray(0, headerEnd).toString('utf8');
            const lines = headerText.split(/\r\n|\n/);
            const reqLines = lines.filter((l) => l.trim().length > 0);
            const firstLine = reqLines[0] || '';
            const parts = firstLine.split(/\s+/);
            method = (parts[0] || 'GET').toUpperCase();
            rawPath = parts[1] || '/';
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
            const body = combined.subarray(headerEnd + sepLen, requiredTotal).toString('utf8');
            const pathForRoute = (rawPath.split('?')[0] || '/');
            if (pathForRoute.includes('/api/') || pathForRoute.startsWith('/api')) {
              await handleApi(socket, method, rawPath, body, authHeader, cookieHeader);
            } else {
              handleStaticFile(socket, rawPath);
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
      if (server === nextServer) stopServerInstance();
      setTimeout(() => startLocalServer(), 1000);
    });

    nextServer.listen({ port: PORT, host: '0.0.0.0' }, () => {
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

function handleStaticFile(socket: any, rawPath: string) {
  try {
    const cleanPath = normaliseStaticPath(rawPath);
    if (cleanPath.includes('/api/') || cleanPath.startsWith('/api')) {
      writeResponse(socket, '404 Not Found', 'application/json; charset=utf-8', JSON.stringify({ error: 'API route missed', path: cleanPath }));
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
    let path = (rawPath || '/').split('?')[0].trim();
    if (!path.startsWith('/')) path = '/' + path;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
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
    if (method === 'GET' && (path === '/api/health')) {
      result = { status: 'ok', server: 'local', port: PORT, remote_admin: true };
    } else if (method === 'GET' && path === '/api/settings') {
      const settings = await api.getSettings();
      if (isAuthed(authHeader, cookieHeader, decodeURIComponent(queryToken))) {
        result = settings;
      } else {
        const { admin_pin, ...publicSettings } = settings as any;
        result = publicSettings;
      }
    } else if (method === 'GET' && path === '/api/admin/settings') {
      result = await api.getSettings();
    } else if ((method === 'PUT' || method === 'POST') && (path === '/api/admin/settings' || path === '/api/settings')) {
      result = await api.updateSettings(json || {});
    } else if (method === 'GET' && (path === '/api/categories' || path === '/api/admin/categories')) {
      result = await api.getCategories();
    } else if (method === 'POST' && (path === '/api/admin/categories' || path === '/api/categories')) {
      result = await api.createCategory(json || {});
    } else if (method === 'PUT' && (path.startsWith('/api/admin/categories/') || path.startsWith('/api/categories/'))) {
      result = await api.updateCategory(path.split('/').pop() || '', json || {});
    } else if (method === 'DELETE' && (path.startsWith('/api/admin/categories/') || path.startsWith('/api/categories/'))) {
      result = await api.deleteCategory(path.split('/').pop() || '');
    } else if (method === 'GET' && path === '/api/products') {
      result = await api.getProducts();
    } else if (method === 'GET' && path === '/api/admin/products') {
      result = await api.getAllProductsAdmin();
    } else if (method === 'GET' && path.startsWith('/api/products/category/')) {
      result = await api.getProductsByCategory(path.split('/').pop() || '');
    } else if (method === 'POST' && (path === '/api/admin/products' || path === '/api/products')) {
      result = await api.createProduct(json || {});
    } else if (method === 'PUT' && (path.startsWith('/api/admin/products/') || path.startsWith('/api/products/'))) {
      result = await api.updateProduct(path.split('/').pop() || '', json || {});
    } else if (method === 'DELETE' && (path.startsWith('/api/admin/products/') || path.startsWith('/api/products/'))) {
      result = await api.deleteProduct(path.split('/').pop() || '');
    } else if (method === 'GET' && (path === '/api/global-groups' || path === '/api/admin/global-groups')) {
      result = await api.getGlobalGroups();
    } else if (method === 'POST' && (path === '/api/admin/global-groups' || path === '/api/global-groups')) {
      result = await api.createGlobalGroup(json || {});
    } else if (method === 'PUT' && (path.startsWith('/api/admin/global-groups/') || path.startsWith('/api/global-groups/'))) {
      result = await api.updateGlobalGroup(path.split('/').pop() || '', json || {});
    } else if (method === 'DELETE' && (path.startsWith('/api/admin/global-groups/') || path.startsWith('/api/global-groups/'))) {
      result = await api.deleteGlobalGroup(path.split('/').pop() || '');
    } else if (method === 'GET' && (path === '/api/orders' || path === '/api/admin/orders')) {
      result = await api.getAllOrdersAdmin();
    } else if (method === 'GET' && path === '/api/orders/current') {
      const all = await api.getOrders();
      result = all.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
    } else if (method === 'POST' && path === '/api/orders') {
      result = await api.createOrder(json?.items || [], json?.total_price || 0, json?.order_type || 'totem');
    } else if (method === 'POST' && path === '/api/orders/number-only') {
      result = await api.createNumberOnlyOrder();
    } else if (method === 'PUT' && (path.startsWith('/api/admin/orders/') || path.startsWith('/api/orders/')) && path.endsWith('/status')) {
      const parts = path.split('/');
      result = await api.updateOrderStatus(parts[parts.length - 2] || '', json?.status || 'pending');
    } else if (method === 'POST' && ['/api/admin/login', '/api/admin/pin-login', '/api/login', '/api/pin-login'].includes(path)) {
      try {
        if (!json && bodyText && bodyText.includes('=')) {
          json = Object.fromEntries(bodyText.split('&').map((part) => {
            const [k, v = ''] = part.split('=');
            return [decodeURIComponent((k || '').replace(/\+/g, ' ')), decodeURIComponent((v || '').replace(/\+/g, ' '))];
          }));
        }
        const qPin = decodeURIComponent((query.match(/(?:^|&)(?:pin|password)=([^&]+)/i) || [])[1] || '');
        const pin = String(json?.pin || json?.password || json?.admin_pin || qPin || '').trim();
        await api.adminLogin(String(json?.username || json?.user || 'admin'), pin);
        const token = issueSessionToken();
        writeResponse(socket, '200 OK', 'application/json; charset=utf-8', JSON.stringify({ access_token: token, token, ok: true }), `Set-Cookie: totem_session=${token}; Path=/; SameSite=Lax\r\n`);
        return;
      } catch (e: any) {
        writeResponse(socket, '401 Unauthorized', 'application/json; charset=utf-8', JSON.stringify({ detail: e?.message || 'PIN non valido' }));
        return;
      }
    } else if (method === 'POST' && (path === '/api/admin/reset-order-number' || path === '/api/reset-order-number')) {
      await api.resetOrderNumber();
      result = { message: 'Order number reset successfully' };
    } else if (method === 'GET' && (path === '/api/admin/backup' || path === '/api/backup')) {
      result = await api.getLocalBackupSnapshot();
    } else if (method === 'POST' && (path === '/api/admin/sync-backup' || path === '/api/sync-backup' || path === '/api/admin/backup' || path === '/api/backup')) {
      const restored = await api.restoreLocalBackupSnapshot(json || {});
      result = { message: 'Backup restored successfully', count: restored };
    } else if (method === 'POST' && (path === '/api/admin/change-credentials' || path === '/api/change-credentials')) {
      if (json?.new_pin) await api.setAdminPin(String(json.new_pin).trim());
      result = { message: 'Credentials updated successfully' };
    } else if ((method === 'POST' || method === 'GET') && ['/api/admin/scan-printers', '/api/scan-printers', '/api/admin/scan', '/api/scan', '/api/admin/bt/printers', '/api/bt/printers'].includes(path)) {
      const scanned = await api.scanBluetoothPrinters();
      result = { ...scanned, printers: scanned?.devices || [] };
    } else if (method === 'POST' && (path === '/api/admin/test-print' || path === '/api/test-print')) {
      result = await api.testPrintHardware(json?.type || 'courtesy');
    } else if (method === 'POST' && (path === '/api/admin/seed' || path === '/api/seed')) {
      result = { message: 'Seed restored successfully' };
    } else {
      writeResponse(socket, '404 Not Found', 'application/json; charset=utf-8', JSON.stringify({ error: 'Endpoint not found', path }));
      return;
    }

    writeResponse(socket, '200 OK', 'application/json; charset=utf-8', JSON.stringify(result ?? { ok: true }));
  } catch (error: any) {
    console.error('handleApi error:', error);
    writeResponse(socket, '500 Internal Server Error', 'application/json; charset=utf-8', JSON.stringify({ error: error?.message || 'Internal Server Error' }));
  }
}
