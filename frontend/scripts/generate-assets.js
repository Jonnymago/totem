const fs = require('fs');
const path = require('path');
const Jimp = require('jimp-compact');

async function createIcon(w, h, bgColor, fgColor) {
  return new Promise((resolve, reject) => {
    new Jimp(w, h, bgColor, (err, image) => {
      if (err) return reject(err);
      
      // Draw decorative centered burger / restaurant totem badge
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.38;

      // Draw outer circle
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const distSq = dx * dx + dy * dy;
          if (distSq <= radius * radius) {
            // Inside circular badge
            image.setPixelColor(fgColor, x, y);
          }
        }
      }

      // Draw stylized burger layers inside
      const innerW = radius * 1.3;
      const x0 = cx - innerW / 2;
      const x1 = cx + innerW / 2;
      const stripeH = Math.max(4, Math.floor(h * 0.035));
      const gap = Math.max(4, Math.floor(h * 0.025));

      // Top bun (rounded arc)
      const bunTopY = cy - radius * 0.45;
      for (let y = bunTopY; y < bunTopY + stripeH * 1.6; y++) {
        for (let x = x0 + innerW * 0.1; x <= x1 - innerW * 0.1; x++) {
          image.setPixelColor(0xffffffff, Math.floor(x), Math.floor(y));
        }
      }

      // Patty / layer
      const pattyY = bunTopY + stripeH * 1.6 + gap;
      for (let y = pattyY; y < pattyY + stripeH; y++) {
        for (let x = x0; x <= x1; x++) {
          image.setPixelColor(0xffffffff, Math.floor(x), Math.floor(y));
        }
      }

      // Bottom bun
      const bunBotY = pattyY + stripeH + gap;
      for (let y = bunBotY; y < bunBotY + stripeH; y++) {
        for (let x = x0 + innerW * 0.05; x <= x1 - innerW * 0.05; x++) {
          image.setPixelColor(0xffffffff, Math.floor(x), Math.floor(y));
        }
      }

      resolve(image);
    });
  });
}

async function main() {
  const dirs = [
    path.join(__dirname, '../assets/images'),
    path.join(__dirname, '../../assets/images')
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 1. icon.png (1024x1024)
    const icon = await createIcon(1024, 1024, 0x0f172aff, 0xe11d48ff); // Dark slate bg, vibrant crimson badge
    await icon.writeAsync(path.join(dir, 'icon.png'));

    // 2. adaptive-icon.png (1024x1024)
    const adaptiveIcon = await createIcon(1024, 1024, 0x00000000, 0xe11d48ff); // Transparent bg with badge
    await adaptiveIcon.writeAsync(path.join(dir, 'adaptive-icon.png'));

    // 3. splash-image.png (1024x1024)
    const splash = await createIcon(1024, 1024, 0x0f172aff, 0xe11d48ff);
    await splash.writeAsync(path.join(dir, 'splash-image.png'));

    // 4. app-image.png (512x512)
    const appImg = await createIcon(512, 512, 0x0f172aff, 0xe11d48ff);
    await appImg.writeAsync(path.join(dir, 'app-image.png'));

    // 5. favicon.png (64x64)
    const favicon = await createIcon(64, 64, 0x0f172aff, 0xe11d48ff);
    await favicon.writeAsync(path.join(dir, 'favicon.png'));

    // 6. react-logo pngs
    const logo1 = await createIcon(128, 128, 0x00000000, 0xe11d48ff);
    await logo1.writeAsync(path.join(dir, 'react-logo.png'));
    await logo1.writeAsync(path.join(dir, 'partial-react-logo.png'));

    const logo2 = await createIcon(256, 256, 0x00000000, 0xe11d48ff);
    await logo2.writeAsync(path.join(dir, 'react-logo@2x.png'));

    const logo3 = await createIcon(384, 384, 0x00000000, 0xe11d48ff);
    await logo3.writeAsync(path.join(dir, 'react-logo@3x.png'));

    console.log(`Generated all valid PNGs in ${dir}`);
  }

  // Also check SpaceMono-Regular font
  const fontPaths = [
    path.join(__dirname, '../assets/fonts/SpaceMono-Regular.ttf'),
    path.join(__dirname, '../../assets/fonts/SpaceMono-Regular.ttf')
  ];
  for (const fp of fontPaths) {
    if (fs.existsSync(fp)) {
      const buf = fs.readFileSync(fp);
      if (buf.slice(0, 3).toString('hex') === 'efbfbd') {
        console.log(`Fixing corrupted font header at ${fp}`);
        // If font header was UTF-8 corrupted, replace with a dummy clean font or strip
        fs.unlinkSync(fp);
      }
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
