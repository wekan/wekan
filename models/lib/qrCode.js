'use strict';

// A small QR Code encoder (ISO/IEC 18004) for the card menu's "QR code of
// this card" (#2015): byte mode, error correction level M, versions 1-10 - up
// to 213 bytes, which every card URL fits. Pure, no dependency: drawn in the
// browser, with nothing sent anywhere. tests/qrCode.test.cjs checks it against
// qrcode-svg, the encoder Meteor's own accounts-2fa ships.

// Level M, versions 1-10: [error-correction codewords per block,
// [blocks, data codewords per block], ...groups].
const BLOCKS_M = [
  null,
  [10, [1, 16]], [16, [1, 28]], [26, [1, 44]], [18, [2, 32]], [24, [2, 43]],
  [16, [4, 27]], [18, [4, 31]], [22, [2, 38], [2, 39]], [22, [3, 36], [2, 37]], [26, [4, 43], [1, 44]],
];
const ALIGNMENT = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const MAX_VERSION = 10;

// GF(256) with the QR polynomial x^8 + x^4 + x^3 + x^2 + 1.
const EXP = new Array(512);
const LOG = new Array(256);
for (let i = 0, x = 1; i < 255; i += 1) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function generator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function errorCorrection(data, degree) {
  const gen = generator(degree);
  const rest = data.concat(new Array(degree).fill(0));
  for (let i = 0; i < data.length; i += 1) {
    const factor = rest[i];
    if (factor === 0) continue;
    for (let j = 0; j < gen.length; j += 1) rest[i + j] ^= gfMul(gen[j], factor);
  }
  return rest.slice(data.length);
}

const dataCapacity = version => BLOCKS_M[version].slice(1).reduce((sum, [count, size]) => sum + count * size, 0);

/** The smallest version (1-10) whose level-M byte capacity holds `length` bytes, or 0. */
function versionFor(length) {
  for (let v = 1; v <= MAX_VERSION; v += 1) {
    const countBits = v < 10 ? 8 : 16;
    if (4 + countBits + 8 * length <= 8 * dataCapacity(v)) return v;
  }
  return 0;
}

function codewords(bytes, version) {
  const bits = [];
  const put = (value, length) => { for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1); };
  put(0b0100, 4);
  put(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) put(b, 8);
  const capacityBits = 8 * dataCapacity(version);
  for (let i = 0; i < 4 && bits.length < capacityBits; i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let pad = 0xec; data.length < capacityBits / 8; pad ^= 0xec ^ 0x11) data.push(pad);

  // Split into blocks, add error correction to each, then interleave.
  const [ecLength, ...groups] = BLOCKS_M[version];
  const blocks = [];
  let at = 0;
  for (const [count, size] of groups) {
    for (let i = 0; i < count; i += 1) {
      const block = data.slice(at, at + size);
      at += size;
      blocks.push({ data: block, ec: errorCorrection(block, ecLength) });
    }
  }
  const out = [];
  const longest = Math.max(...blocks.map(b => b.data.length));
  for (let i = 0; i < longest; i += 1) for (const b of blocks) if (i < b.data.length) out.push(b.data[i]);
  for (let i = 0; i < ecLength; i += 1) for (const b of blocks) out.push(b.ec[i]);
  return out;
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  r => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r * c) % 3) + ((r + c) % 2)) % 2 === 0,
];

function bch(value, poly, shift) {
  let v = value << shift;
  const top = Math.floor(Math.log2(poly));
  while (v && Math.floor(Math.log2(v)) >= top) v ^= poly << (Math.floor(Math.log2(v)) - top);
  return (value << shift) | v;
}

// The matrix for one mask: modules[row][col], true = dark.
function build(version, words, mask) {
  const size = version * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(null));
  const finder = (row, col) => {
    for (let r = -1; r <= 7; r += 1) {
      for (let c = -1; c <= 7; c += 1) {
        if (row + r < 0 || row + r >= size || col + c < 0 || col + c >= size) continue;
        const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6));
        const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[row + r][col + c] = inRing || inCore;
      }
    }
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  for (const r of ALIGNMENT[version]) {
    for (const c of ALIGNMENT[version]) {
      if (m[r][c] !== null) continue;
      for (let dr = -2; dr <= 2; dr += 1) {
        for (let dc = -2; dc <= 2; dc += 1) m[r + dr][c + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
      }
    }
  }
  for (let i = 8; i < size - 8; i += 1) {
    if (m[i][6] === null) m[i][6] = i % 2 === 0;
    if (m[6][i] === null) m[6][i] = i % 2 === 0;
  }
  // Format information: level M (00) and the mask, BCH-protected and masked.
  const format = bch((0b00 << 3) | mask, 0x537, 10) ^ 0x5412;
  for (let i = 0; i < 15; i += 1) {
    const bit = ((format >> i) & 1) === 1;
    if (i < 6) m[i][8] = bit;
    else if (i < 8) m[i + 1][8] = bit;
    else m[size - 15 + i][8] = bit;
    if (i < 8) m[8][size - i - 1] = bit;
    else if (i < 9) m[8][15 - i - 1 + 1] = bit;
    else m[8][15 - i - 1] = bit;
  }
  m[size - 8][8] = true;
  if (version >= 7) {
    const info = bch(version, 0x1f25, 12);
    for (let i = 0; i < 18; i += 1) {
      const bit = ((info >> i) & 1) === 1;
      m[Math.floor(i / 3)][(i % 3) + size - 11] = bit;
      m[(i % 3) + size - 11][Math.floor(i / 3)] = bit;
    }
  }
  // Data, in the zigzag order, masked.
  let bitIndex = 0;
  const totalBits = words.length * 8;
  for (let col = size - 1, up = true; col > 0; col -= 2, up = !up) {
    if (col === 6) col -= 1;
    for (let k = 0; k < size; k += 1) {
      const row = up ? size - 1 - k : k;
      for (let c = col; c > col - 2; c -= 1) {
        if (m[row][c] !== null) continue;
        let dark = false;
        if (bitIndex < totalBits) dark = ((words[bitIndex >> 3] >> (7 - (bitIndex & 7))) & 1) === 1;
        bitIndex += 1;
        m[row][c] = MASKS[mask](row, c) ? !dark : dark;
      }
    }
  }
  return m;
}

// The standard's penalty score; the mask with the lowest is used.
function penalty(m) {
  const size = m.length;
  let score = 0;
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < size; i += 1) {
      let run = 1;
      for (let j = 1; j <= size; j += 1) {
        const same = j < size && (pass ? m[j][i] === m[j - 1][i] : m[i][j] === m[i][j - 1]);
        if (same) run += 1;
        else { if (run >= 5) score += run - 2; run = 1; }
      }
    }
  }
  for (let r = 0; r < size - 1; r += 1) {
    for (let c = 0; c < size - 1; c += 1) {
      const v = m[r][c];
      if (v === m[r + 1][c] && v === m[r][c + 1] && v === m[r + 1][c + 1]) score += 3;
    }
  }
  const finderLike = [true, false, true, true, true, false, true];
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j + 7 <= size; j += 1) {
      for (const pass of [0, 1]) {
        const at = k => (pass ? m[j + k][i] : m[i][j + k]);
        if (!finderLike.every((v, k) => at(k) === v)) continue;
        const light = (from, to) => { for (let k = from; k < to; k += 1) { const x = j + k; if (x >= 0 && x < size && (pass ? m[x][i] : m[i][x])) return false; } return true; };
        if (light(-4, 0) || light(7, 11)) score += 40;
      }
    }
  }
  let dark = 0;
  for (const row of m) for (const v of row) if (v) dark += 1;
  score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
  return score;
}

/**
 * The QR Code of a text: { size, modules, version, mask }, or null when it is
 * too long for version 10 (213 bytes). `mask` forces one (0-7), for tests.
 */
function encodeQr(text, { mask } = {}) {
  const bytes = Array.from(new TextEncoder().encode(String(text)));
  const version = versionFor(bytes.length);
  if (!version) return null;
  const words = codewords(bytes, version);
  if (Number.isInteger(mask)) return { version, mask, size: version * 4 + 17, modules: build(version, words, mask) };
  let best = null;
  for (let candidate = 0; candidate < 8; candidate += 1) {
    const modules = build(version, words, candidate);
    const score = penalty(modules);
    if (!best || score < best.score) best = { version, mask: candidate, size: modules.length, modules, score };
  }
  delete best.score;
  return best;
}

/** An SVG of the code, with a quiet zone of four modules; dark modules as one path. */
function qrSvg(text, { scale = 4, label = '' } = {}) {
  const code = encodeQr(text);
  if (!code) return '';
  const quiet = 4;
  const full = code.size + quiet * 2;
  let path = '';
  code.modules.forEach((row, r) => row.forEach((dark, c) => { if (dark) path += `M${c + quiet} ${r + quiet}h1v1h-1z`; }));
  const title = String(label).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${full} ${full}" width="${full * scale}" height="${full * scale}" role="img"${title ? ` aria-label="${title}"` : ''} shape-rendering="crispEdges"><rect width="${full}" height="${full}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}

module.exports = { encodeQr, qrSvg, versionFor };
