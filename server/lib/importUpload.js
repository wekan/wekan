'use strict';
// Server-only: an Import page upload received a part at a time and written to
// the local disk, never held whole in memory. The browser POSTs the chosen
// file's bytes to /api/import/upload/:source (server/routes/importUpload.js);
// this module writes them under <WRITABLE_PATH>/import-uploads, refusing
//   - before the first byte, a Content-Length over the administrator's limit
//     (Admin Panel: largest import, `importMaxMegabytes`; none set means no
//     limit) or over the free disk space (server/lib/importDiskSpace.js);
//   - while it streams, the byte past the limit, and - checked every
//     CHECK_EVERY bytes - the moment the disk has no more room;
// and removes the partial file when it refuses or the connection drops. The
// finished file is registered for the user who sent it, for one hour, and is
// read by its upload id from models/import.js (importBoard's data.uploadId).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { roomFor, ImportSpaceError } = require('./importDiskSpace');

const CHECK_EVERY = 64 * 1024 * 1024;
const UPLOAD_TTL_MS = 60 * 60 * 1000;
const uploads = new Map();

function uploadDir(env = process.env) {
  return path.join(env.WRITABLE_PATH || path.join(require('os').tmpdir(), 'wekan'), 'import-uploads');
}

// Stream `req` to a new file. Resolves { uploadId, size, file }.
// limit: bytes, 0 for none. room: async () => bytes free for it (for tests).
function receiveUpload(req, { userId, source, limit = 0, dir = uploadDir(), room = () => roomFor(dir) } = {}) {
  return new Promise((resolve, reject) => {
    // Listened for at once: a connection that drops while the directory is
    // made and the space measured would otherwise be missed, and the upload
    // would wait for bytes that never come.
    let gone = null;
    let ended = false;
    const early = error => { if (!gone) gone = error; };
    const onAbort = () => early(new ImportSpaceError('import-upload-aborted', 'The upload was interrupted'));
    req.on('aborted', onAbort);
    req.on('error', early);
    req.on('end', () => { ended = true; });
    req.on('close', () => { if (!ended) onAbort(); });
    (async () => {
      const declared = Number(req.headers && req.headers['content-length']);
      if (limit && Number.isFinite(declared) && declared > limit) {
        throw new ImportSpaceError('import-too-large', `The file is ${declared} bytes; the largest import allowed is ${limit} bytes`);
      }
      await fs.promises.mkdir(dir, { recursive: true });
      const free = await room();
      if (Number.isFinite(declared) && declared > free) {
        throw new ImportSpaceError('import-disk-full', `The file is ${declared} bytes; ${free} bytes are free for it`);
      }
      if (gone) throw gone;
      const uploadId = crypto.randomBytes(16).toString('hex');
      const file = path.join(dir, `${uploadId}.upload`);
      const out = fs.createWriteStream(file, { flags: 'wx' });
      let total = 0;
      let nextCheck = Math.min(CHECK_EVERY, free);
      let done = false;
      const fail = error => {
        if (done) return;
        done = true;
        try { req.unpipe(out); } catch (e) { /* not piped */ }
        out.destroy();
        fs.promises.unlink(file).catch(() => {});
        reject(error);
      };
      req.on('data', chunk => {
        total += chunk.length;
        if (limit && total > limit) {
          fail(new ImportSpaceError('import-too-large', `The file is larger than the largest import allowed, ${limit} bytes`));
          return;
        }
        if (total >= nextCheck) {
          req.pause();
          room().then(left => {
            // What is left must hold what is still to come, when it was announced.
            const toCome = Number.isFinite(declared) ? Math.max(0, declared - total) : 0;
            if (left <= 0 || toCome > left) {
              fail(new ImportSpaceError('import-disk-full', `The disk has no room for the rest of the file (${total} bytes written)`));
              return;
            }
            nextCheck = total + Math.min(CHECK_EVERY, left);
            if (!done) req.resume();
          }, fail);
        }
      });
      req.on('aborted', () => fail(new ImportSpaceError('import-upload-aborted', 'The upload was interrupted')));
      req.on('close', () => { if (!ended) fail(new ImportSpaceError('import-upload-aborted', 'The upload was interrupted')); });
      req.on('error', fail);
      out.on('error', error => fail(error && error.code === 'ENOSPC'
        ? new ImportSpaceError('import-disk-full', 'The disk filled up while the file was written') : error));
      out.on('finish', () => {
        if (done) return;
        done = true;
        uploads.set(uploadId, { userId, source, file, size: total, expires: Date.now() + UPLOAD_TTL_MS });
        resolve({ uploadId, size: total, file });
      });
      req.pipe(out);
    })().catch(reject);
  });
}

// The upload `uploadId` of this user, or null - an id is only ever the
// sender's, for the source it was sent for, while it has not expired.
function takeUpload(uploadId, userId, source) {
  const entry = typeof uploadId === 'string' && /^[0-9a-f]{32}$/.test(uploadId) ? uploads.get(uploadId) : null;
  if (!entry || entry.userId !== userId || (source && entry.source !== source) || entry.expires < Date.now()) return null;
  return entry;
}

async function removeUpload(uploadId) {
  const entry = uploads.get(uploadId);
  uploads.delete(uploadId);
  if (entry) await fs.promises.unlink(entry.file).catch(() => {});
}

// Expired uploads, and files left by a server that stopped, are removed.
async function sweepUploads(dir = uploadDir(), now = Date.now()) {
  for (const [id, entry] of uploads) if (entry.expires < now) await removeUpload(id);
  let names = [];
  try { names = await fs.promises.readdir(dir); } catch (e) { return; }
  for (const name of names) {
    const id = name.replace(/\.upload$/, '');
    if (uploads.has(id)) continue;
    const file = path.join(dir, name);
    try {
      const stat = await fs.promises.stat(file);
      if (now - stat.mtimeMs > UPLOAD_TTL_MS) await fs.promises.unlink(file);
    } catch (e) { /* gone already */ }
  }
}

module.exports = { receiveUpload, takeUpload, removeUpload, sweepUploads, uploadDir, CHECK_EVERY, UPLOAD_TTL_MS };
