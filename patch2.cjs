const fs = require('fs');
let code = fs.readFileSync('frontend/src/utils/LocalServer.ts', 'utf8');

const target = `
        if (path.startsWith('/api/')) {
          await handleApi(socket, method, path, bodyText);
          return;
        }
`;
const replace = `
        requestHandled = true;
        if (path.startsWith('/api/')) {
          await handleApi(socket, method, path, bodyText);
          return;
        }
`;
code = code.replace(target, replace);
fs.writeFileSync('frontend/src/utils/LocalServer.ts', code);
console.log('patched 2 successfully?');
