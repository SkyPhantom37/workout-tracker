/**
 * Generates PWA icons as PNGs using only Node.js built-ins.
 * Death-metal theme: iron cross in blood red (#8b0000) on near-black (#0a0a0a).
 */
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── PNG helpers ────────────────────────────────────────────────────────────────

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf    = Buffer.allocUnsafe(4);
  const crcBuf    = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function encodePNG(size, pixelBuf, outPath) {
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = ihdr[11] = ihdr[12] = 0; // RGB

  // Build raw scanlines (1 filter byte + RGB row)
  const rawRows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 3);
    row[0] = 0; // filter: None
    pixelBuf.copy(row, 1, y * size * 3, (y + 1) * size * 3);
    rawRows.push(row);
  }
  const idat = zlib.deflateSync(Buffer.concat(rawRows), { level: 9 });

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, png);
  console.log(`  [icons] generated ${path.basename(outPath)} (${size}x${size})`);
}

// ── Iron cross pixel renderer ──────────────────────────────────────────────────

function makeIronCrossPixels(size) {
  const buf = Buffer.alloc(size * size * 3);

  // Background: #0a0a0a
  const BG  = [10, 10, 10];
  // Cross body: #8b0000 (blood red)
  const CR  = [139, 0, 0];
  // Cross center highlight: #cc0000 (brighter red)
  const CHI = [204, 0, 0];
  // Border/edge: dim red
  const BOR = [70, 0, 0];

  // Fill background
  for (let i = 0; i < size * size; i++) {
    buf[i*3] = BG[0]; buf[i*3+1] = BG[1]; buf[i*3+2] = BG[2];
  }

  const setPixel = (x, y, col) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const p = (y * size + x) * 3;
    buf[p] = col[0]; buf[p+1] = col[1]; buf[p+2] = col[2];
  };

  const half     = size / 2;
  const halfArm  = size * 0.145;   // half the arm width  (~29% total width)
  const pad      = Math.round(size * 0.09); // padding from edges

  // ── Draw the iron cross ──────────────────────────────────────────────────────
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.abs(x + 0.5 - half);
      const dy = Math.abs(y + 0.5 - half);

      const inH = dy <= halfArm && x >= pad && x < size - pad;
      const inV = dx <= halfArm && y >= pad && y < size - pad;

      if (inH || inV) {
        const dist = Math.sqrt(dx * dx + dy * dy) / half;
        setPixel(x, y, dist < 0.18 ? CHI : CR);
      }
    }
  }

  // ── Iron-cross decorative notches ────────────────────────────────────────────
  // At the inner corners (where arms meet), carve out small triangular notches
  // by painting small diagonal lines in background color — gives the iconic
  // iron cross silhouette (angled inner corners) rather than a plain plus sign.
  const notch = Math.round(halfArm * 0.55);
  const q     = Math.round(half);
  const arms  = [
    [q - Math.round(halfArm), q - Math.round(halfArm)], // top-left corner
    [q + Math.round(halfArm), q - Math.round(halfArm)], // top-right corner
    [q - Math.round(halfArm), q + Math.round(halfArm)], // bottom-left corner
    [q + Math.round(halfArm), q + Math.round(halfArm)], // bottom-right corner
  ];
  const dirs = [[-1,-1],[1,-1],[-1,1],[1,1]];
  arms.forEach(([ox, oy], ci) => {
    const [sx, sy] = dirs[ci];
    for (let t = 0; t < notch; t++) {
      for (let s = 0; s <= t; s++) {
        setPixel(ox + sx * s, oy + sy * t, BG);
        setPixel(ox + sx * t, oy + sy * s, BG);
      }
    }
  });

  // ── Thin 2-px blood-red border ───────────────────────────────────────────────
  const T = 2;
  for (let i = 0; i < size; i++) {
    for (let t = 0; t < T; t++) {
      setPixel(t, i, BOR);
      setPixel(size - 1 - t, i, BOR);
      setPixel(i, t, BOR);
      setPixel(i, size - 1 - t, BOR);
    }
  }

  return buf;
}

// ── Generate all sizes ─────────────────────────────────────────────────────────

const publicDir = path.join(__dirname, '..', 'public');
const pixels192 = makeIronCrossPixels(192);
const pixels512 = makeIronCrossPixels(512);

encodePNG(192, pixels192, path.join(publicDir, 'icon-192.png'));
encodePNG(512, pixels512, path.join(publicDir, 'icon-512.png'));
encodePNG(192, pixels192, path.join(publicDir, 'apple-touch-icon.png'));
