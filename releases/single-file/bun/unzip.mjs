// Reads a ZIP archive held in memory and writes it out to a directory, for the
// Bun single-file launcher (releases/single-file/bun/launcher.mjs). Bun has no
// unzip of its own, and the archive is the platform's published Bun bundle
// exactly as released, so it can be any ZIP that `zip` or 7-Zip writes:
// stored or deflated entries, ZIP64 (a bundle has more than 65,535 files),
// Unix modes and symbolic links.
//
// An entry whose name would land outside the target directory - an absolute
// path, a drive letter, or a `..` segment - is refused, and so is a symbolic
// link that points outside it ("Zip Slip"). Pure Node APIs, so
// tests/bunSingleFile.test.cjs runs it without Bun.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SIG_EOCD = 0x06054b50;
const SIG_EOCD64 = 0x06064b50;
const SIG_EOCD64_LOCATOR = 0x07064b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;
const S_IFMT = 0o170000;
const S_IFLNK = 0o120000;
const S_IFDIR = 0o040000;

function findEocd(buf) {
  const min = Math.max(0, buf.length - 0xffff - 22);
  for (let i = buf.length - 22; i >= min; i -= 1) {
    if (buf.readUInt32LE(i) === SIG_EOCD) return i;
  }
  throw new Error('not a ZIP archive: no end of central directory');
}

function readBig(buf, at) {
  const value = buf.readBigUInt64LE(at);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('ZIP64 value too large');
  return Number(value);
}

/** The entries of a ZIP archive: name, sizes, offset, method, mode. */
export function listEntries(buf) {
  const eocd = findEocd(buf);
  let count = buf.readUInt16LE(eocd + 10);
  let cdOffset = buf.readUInt32LE(eocd + 16);
  const locator = eocd - 20;
  if (locator >= 0 && buf.readUInt32LE(locator) === SIG_EOCD64_LOCATOR) {
    const eocd64 = readBig(buf, locator + 8);
    if (buf.readUInt32LE(eocd64) !== SIG_EOCD64) throw new Error('bad ZIP64 end of central directory');
    count = readBig(buf, eocd64 + 32);
    cdOffset = readBig(buf, eocd64 + 48);
  }
  const entries = [];
  let at = cdOffset;
  for (let n = 0; n < count; n += 1) {
    if (buf.readUInt32LE(at) !== SIG_CENTRAL) throw new Error(`bad central directory entry ${n}`);
    const madeBy = buf.readUInt16LE(at + 4);
    const flags = buf.readUInt16LE(at + 8);
    const method = buf.readUInt16LE(at + 10);
    let compressed = buf.readUInt32LE(at + 20);
    let size = buf.readUInt32LE(at + 24);
    const nameLen = buf.readUInt16LE(at + 28);
    const extraLen = buf.readUInt16LE(at + 30);
    const commentLen = buf.readUInt16LE(at + 32);
    const external = buf.readUInt32LE(at + 38);
    let offset = buf.readUInt32LE(at + 42);
    const name = buf.toString(flags & 0x800 ? 'utf8' : 'latin1', at + 46, at + 46 + nameLen);
    // ZIP64 extra field: the values that were 0xffffffff, in this order.
    let extra = at + 46 + nameLen;
    const extraEnd = extra + extraLen;
    while (extra + 4 <= extraEnd) {
      const id = buf.readUInt16LE(extra);
      const len = buf.readUInt16LE(extra + 2);
      if (id === 0x0001) {
        let p = extra + 4;
        if (size === 0xffffffff) { size = readBig(buf, p); p += 8; }
        if (compressed === 0xffffffff) { compressed = readBig(buf, p); p += 8; }
        if (offset === 0xffffffff) { offset = readBig(buf, p); p += 8; }
      }
      extra += 4 + len;
    }
    const unixMode = (madeBy >> 8) === 3 ? (external >>> 16) : 0;
    entries.push({ name, method, compressed, size, offset, mode: unixMode, flags });
    at = extraEnd + commentLen;
  }
  return entries;
}

/** The bytes of one entry. */
export function entryData(buf, entry) {
  if (buf.readUInt32LE(entry.offset) !== SIG_LOCAL) throw new Error(`bad local header: ${entry.name}`);
  const start = entry.offset + 30 + buf.readUInt16LE(entry.offset + 26) + buf.readUInt16LE(entry.offset + 28);
  const raw = buf.subarray(start, start + entry.compressed);
  if (entry.flags & 0x1) throw new Error(`encrypted entry: ${entry.name}`);
  if (entry.method === 0) return raw;
  if (entry.method === 8) return zlib.inflateRawSync(raw);
  throw new Error(`unsupported compression method ${entry.method}: ${entry.name}`);
}

/**
 * Where an entry goes below `root`, after `strip` is removed from its name;
 * null for the entry `strip` itself. Throws for a name that leaves `root`.
 */
export function safeTarget(root, name, strip = '') {
  let rel = name.replace(/\\/g, '/');
  if (strip) {
    if (rel === strip || rel === `${strip}/`) return null;
    if (!rel.startsWith(`${strip}/`)) throw new Error(`entry outside ${strip}/: ${name}`);
    rel = rel.slice(strip.length + 1);
  }
  if (!rel || rel.startsWith('/') || /^[A-Za-z]:/.test(rel) || rel.split('/').includes('..')) {
    throw new Error(`unsafe path in archive: ${name}`);
  }
  const target = path.resolve(root, rel);
  const base = path.resolve(root);
  if (target !== base && !target.startsWith(base + path.sep)) throw new Error(`unsafe path in archive: ${name}`);
  return target;
}

/**
 * Writes the archive below `root`. `strip` drops a leading directory
 * ("bundle"); `skip(rel)` leaves entries out. Returns the number of files.
 */
export function extractZip(buf, root, { strip = '', skip = () => false } = {}) {
  const base = path.resolve(root);
  fs.mkdirSync(base, { recursive: true });
  let files = 0;
  for (const entry of listEntries(buf)) {
    const target = safeTarget(base, entry.name, strip);
    if (!target) continue;
    const rel = path.relative(base, target).split(path.sep).join('/');
    if (skip(rel)) continue;
    const kind = entry.mode & S_IFMT;
    if (entry.name.endsWith('/') || kind === S_IFDIR) {
      fs.mkdirSync(target, { recursive: true });
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const data = entryData(buf, entry);
    if (kind === S_IFLNK) {
      const link = data.toString('utf8');
      const resolved = path.resolve(path.dirname(target), link);
      if (path.isAbsolute(link) || (resolved !== base && !resolved.startsWith(base + path.sep))) {
        throw new Error(`symbolic link leaves the bundle: ${entry.name} -> ${link}`);
      }
      if (process.platform !== 'win32') fs.symlinkSync(link, target);
      continue;
    }
    fs.writeFileSync(target, data);
    const mode = entry.mode & 0o777;
    if (mode && process.platform !== 'win32') fs.chmodSync(target, mode);
    files += 1;
  }
  return files;
}
