'use strict';
// ZipBombBleed (2026-10-02): an import reads entries of an uploaded zip, and a
// zip entry inflates to whatever its compressed bytes say. The Trello zip
// import checked sizes from `entry.vars.uncompressedSize` - a field unzipper's
// directory entries do not have (the size is `entry.uncompressedSize`) - so
// every check saw 0, and a 305 KB archive inflated to 314 MB in memory per
// entry: any logged-in user could exhaust the server. A declared size is the
// archive's own claim anyway. Entries are read here, counting the bytes that
// actually come out, and stop past the limit.
// Pure apart from the stream: tests/zipBombBleed.test.cjs.

// The size the archive DECLARES for an entry (only a first filter).
function declaredZipEntrySize(entry) {
  const size = entry && (entry.uncompressedSize ?? (entry.vars && entry.vars.uncompressedSize));
  return Number.isFinite(Number(size)) ? Number(size) : 0;
}

// Read one entry into a Buffer, refusing it once more than maxBytes come out.
// `budget`, when given, is shared across entries: { remaining } bytes.
function readZipEntryBounded(entry, maxBytes, budget) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let done = false;
    const stream = entry.stream();
    const fail = error => {
      if (done) return;
      done = true;
      try { stream.destroy(); } catch (e) { /* already closed */ }
      reject(error);
    };
    stream.on('data', chunk => {
      total += chunk.length;
      if (budget) budget.remaining -= chunk.length;
      if (total > maxBytes) return fail(new Error('zip-entry-too-large'));
      if (budget && budget.remaining < 0) return fail(new Error('zip-too-large'));
      chunks.push(chunk);
    });
    stream.on('error', fail);
    stream.on('end', () => {
      if (done) return;
      done = true;
      resolve(Buffer.concat(chunks));
    });
  });
}

module.exports = { declaredZipEntrySize, readZipEntryBounded };
