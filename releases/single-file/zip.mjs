// A small ZIP writer for the single-file archive (releases/single-file/build.mjs).
//
// Written here rather than shelling out to `zip`, because the archive is built
// on Linux, macOS and Windows runners alike, and the format Node's SEA virtual
// file system reads (deflate or stored entries, one central directory) is
// small enough to write directly. Entries are deflated, except those that
// would not shrink, which are stored.
//
// No ZIP64: an archive over 4 GiB or 65,535 entries is refused with a clear
// error instead of being written in a form the reader might not take. A
// trimmed WeKan bundle is about a tenth of either limit.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const LIMIT_32 = 0xffffffff;
const LIMIT_16 = 0xffff;

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

/**
 * Lists the regular files below `dir` as archive entries. Symbolic links are
 * skipped: in a Meteor bundle they are only node_modules/.bin launchers,
 * which a server never runs.
 * @returns {{name: string, file: string}[]} sorted by name
 */
export function listFiles(dir, prefix = '', { exclude = () => false } = {}) {
  const out = [];
  const walk = (abs, rel) => {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const childAbs = path.join(abs, entry.name);
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (exclude(childRel, entry)) continue;
      if (entry.isDirectory()) walk(childAbs, childRel);
      else if (entry.isFile()) out.push({ name: prefix + childRel, file: childAbs });
    }
  };
  walk(dir, '');
  return out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/**
 * Writes `entries` ({name, file} or {name, data}) to `output`.
 * The modification time is fixed (`mtime`), so the same inputs give the same
 * archive bytes.
 */
export function writeZip(output, entries, { mtime = new Date(2000, 0, 1) } = {}) {
  if (entries.length > LIMIT_16) {
    throw new Error(`${entries.length} files is more than a ZIP without ZIP64 can hold (${LIMIT_16}).`);
  }
  const names = new Set();
  const { time, day } = dosDateTime(mtime);
  const fd = fs.openSync(output, 'w');
  const central = [];
  let offset = 0;
  const write = buf => {
    fs.writeSync(fd, buf);
    offset += buf.length;
  };
  try {
    for (const entry of entries) {
      const name = entry.name.replace(/\\/g, '/');
      if (!name || name.startsWith('/') || name.split('/').includes('..')) {
        throw new Error(`Refusing archive entry name "${entry.name}".`);
      }
      if (names.has(name)) throw new Error(`Duplicate archive entry "${name}".`);
      names.add(name);
      const data = entry.data !== undefined ? Buffer.from(entry.data) : fs.readFileSync(entry.file);
      const crc = zlib.crc32(data) >>> 0;
      const deflated = zlib.deflateRawSync(data, { level: 9 });
      const stored = deflated.length >= data.length;
      const body = stored ? data : deflated;
      if (offset > LIMIT_32 || body.length > LIMIT_32 || data.length > LIMIT_32) {
        throw new Error('The archive is larger than 4 GiB, which needs ZIP64.');
      }
      const nameBuf = Buffer.from(name, 'utf8');
      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034b50, 0);
      local.writeUInt16LE(20, 4); // version needed
      local.writeUInt16LE(0x0800, 6); // UTF-8 names
      local.writeUInt16LE(stored ? 0 : 8, 8);
      local.writeUInt16LE(time, 10);
      local.writeUInt16LE(day, 12);
      local.writeUInt32LE(crc, 14);
      local.writeUInt32LE(body.length, 18);
      local.writeUInt32LE(data.length, 22);
      local.writeUInt16LE(nameBuf.length, 26);
      local.writeUInt16LE(0, 28);
      const headerOffset = offset;
      write(local);
      write(nameBuf);
      write(body);
      const cen = Buffer.alloc(46);
      cen.writeUInt32LE(0x02014b50, 0);
      cen.writeUInt16LE((3 << 8) | 20, 4); // made by: Unix, 2.0
      cen.writeUInt16LE(20, 6);
      cen.writeUInt16LE(0x0800, 8);
      cen.writeUInt16LE(stored ? 0 : 8, 10);
      cen.writeUInt16LE(time, 12);
      cen.writeUInt16LE(day, 14);
      cen.writeUInt32LE(crc, 16);
      cen.writeUInt32LE(body.length, 20);
      cen.writeUInt32LE(data.length, 24);
      cen.writeUInt16LE(nameBuf.length, 28);
      // extra, comment, disk number, internal attributes: 0
      const mode = entry.mode || 0o100644;
      cen.writeUInt32LE((mode << 16) >>> 0, 38);
      cen.writeUInt32LE(headerOffset, 42);
      central.push(cen, nameBuf);
    }
    const centralOffset = offset;
    for (const part of central) write(part);
    const centralSize = offset - centralOffset;
    if (offset > LIMIT_32) throw new Error('The archive is larger than 4 GiB, which needs ZIP64.');
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(entries.length, 8);
    end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(centralSize, 12);
    end.writeUInt32LE(centralOffset, 16);
    write(end);
  } finally {
    fs.closeSync(fd);
  }
  return { entries: entries.length, bytes: offset };
}
