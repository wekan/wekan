'use strict';

// Node.js 26.11.1's virtual file system routes fs.writev() and fs.readv()
// through handlers it never defines. While any VFS is mounted - and in a
// single file one always is - every call to either throws
// "TypeError: h.writev is not a function", whatever file it is for. Nobody
// calls them directly, but every fs.WriteStream does as soon as it has more
// than one chunk queued: SQLite recovery's compressed snapshot, an attachment
// upload, a log file.
//
// fs.write() and fs.read() ARE routed correctly, so the two are replaced by
// equivalents built on them: writev as one write of the joined buffers,
// readv as one read split across the buffers. A partial write or read is
// reported as such, exactly as writev/readv report one, and WriteStream
// already loops until everything is written.
//
// fs.WriteStream looks fs.writev up on the fs module each time it writes, so
// replacing the exported function is enough. Remove this once a Node.js
// release defines the handlers (tests/singleFile.test.cjs says when).

function patchVectoredIo(fs) {
  if (fs.writev && fs.writev.wekanVfsWorkaround) return false;

  function writev(fd, buffers, position, callback) {
    if (typeof position === 'function') {
      callback = position;
      position = null;
    }
    const joined = Buffer.concat(buffers.map(b => Buffer.from(b.buffer, b.byteOffset, b.byteLength)));
    fs.write(fd, joined, 0, joined.length, typeof position === 'number' ? position : null,
      (err, written) => callback(err, written || 0, buffers));
  }
  writev.wekanVfsWorkaround = true;

  function readv(fd, buffers, position, callback) {
    if (typeof position === 'function') {
      callback = position;
      position = null;
    }
    const total = buffers.reduce((n, b) => n + b.byteLength, 0);
    const tmp = Buffer.alloc(total);
    fs.read(fd, tmp, 0, total, typeof position === 'number' ? position : null, (err, bytesRead) => {
      if (err) {
        callback(err, 0, buffers);
        return;
      }
      let offset = 0;
      for (const b of buffers) {
        if (offset >= bytesRead) break;
        const n = Math.min(b.byteLength, bytesRead - offset);
        tmp.copy(Buffer.from(b.buffer, b.byteOffset, b.byteLength), 0, offset, offset + n);
        offset += n;
      }
      callback(null, bytesRead, buffers);
    });
  }
  readv.wekanVfsWorkaround = true;

  fs.writev = writev;
  fs.readv = readv;
  return true;
}

module.exports = { patchVectoredIo };
