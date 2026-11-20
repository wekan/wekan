'use strict';
// Server-only: open an uploaded .zip from memory (a Buffer, as the Import page
// sent it in a method call) or from the local disk ({ file }: an upload
// streamed there by server/lib/importUpload.js), with the same checks - not
// empty, within its size, a zip by its first four bytes - and the same
// messages. A zip on disk is opened with unzipper.Open.file, which reads its
// central directory and each entry from the file as asked, so the archive is
// never in memory whole. A file's size limit is the import limit the caller
// passes (the administrator's, or none: the disk has room for it already).
const fs = require('fs');

const isZipMagic = head => {
  const magic = head && head.length >= 4 ? head.readUInt32LE(0) : 0;
  return magic === 0x04034b50 || magic === 0x06054b50;
};

async function openZipSource(source, { what, maxBytes }) {
  const unzipper = require('unzipper');
  if (source && typeof source.file === 'string') {
    const { size } = await fs.promises.stat(source.file);
    if (!size) throw new Error(`${what} is empty`);
    const limit = Number(source.maxBytes);
    if (limit > 0 && size > limit) throw new Error(`${what} is larger than ${limit} bytes`);
    const fd = await fs.promises.open(source.file, 'r');
    const head = Buffer.alloc(4);
    try { await fd.read(head, 0, 4, 0); } finally { await fd.close(); }
    if (!isZipMagic(head)) throw new Error(`${what} is not a .zip file`);
    try {
      return await unzipper.Open.file(source.file);
    } catch (error) {
      throw new Error(`${what} is not a readable .zip file`);
    }
  }
  if (!Buffer.isBuffer(source) || !source.length) throw new Error(`${what} is empty`);
  if (source.length > maxBytes) throw new Error(`${what} is larger than ${maxBytes} bytes`);
  if (!isZipMagic(source)) throw new Error(`${what} is not a .zip file`);
  try {
    return await unzipper.Open.buffer(source);
  } catch (error) {
    throw new Error(`${what} is not a readable .zip file`);
  }
}

module.exports = { openZipSource, isZipMagic };
