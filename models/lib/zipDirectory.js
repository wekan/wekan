// A ZIP archive's central directory, read through a byte-range reader
// ({ size, bytes(start, end) }): the end records for where the directory is
// (ZIP64 as well), then the directory itself as far as it is iterated, and
// where an entry's data begins. No entry is inflated here. Pure: the
// slideshow's ZIP listing reads it through HTTP Range requests
// (client/lib/zipAttachmentViewer.js), and the server's preview conversion of
// an OpenDocument through its storage (server/lib/attachmentPreviewStore.js).

const EOCD = 0x06054b50;
const ZIP64_LOCATOR = 0x07064b50;
const ZIP64_EOCD = 0x06064b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;
const MAX_TAIL = 22 + 65535;

const u16 = (b, i) => b[i] | (b[i + 1] << 8);
const u32 = (b, i) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
const u64 = (b, i) => u32(b, i) + u32(b, i + 4) * 0x100000000;
const utf8 = new TextDecoder('utf-8');
const latin1 = new TextDecoder('latin1');

export class ZipDirectory {
  constructor(reader) {
    this.reader = reader;
  }

  // Where the central directory is: { count, offset, size }.
  async open() {
    const size = this.reader.size;
    if (size < 22) throw new Error('Invalid ZIP archive');
    const tailStart = Math.max(0, size - MAX_TAIL);
    const tail = await this.reader.bytes(tailStart, size);
    let at = -1;
    for (let i = tail.length - 22; i >= 0; i -= 1) {
      if (u32(tail, i) === EOCD) { at = i; break; }
    }
    if (at < 0) throw new Error('Invalid ZIP archive: no end of central directory');
    let count = u16(tail, at + 10);
    let cdSize = u32(tail, at + 12);
    let cdOffset = u32(tail, at + 16);
    if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
      const locAt = at - 20;
      const loc = locAt >= 0 ? tail.subarray(locAt, at) : await this.reader.bytes(tailStart + locAt, tailStart + at);
      if (loc.length === 20 && u32(loc, 0) === ZIP64_LOCATOR) {
        const z = await this.reader.bytes(u64(loc, 8), u64(loc, 8) + 56);
        if (z.length < 56 || u32(z, 0) !== ZIP64_EOCD) throw new Error('Invalid ZIP64 archive');
        count = u64(z, 32);
        cdSize = u64(z, 40);
        cdOffset = u64(z, 48);
      }
    }
    if (cdOffset + cdSize > size) throw new Error('Invalid ZIP archive: central directory outside the file');
    Object.assign(this, { count, offset: cdOffset, cdSize });
    return this;
  }

  // The central directory's entries in order: { name, method, compressedSize,
  // size, localOffset }. Reads only as far as it is iterated.
  async *entries() {
    const end = this.offset + this.cdSize;
    let at = this.offset;
    let buffer = new Uint8Array(0);
    let bufferAt = at;
    const need = async (from, length) => {
      while (from + length > bufferAt + buffer.length) {
        const more = await this.reader.bytes(bufferAt + buffer.length, Math.min(end, bufferAt + buffer.length + 65536));
        if (!more.length) throw new Error('Invalid ZIP archive: truncated central directory');
        const joined = new Uint8Array(buffer.length - (from - bufferAt) + more.length);
        joined.set(buffer.subarray(from - bufferAt));
        joined.set(more, buffer.length - (from - bufferAt));
        buffer = joined;
        bufferAt = from;
      }
      return buffer.subarray(from - bufferAt, from - bufferAt + length);
    };
    for (let n = 0; n < this.count && at + 46 <= end; n += 1) {
      const head = await need(at, 46);
      if (u32(head, 0) !== CENTRAL) throw new Error('Invalid ZIP archive: bad central directory entry');
      const nameLength = u16(head, 28);
      const extraLength = u16(head, 30);
      const commentLength = u16(head, 32);
      const flags = u16(head, 8);
      const entry = { method: u16(head, 10), compressedSize: u32(head, 20), size: u32(head, 24), localOffset: u32(head, 42) };
      const rest = await need(at + 46, nameLength + extraLength);
      const nameBytes = rest.subarray(0, nameLength);
      // Flag 11 says UTF-8; without it, names that are not UTF-8 are old DOS
      // code page bytes, shown as Latin-1 rather than as replacement marks.
      entry.name = utf8.decode(nameBytes);
      if (!(flags & 0x800) && entry.name.includes('\ufffd')) entry.name = latin1.decode(nameBytes);
      // ZIP64 sizes and offset, in the order the 0xFFFFFFFF fields come.
      const extra = rest.subarray(nameLength, nameLength + extraLength);
      for (let i = 0; i + 4 <= extra.length;) {
        const id = u16(extra, i);
        const len = u16(extra, i + 2);
        if (id === 1) {
          let j = i + 4;
          for (const key of ['size', 'compressedSize', 'localOffset']) {
            if (entry[key] === 0xffffffff && j + 8 <= i + 4 + len) { entry[key] = u64(extra, j); j += 8; }
          }
        }
        i += 4 + len;
      }
      at += 46 + nameLength + extraLength + commentLength;
      yield entry;
    }
  }

  // Where an entry's data begins: after its local header.
  async dataStart(entry) {
    const head = await this.reader.bytes(entry.localOffset, entry.localOffset + 30);
    if (head.length < 30 || u32(head, 0) !== LOCAL) throw new Error('Invalid ZIP archive: bad local header');
    return entry.localOffset + 30 + u16(head, 26) + u16(head, 28);
  }
}

