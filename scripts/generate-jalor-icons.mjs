#!/usr/bin/env node
'use strict';

// ---------------------------------------------------------------------------
// Jalor — render the application icons from the Jalor mark.
//
//   node scripts/generate-jalor-icons.mjs
//
// The mark (public/jalor-mark.svg) is three ascending bars - jalons - in white
// on Bleu France. It is drawn with nothing but rectangles ON PURPOSE: that is
// what lets this script rasterise it at every size a browser, a phone or a
// Windows tile asks for, with no image library, no font and no SVG renderer,
// on any machine that has Node. Re-run it after changing the mark and the whole
// icon set follows.
//
// Written here rather than by hand: an icon set drifts. WeKan's had a favicon,
// a maskable icon, a monochrome icon, three Microsoft tiles and four Apple
// sizes, and the only way to keep sixteen files saying the same thing is to
// generate them from one description.
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(repoRoot, 'public');

// Bleu France, the DSFR's primary (--background-action-high-blue-france).
const BLUE = [0x00, 0x00, 0x91, 0xff];
const WHITE = [0xff, 0xff, 0xff, 0xff];
const CLEAR = [0x00, 0x00, 0x00, 0x00];

// The mark, in a 64x64 grid - the same numbers as public/jalor-mark.svg.
// tests/jalorIcons.test.cjs holds the two together.
export const MARK_BARS = [
  { x: 12, y: 34, w: 10, h: 18 },
  { x: 27, y: 24, w: 10, h: 28 },
  { x: 42, y: 14, w: 10, h: 38 },
];
const GRID = 64;

// --- A very small PNG writer ------------------------------------------------
// 8-bit RGBA, no interlacing, one zlib stream, filter 0 on every row. That is
// the simplest legal PNG and every browser reads it.

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) {
      c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let crc = -1;
  for (let i = 0; i < buf.length; i += 1) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Drawing ----------------------------------------------------------------

function canvas(width, height, colour) {
  const buf = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    buf[i * 4] = colour[0];
    buf[i * 4 + 1] = colour[1];
    buf[i * 4 + 2] = colour[2];
    buf[i * 4 + 3] = colour[3];
  }
  return buf;
}

function fillRect(buf, width, height, x0, y0, w, h, colour) {
  const xs = Math.max(0, Math.round(x0));
  const ys = Math.max(0, Math.round(y0));
  const xe = Math.min(width, Math.round(x0 + w));
  const ye = Math.min(height, Math.round(y0 + h));
  for (let y = ys; y < ye; y += 1) {
    for (let x = xs; x < xe; x += 1) {
      const i = (y * width + x) * 4;
      buf[i] = colour[0];
      buf[i + 1] = colour[1];
      buf[i + 2] = colour[2];
      buf[i + 3] = colour[3];
    }
  }
}

// One icon. `inset` is the share of the shortest side left empty around the
// mark - 0 for a favicon, 0.2 for a maskable icon, whose outer fifth a phone
// may crop into a circle.
function renderMark(width, height, { background = BLUE, bars = WHITE, inset = 0 } = {}) {
  const buf = canvas(width, height, background);
  const side = Math.min(width, height) * (1 - inset * 2);
  const scale = side / GRID;
  const offsetX = (width - GRID * scale) / 2;
  const offsetY = (height - GRID * scale) / 2;
  for (const b of MARK_BARS) {
    fillRect(buf, width, height,
      offsetX + b.x * scale, offsetY + b.y * scale,
      b.w * scale, b.h * scale, bars);
  }
  return encodePng(width, height, buf);
}

// --- ICO --------------------------------------------------------------------
// A .ico is a 6-byte header, one 16-byte directory entry per image, then the
// images. Since Vista an entry may hold a whole PNG rather than a DIB, which is
// what every browser in use reads and what keeps this short.
function encodeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = [];
  for (const img of images) {
    const e = Buffer.alloc(16);
    e[0] = img.size >= 256 ? 0 : img.size; // 0 means 256
    e[1] = img.size >= 256 ? 0 : img.size;
    e[2] = 0; // palette
    e[3] = 0;
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(img.data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += img.data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

// --- What to write ----------------------------------------------------------
// Every file here is one a browser, a phone home screen or a Windows tile
// actually asks for - the set referenced by imports/lib/customHeadDefaults.js
// and client/components/main/layouts.jade.
const SQUARE_ICONS = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512],
  ['Square44x44Logo.scale-100.png', 44],
  ['Square150x150Logo.scale-100.png', 150],
  ['StoreLogo.scale-100.png', 50],
  ['mstile-70x70.png', 70],
  ['mstile-144x144.png', 144],
  ['mstile-150x150.png', 150],
  ['mstile-310x310.png', 310],
];

function main() {
  const written = [];
  const write = (rel, data) => {
    const full = path.join(publicDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, data);
    written.push(rel);
  };

  for (const [name, size] of SQUARE_ICONS) write(name, renderMark(size, size));

  // The wide Microsoft tile: the mark on the left of a Bleu France band, the
  // way the mark sits at the start of the header bar.
  const wide = canvas(310, 150, BLUE);
  const scale = 110 / GRID;
  for (const b of MARK_BARS) {
    fillRect(wide, 310, 150, 20 + b.x * scale, 20 + b.y * scale, b.w * scale, b.h * scale, WHITE);
  }
  write('mstile-310x150.png', encodePng(310, 150, wide));

  // Maskable: the same mark, inset so a circular crop cannot cut a bar.
  write('maskable_icon.png', renderMark(474, 474, { inset: 0.2 }));

  // Monochrome: the shape alone on transparency, for a platform that recolours
  // it (Android's themed icons).
  write('monochrome-icon-512x512.png',
    renderMark(512, 512, { background: CLEAR, bars: WHITE, inset: 0.1 }));

  // The header bar's raster fallback, at the size the header reserves.
  const header = canvas(97, 28, CLEAR);
  const hs = 22 / GRID;
  for (const b of MARK_BARS) {
    fillRect(header, 97, 28, 3 + b.x * hs, 3 + b.y * hs, b.w * hs, b.h * hs, WHITE);
  }
  write('jalor-logo-header.png', encodePng(97, 28, header));

  write('favicon.ico', encodeIco([16, 32, 48].map((size) => ({
    size,
    data: renderMark(size, size),
  }))));

  console.log(`generate-jalor-icons: wrote ${written.length} files into public/`);
  for (const w of written) console.log(`  ${w}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
