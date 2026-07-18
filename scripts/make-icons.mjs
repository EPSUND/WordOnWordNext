/**
 * Genererar app-ikonerna i public/ från spelets färger.
 *
 * Ritas för hand (bricka + gyllene "O") och kodas som PNG med node:zlib, så att
 * bygget inte behöver någon bildberoende. Kör om vid designändring:
 *   node scripts/make-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

// Spelets palett (se src/index.css).
const BOARD = [0x22, 0x36, 0x2e];
const TILE1 = [0xf5, 0xeb, 0xd7];
const TILE2 = [0xe7, 0xd6, 0xb4];
const RING = [0xd9, 0xa4, 0x41];

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** Täckningsgrad 0..1 för en rundad rektangel. */
function inRounded(x, y, w, h, r) {
  const cx = Math.min(Math.max(x, r), w - r);
  const cy = Math.min(Math.max(y, r), h - r);
  return Math.hypot(x - cx, y - cy) <= r;
}

function render(size) {
  const SS = 4; // supersampling – ger mjuka kanter utan ritbibliotek
  const n = size * SS;
  const pad = n * 0.06;
  const tileR = n * 0.18;
  const ringOuter = n * 0.3;
  const ringInner = n * 0.17;
  const cx = n / 2;
  const cy = n / 2;

  const acc = new Float64Array(size * size * 4);

  for (let sy = 0; sy < n; sy++) {
    for (let sx = 0; sx < n; sx++) {
      let px;
      const inTile = inRounded(sx - pad, sy - pad, n - 2 * pad, n - 2 * pad, tileR);
      if (!inTile) {
        px = BOARD;
      } else {
        // Bricka med samma diagonala gradient som i CSS (160deg).
        const t = (sx / n) * 0.35 + (sy / n) * 0.65;
        px = mix(TILE1, TILE2, t);
        const d = Math.hypot(sx - cx, sy - cy);
        if (d <= ringOuter && d >= ringInner) px = RING;
      }
      const dx = (sx / SS) | 0;
      const dy = (sy / SS) | 0;
      const o = (dy * size + dx) * 4;
      acc[o] += px[0];
      acc[o + 1] += px[1];
      acc[o + 2] += px[2];
      acc[o + 3] += 255;
    }
  }

  const per = SS * SS;
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size * 4; i++) rgba[i] = Math.round(acc[i] / per);
  return rgba;
}

/* --- Minimal PNG-kodare (RGBA8, filter 0) --- */
const crcTable = Array.from({ length: 256 }, (_, i) => {
  let c = i;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bitdjup
  ihdr[9] = 6; // färgtyp RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180], // iOS kräver PNG – SVG i manifestet räcker inte
]) {
  const buf = png(size, render(size));
  writeFileSync(join(OUT, name), buf);
  console.log(`${name.padEnd(22)} ${size}x${size}  ${(buf.length / 1024).toFixed(1)} kB`);
}
