const fs = require('fs');
const file = 'frontend/src/utils/LocalServer.ts';

const content = `import TcpSocket from 'react-native-tcp-socket';
import webBuild from './web_build.json';
import * as api from '../api/api.impl';

let server: any = null;

export function startLocalServer() {
  if (server) return;

  server = TcpSocket.createServer((socket) => {
    let rawData = Buffer.alloc(0);
    
    socket.on('data', async (data) => {
      try {
        rawData = Buffer.concat([rawData, Buffer.from(data as any)]);
        
        const reqString = rawData.toString('utf8');
        const headerEnd = reqString.indexOf('\\r\\n\\r\\n');
        
        if (headerEnd === -1) return; // Wait for full header
        
        const headerText = reqString.substring(0, headerEnd);
        const lines = headerText.split('\\r\\n');
        const [method, path] = lines[0].split(' ');
        
        let bodyText = '';
        if (method === 'POST' || method === 'PUT') {
          const clLine = lines.find(l => l.toLowerCase().startsWith('content-length:'));
          if (clLine) {
             const cl = parseInt(clLine.split(':')[1].trim(), 10);
             if (rawData.length < headerEnd + 4 + cl) {
               return; // wait for more body
             }
             bodyText = rawData.subarray(headerEnd + 4, headerEnd + 4 + cl).toString('utf8');
          } else {
             bodyText = rawData.subarray(headerEnd + 4).toString('utf8');
          }
        }
        
        // Handle Request
        if (path.startsWith('/api/')) {
          await handleApi(socket, method, path, bodyText);
          return;
        }

        // Handle static files
        let cleanPath = path.split('?')[0];
        if (cleanPath === '/' || cleanPath.startsWith('/remote')) cleanPath = '/index.html';
        
        const file: any = (webBuild as any)[cleanPath] || (webBuild as any)['/index.html'];
        
        if (file) {
          const ext = file.ext || '.html';
          const mime = ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : ext === '.json' ? 'application/json' : ext === '.png' ? 'image/png' : ext === '.ttf' ? 'font/ttf' : 'text/html';
          
          socket.write("HTTP/1.1 200 OK\\r\\nContent-Type: " + mime + "\\r\\nAccess-Control-Allow-Origin: *\\r\\n\\r\\n");
          
          if (file.type === 'base64') {
            socket.write(Buffer.from(file.data, 'base64'));
          } else {
            socket.write(file.data);
          }
        } else {
          socket.write('HTTP/1.1 404 Not Found\\r\\n\\r\\n404');
        }
        socket.end();
      } catch (err) {
        console.error('Socket error:', err);
        socket.destroy();
      }
    });
  });

  server.listen({ port: 8000, host: '0.0.0.0' }, () => {
    console.log('Totem Embedded Server listening on 8000');
  });
}

async function handleApi(socket: any, method: string, path: string, bodyText: string) {
  try {
     let json: any = null;
     if (bodyText) {
       try { json = JSON.parse(bodyText); } catch {}
     }
     
     let result: any = null;
     
     // Very basic routing based on existing api.impl.ts logic
     if (method === 'GET' && path === '/api/settings') result = await api.getSettings();
     else if (method === 'PUT' && path === '/api/admin/settings') result = await api.updateSettings(json);
     else if (method === 'GET' && path === '/api/categories') result = await api.getCategories();
     else if (method === 'GET' && path === '/api/products') result = await api.getProducts();
     else if (method === 'GET' && path === '/api/admin/products') result = await api.getProductsAdmin();
     else if (method === 'POST' && path === '/api/admin/products') result = await api.createProduct(json);
     else if (method === 'PUT' && path.startsWith('/api/admin/products/')) result = await api.updateProduct(path.split('/').pop() || '', json);
     else if (method === 'DELETE' && path.startsWith('/api/admin/products/')) result = await api.deleteProduct(path.split('/').pop() || '');
     else if (method === 'POST' && path === '/api/admin/categories') result = await api.createCategory(json);
     else if (method === 'PUT' && path.startsWith('/api/admin/categories/')) result = await api.updateCategory(path.split('/').pop() || '', json);
     else if (method === 'DELETE' && path.startsWith('/api/admin/categories/')) result = await api.deleteCategory(path.split('/').pop() || '');
     else if (method === 'GET' && path === '/api/global-groups') result = await api.getGlobalGroups();
     else if (method === 'POST' && path === '/api/admin/global-groups') result = await api.createGlobalGroup(json);
     else if (method === 'PUT' && path.startsWith('/api/admin/global-groups/')) result = await api.updateGlobalGroup(path.split('/').pop() || '', json);
     else if (method === 'DELETE' && path.startsWith('/api/admin/global-groups/')) result = await api.deleteGlobalGroup(path.split('/').pop() || '');
     else if (method === 'GET' && path === '/api/admin/orders') result = await api.getAllOrdersAdmin();
     else if (method === 'POST' && path === '/api/orders') result = await api.createOrder(json.items, json.total_price, json.order_type);
     else if (method === 'POST' && path === '/api/admin/login') result = { access_token: 'local-admin-token' };
     else result = { ok: true };

     const resJson = JSON.stringify(result);
     socket.write("HTTP/1.1 200 OK\\r\\nContent-Type: application/json\\r\\nAccess-Control-Allow-Origin: *\\r\\nAccess-Control-Allow-Headers: *\\r\\nAccess-Control-Allow-Methods: *\\r\\nContent-Length: " + Buffer.byteLength(resJson) + "\\r\\n\\r\\n" + resJson);
  } catch (e: any) {
     const errJson = JSON.stringify({ error: e.message });
     socket.write("HTTP/1.1 500 Internal Server Error\\r\\nContent-Type: application/json\\r\\nAccess-Control-Allow-Origin: *\\r\\n\\r\\n" + errJson);
  }
  socket.end();
}`;

fs.writeFileSync(file, content);
