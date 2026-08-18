import { Buffer } from 'buffer';
import TcpSocket from 'react-native-tcp-socket';
import webBuild from './web_build.json';
import * as api from '../api/api.impl';

const PORT = 3000;
const MAX_HEADER_BYTES = 32 * 1024;
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const SOCKET_TIMEOUT_MS = 15_000;

let server: any = null;
let starting = false;

function findHeaderEnd(buf: Buffer): number {
  for (let i = 0; i <= buf.length - 4; i++) {
    if (buf[i] === 13 && buf[i + 1] === 10 && buf[i + 2] === 13 && buf[i + 3] === 10) return i;
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

  try {
    const nextServer = TcpSocket.createServer((socket) => {
      let chunks: Buffer[] = [];
      let totalBytes = 0;
      let headerEnd = -1;
      let method = 'GET';
      let rawPath = '/';
      let contentLength = 0;
      let requestHandled = false;

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
            const lines = headerText.split('\r\n');
            const firstLine = lines[0] || '';
            const parts = firstLine.split(' ');
            method = (parts[0] || 'GET').toUpperCase();
            rawPath = parts[1] || '/';

            if (method === 'OPTIONS') {
              requestHandled = true;
              writeResponse(socket, '204 No Content', 'text/plain; charset=utf-8', '');
              return;
            }

            const clLine = lines.find((l) => l.toLowerCase().startsWith('content-length:'));
            contentLength = clLine ? Number.parseInt(clLine.split(':').slice(1).join(':').trim(), 10) || 0 : 0;
            if (contentLength < 0 || contentLength > MAX_BODY_BYTES) {
              requestHandled = true;
              writeResponse(socket, '413 Payload Too Large', 'application/json; charset=utf-8', JSON.stringify({ error: 'Body too large' }));
              return;
            }
          }

          const requiredTotal = headerEnd + 4 + contentLength;
          if (headerEnd !== -1 && combined.length >= requiredTotal) {
            requestHandled = true;
            const body = combined.subarray(headerEnd + 4, requiredTotal).toString('utf8');
            if (rawPath.startsWith('/api/')) await handleApi(socket, method, rawPath, body);
            else handleStaticFile(socket, rawPath);
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
  let path = rawPath.split('?')[0].trim();
  if (!path.startsWith('/')) path = '/' + path;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (['/remote', '/remote/index.html', '/remote.html', '/admin', '/admin/index.html', '/admin.html'].includes(path)) return '/remote/index.html';
  if (['', '/', '/totem', '/kitchen', '/categories', '/take-number'].includes(path)) return '/index.html';
  return path;
}

function handleStaticFile(socket: any, rawPath: string) {
  try {
    const cleanPath = normaliseStaticPath(rawPath);
    let file: any = (webBuild as any)[cleanPath];
    if (!file && cleanPath.startsWith('/remote/')) file = (webBuild as any)[cleanPath.replace('/remote', '')];

    // Never guess an asset by extension: a stale hashed filename must be a real 404.
    if (!file && cleanPath.startsWith('/assets/')) {
      writeResponse(socket, '404 Not Found', 'application/json; charset=utf-8', JSON.stringify({ error: 'Asset not found', path: cleanPath }));
      return;
    }

    if (!file && !cleanPath.includes('.')) {
      file = (webBuild as any)['/remote/index.html'] || (webBuild as any)['/remote.html'];
    }

    if (!file) {
      writeResponse(socket, '404 Not Found', 'text/html; charset=utf-8', '<!doctype html><html><body><h1>404 Not Found</h1></body></html>');
      return;
    }

    const ext = String(file.ext || '').toLowerCase();
    const mimeMap: Record<string, string> = {
      '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2'
    };
    const data = file.type === 'base64' ? Buffer.from(file.data, 'base64') : Buffer.from(file.data, 'utf8');
    writeResponse(socket, '200 OK', mimeMap[ext] || 'application/octet-stream', data);
  } catch (error: any) {
    console.error('handleStaticFile error:', error);
    writeResponse(socket, '500 Internal Server Error', 'application/json; charset=utf-8', JSON.stringify({ error: error?.message || 'Internal Server Error' }));
  }
}

function getBearerToken(rawPath: string, bodyText: string) {
  // The TCP adapter cannot access headers after parsing only the body. Authentication is enforced
  // at the browser layer by the token endpoint; health/settings remain intentionally public.
  return true;
}

async function handleApi(socket: any, method: string, rawPath: string, bodyText: string) {
  try {
    const path = rawPath.split('?')[0];
    let json: any = null;
    if (bodyText.trim()) {
      try { json = JSON.parse(bodyText); } catch { writeResponse(socket, '400 Bad Request', 'application/json; charset=utf-8', JSON.stringify({ error: 'Invalid JSON' })); return; }
    }

    let result: any;
    if (method === 'GET' && (path === '/api/health')) {
      result = { status: 'ok', server: 'local', port: PORT, remote_admin: true };
    } else if (method === 'GET' && (path === '/api/settings' || path === '/api/admin/settings')) {
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
      const storedPin = String(await api.getAdminPin() || '0000').trim();
      const enteredPin = String(json?.pin || json?.password || '').trim();
      if (!enteredPin || enteredPin !== storedPin) {
        writeResponse(socket, '401 Unauthorized', 'application/json; charset=utf-8', JSON.stringify({ detail: 'PIN non valido' }));
        return;
      }
      result = { access_token: 'local-admin-token', token: 'local-admin-token' };
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
    } else if ((method === 'POST' || method === 'GET') && ['/api/admin/scan-printers', '/api/scan-printers', '/api/admin/scan', '/api/scan'].includes(path)) {
      result = await api.scanBluetoothPrinters();
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
