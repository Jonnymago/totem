const fs = require('fs');
const path = 'frontend/src/utils/LocalServer.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /socket\.write\(Buffer\.concat\(\[Buffer\.from\(header, 'utf8'\), dataBuf\]\)\);\s*\} else \{\s*socket\.write\('HTTP\/1\.1 404 Not Found\\r\\n\\r\\n404'\);\s*\}\s*socket\.end\(\);/,
  `socket.write(Buffer.concat([Buffer.from(header, 'utf8'), dataBuf]), () => {
            socket.end();
          });
        } else {
          socket.write('HTTP/1.1 404 Not Found\\r\\n\\r\\n404', () => {
            socket.end();
          });
        }`
);

fs.writeFileSync(path, content);
