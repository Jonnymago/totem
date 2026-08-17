const fs = require('fs');
const path = 'frontend/src/utils/LocalServer.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /socket\.write\(Buffer\.concat\(\[Buffer\.from\(header, 'utf8'\), dataBuf\]\), \(\) => \{\s*socket\.end\(\);\s*\}\);/,
  `
          const fullBuf = Buffer.concat([Buffer.from(header, 'utf8'), dataBuf]);
          const CHUNK_SIZE = 65536; // 64KB
          let offset = 0;
          const sendNextChunk = () => {
            if (offset >= fullBuf.length) {
              socket.end();
              return;
            }
            const end = Math.min(offset + CHUNK_SIZE, fullBuf.length);
            socket.write(fullBuf.subarray(offset, end), (err) => {
              if (err) { socket.destroy(); return; }
              setTimeout(sendNextChunk, 1);
            });
          };
          sendNextChunk();
  `
);

fs.writeFileSync(path, content);
