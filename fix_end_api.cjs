const fs = require('fs');
const path = 'frontend/src/utils/LocalServer.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /socket\.write\("HTTP\/1\.1 200 OK\\r\\nContent-Type: application\/json\\r\\nAccess-Control-Allow-Origin: \*\\r\\nAccess-Control-Allow-Headers: \*\\r\\nAccess-Control-Allow-Methods: \*\\r\\nContent-Length: " \+ Buffer\.byteLength\(resJson\) \+ "\\r\\n\\r\\n" \+ resJson\);\s*\} catch \(e: any\) \{\s*const errJson = JSON\.stringify\(\{ error: e\.message \}\);\s*socket\.write\("HTTP\/1\.1 500 Internal Server Error\\r\\nContent-Type: application\/json\\r\\nAccess-Control-Allow-Origin: \*\\r\\n\\r\\n" \+ errJson\);\s*\}\s*socket\.end\(\);/,
  `socket.write("HTTP/1.1 200 OK\\r\\nContent-Type: application/json\\r\\nAccess-Control-Allow-Origin: *\\r\\nAccess-Control-Allow-Headers: *\\r\\nAccess-Control-Allow-Methods: *\\r\\nContent-Length: " + Buffer.byteLength(resJson) + "\\r\\n\\r\\n" + resJson, () => {
       socket.end();
     });
  } catch (e: any) {
     const errJson = JSON.stringify({ error: e.message });
     socket.write("HTTP/1.1 500 Internal Server Error\\r\\nContent-Type: application/json\\r\\nAccess-Control-Allow-Origin: *\\r\\n\\r\\n" + errJson, () => {
       socket.end();
     });
  }`
);

fs.writeFileSync(path, content);
