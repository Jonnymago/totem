const fs = require('fs');
const file = 'frontend/src/utils/LocalServer.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
/socket\.write\("HTTP\/1\.1 200 OK\\r\\nContent-Type: " \+ mime \+ "\\r\\nAccess-Control-Allow-Origin: \*\\r\\n\\r\\n"\);\s*if \(file\.type === 'base64'\) \{\s*socket\.write\(Buffer\.from\(file\.data, 'base64'\)\);\s*\} else \{\s*socket\.write\(file\.data\);\s*\}/,
`let dataBuf;
          if (file.type === 'base64') {
            dataBuf = Buffer.from(file.data, 'base64');
          } else {
            dataBuf = Buffer.from(file.data, 'utf8');
          }
          const header = "HTTP/1.1 200 OK\\r\\nContent-Type: " + mime + "\\r\\nAccess-Control-Allow-Origin: *\\r\\nContent-Length: " + dataBuf.length + "\\r\\n\\r\\n";
          socket.write(Buffer.concat([Buffer.from(header, 'utf8'), dataBuf]));`);

fs.writeFileSync(file, content);
