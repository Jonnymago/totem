const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, isRGBA, pixelCallback) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = isRGBA ? 6 : 2;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const srgbChunk = makeChunk('sRGB', Buffer.from([0]));

  const bpp = isRGBA ? 4 : 3;
  const rowSize = 1 + width * bpp;
  const rawData = Buffer.alloc(height * rowSize);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelCallback(x, y);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      if (isRGBA) {
        rawData[offset++] = a !== undefined ? a : 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, srgbChunk, idatChunk, iendChunk]);
}

const GLYPHS = {
  T: ["1111111", "1111111", "0001000", "0001000", "0001000", "0001000", "0001000", "0001000", "0001000"],
  O: ["0111110", "1100011", "1100011", "1100011", "1100011", "1100011", "1100011", "1100011", "0111110"],
  E: ["1111111", "1100000", "1100000", "1111110", "1111110", "1100000", "1100000", "1111111", "1111111"],
  M: ["1100011", "1110111", "1111111", "1101011", "1100011", "1100011", "1100011", "1100011", "1100011"]
};

function isPixelInText(x, y, cx, cy, scale) {
  const word = ["T", "O", "T", "E", "M"];
  const charW = 7 * scale;
  const charH = 9 * scale;
  const spacing = 2 * scale;
  const totalW = word.length * charW + (word.length - 1) * spacing;
  const totalH = charH;

  const startX = cx - totalW / 2;
  const startY = cy - totalH / 2;

  if (x < startX || x >= startX + totalW || y < startY || y >= startY + totalH) {
    return false;
  }

  const relX = x - startX;
  const relY = y - startY;

  const charSlot = charW + spacing;
  const charIdx = Math.floor(relX / charSlot);
  if (charIdx >= word.length) return false;

  const inCharX = relX - charIdx * charSlot;
  if (inCharX >= charW) return false;

  const gridX = Math.floor(inCharX / scale);
  const gridY = Math.floor(relY / scale);

  const char = word[charIdx];
  const glyph = GLYPHS[char];
  if (!glyph || !glyph[gridY]) return false;

  return glyph[gridY][gridX] === "1";
}

function main() {
  const dirs = [path.join(__dirname, '../assets/images'), path.join(__dirname, '../../assets/images')];
  for (const d of dirs) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }

  const iconBuf = encodePNG(1024, 1024, false, (x, y) => {
    const cx = 512, cy = 512, r = 384;
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy <= r * r) {
      return isPixelInText(x, y, cx, cy, 14) ? [255, 255, 255] : [0, 170, 0];
    }
    return [0, 0, 0];
  });

  const adaptiveBuf = encodePNG(1024, 1024, true, (x, y) => {
    const cx = 512, cy = 512, r = 384;
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy <= r * r) {
      return isPixelInText(x, y, cx, cy, 14) ? [255, 255, 255, 255] : [0, 170, 0, 255];
    }
    return [0, 0, 0, 0];
  });

  const splashBuf = encodePNG(1284, 2778, false, (x, y) => {
    const cx = 642, cy = 1389, r = 300;
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy <= r * r) {
      return isPixelInText(x, y, cx, cy, 11) ? [255, 255, 255] : [0, 170, 0];
    }
    return [0, 0, 0];
  });

  for (const dir of dirs) {
    fs.writeFileSync(path.join(dir, 'icon.png'), iconBuf);
    fs.writeFileSync(path.join(dir, 'adaptive-icon.png'), adaptiveBuf);
    fs.writeFileSync(path.join(dir, 'splash-image.png'), splashBuf);
    fs.writeFileSync(path.join(dir, 'favicon.png'), iconBuf);
    fs.writeFileSync(path.join(dir, 'app-image.png'), iconBuf);
  }
  console.log('PNG assets regenerated successfully');
}

main();
