/**
 * Bağımlılıksız basit PNG üretici — PWA manifest ikonlarını oluşturur.
 * (Ağ erişimi olmadan/harici görsel araç olmadan çalışacak şekilde raw pixel + zlib ile yazılmıştır.)
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePng(size, drawPixel) {
  const width = size;
  const height = size;
  const raw = Buffer.alloc((width * 4 + 1) * height);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // filter type: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const idat = zlib.deflateSync(raw);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function drawIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radius = w * 0.48;

  // Arka plan: koyu deniz mavisi
  let r = 10, g = 20, b = 32, a = 255;

  if (dist <= radius) {
    // Radar halkaları (radar/sonar teması)
    const ringWidth = w * 0.035;
    const rings = [radius * 0.35, radius * 0.62, radius * 0.9];
    const onRing = rings.some((ring) => Math.abs(dist - ring) < ringWidth);

    if (onRing) {
      r = 34; g = 197; b = 94; a = 255; // yeşil radar halkası
    } else {
      r = 15; g = 30, b = 46; a = 255;
    }

    // Basit levrek silueti (merkeze yakın, elips gövde + kuyruk üçgeni)
    const bodyDx = (x - cx) / (w * 0.34);
    const bodyDy = (y - cy) / (h * 0.16);
    const inBody = bodyDx * bodyDx + bodyDy * bodyDy <= 1 && x < cx + w * 0.12;
    const tailX = (x - cx) / w;
    const tailY = (y - cy) / h;
    const inTail =
      x >= cx + w * 0.08 &&
      x <= cx + w * 0.24 &&
      Math.abs(y - cy) <= (x - (cx + w * 0.08)) * 0.9 + h * 0.02;

    if (inBody || inTail) {
      r = 226; g = 244; b = 233; a = 255; // açık renk balık gövdesi
    }
  } else {
    r = 5; g = 11, b = 20, a = 255;
  }

  return [r, g, b, a];
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const png = makePng(size, drawIcon);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log(`icon-${size}.png oluşturuldu`);
}

// Maskable icon (aynı görsel, kenar boşluğu manifest'te safe-zone ile ayarlanır)
const maskable = makePng(512, drawIcon);
fs.writeFileSync(path.join(outDir, "icon-maskable-512.png"), maskable);
console.log("icon-maskable-512.png oluşturuldu");
