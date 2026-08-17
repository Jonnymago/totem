const fs = require('fs');
let code = fs.readFileSync('frontend/src/utils/LocalServer.ts', 'utf8');
code = code.replace(
  "if (cleanPath === '/' || cleanPath.startsWith('/remote')) cleanPath = '/index.html';",
  `if (cleanPath.startsWith('/remote')) {
          socket.write("HTTP/1.1 302 Found\\r\\nLocation: /\\r\\n\\r\\n", () => socket.end());
          return;
        }
        if (cleanPath === '/') cleanPath = '/index.html';`
);
fs.writeFileSync('frontend/src/utils/LocalServer.ts', code);
console.log('patched redirect');
