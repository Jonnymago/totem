const fs = require('fs');
let code = fs.readFileSync('frontend/src/utils/LocalServer.ts', 'utf8');
code = code.replace(
`  server = TcpSocket.createServer((socket) => {
    let rawData = Buffer.alloc(0);
    
    socket.on('data', async (data) => {
      try {
        rawData = Buffer.concat([rawData, Buffer.from(data as any)]);`,
`  server = TcpSocket.createServer((socket) => {
    let rawData = Buffer.alloc(0);
    let requestHandled = false;
    
    socket.on('data', async (data) => {
      if (requestHandled) return;
      try {
        rawData = Buffer.concat([rawData, Buffer.from(data as any)]);`);
fs.writeFileSync('frontend/src/utils/LocalServer.ts', code);
console.log('patched successfully?');
