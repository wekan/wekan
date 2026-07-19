'use strict';

// General, storage-agnostic file-type detection + extension correction.
//
// The problem this solves (reported in the field): files were uploaded with a
// WRONG or MISSING extension, so double-clicking them on the desktop opened the
// wrong application. This detects the REAL type from the file's first bytes and
// re-stores the attachment/avatar with the correct extension.
//
// It reuses the same streaming approach the attachment migration/move code uses
// (models/lib/fileStoreStrategy.js: getReadStream()/moveToStorage()), so it works
// for every storage backend — filesystem, GridFS and cloud — without loading the
// whole file into RAM: only a small header is streamed to WRITABLE_PATH/files/temp,
// the `file` command detects the MIME type, and the temp file is deleted again.

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { sanitizeUploadFileName, numberedName } = require('./uploadFileName');
const { sanitizeFilename } = require('./filenameSanitizer');

// How many bytes from the start of the file are enough to detect its type. libmagic
// (`file`) reads only a small header; 64 KiB is generous and keeps RAM/disk tiny.
const HEADER_BYTES = 64 * 1024;

// Resolve WRITABLE_PATH/files/temp from the factory's storage path
// (WRITABLE_PATH/files/attachments -> WRITABLE_PATH/files/temp) and make sure it
// exists. Returns the temp directory path.
function ensureTempDir(storagePath) {
  const tempDir = path.join(path.dirname(String(storagePath || process.cwd())), 'temp');
  try {
    fs.mkdirSync(tempDir, { recursive: true });
  } catch (e) {
    // Directory may already exist or be un-createable; the caller handles write
    // errors from the actual temp file below.
  }
  return tempDir;
}

// Stream at most maxBytes from readStream into tempPath, then stop reading (so a
// large file is never fully read). Resolves when the header is written, rejects on
// any error after removing the partial temp file.
function streamHeaderToTemp(readStream, tempPath, maxBytes = HEADER_BYTES) {
  return new Promise((resolve, reject) => {
    let written = 0;
    let done = false;
    const writeStream = fs.createWriteStream(tempPath);

    const cleanupAndReject = err => {
      if (done) return;
      done = true;
      try { readStream.destroy(); } catch (e) { /* ignore */ }
      try { writeStream.destroy(); } catch (e) { /* ignore */ }
      fs.promises.unlink(tempPath).catch(() => {}); // remove partial header
      reject(err);
    };

    const finish = () => {
      if (done) return;
      done = true;
      try { readStream.destroy(); } catch (e) { /* ignore */ }
      writeStream.end(() => resolve(tempPath));
    };

    readStream.on('error', cleanupAndReject);
    writeStream.on('error', cleanupAndReject);

    readStream.on('data', chunk => {
      if (done) return;
      let buf = chunk;
      if (written + buf.length >= maxBytes) {
        buf = buf.slice(0, maxBytes - written);
        writeStream.write(buf);
        written += buf.length;
        finish(); // enough header collected — stop streaming
        return;
      }
      written += buf.length;
      writeStream.write(buf);
    });
    readStream.on('end', finish);
  });
}

// Run `file --mime-type -b <path>` (no shell — path passed as an argv element, so
// a hostile filename cannot inject a command) and return the lowercase MIME
// string, or undefined if the `file` binary is unavailable or fails.
function fileCommandMime(filePath) {
  return new Promise(resolve => {
    execFile('file', ['--mime-type', '-b', String(filePath)], (err, stdout) => {
      if (err) {
        resolve(undefined);
        return;
      }
      const m = String(stdout || '').trim().toLowerCase();
      resolve(m || undefined);
    });
  });
}

// Detect the real MIME type of an existing stored file by streaming a small header
// to a temp file, running `file` on it, then deleting the temp file. storage-agnostic.
// Returns the MIME string or undefined.
async function detectStoredFileMime(fileObj, fileStoreStrategyFactory, versionName = 'original') {
  if (!fileObj || !fileObj.versions || !fileStoreStrategyFactory) return undefined;
  const version = fileObj.versions[versionName] || fileObj.versions[Object.keys(fileObj.versions)[0]];
  if (!version) return undefined;

  const strategy = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName in fileObj.versions ? versionName : Object.keys(fileObj.versions)[0]);
  let readStream;
  try {
    readStream = strategy.getReadStream();
  } catch (e) {
    return undefined;
  }
  if (!readStream) return undefined; // source missing at its recorded location

  const tempDir = ensureTempDir(fileStoreStrategyFactory.storagePath);
  const tempPath = path.join(tempDir, `${fileObj._id}-detect-${process.pid}-${version.size || 0}`);

  try {
    await streamHeaderToTemp(readStream, tempPath);
    const detected = await fileCommandMime(tempPath);
    return detected;
  } catch (e) {
    return undefined;
  } finally {
    fs.promises.unlink(tempPath).catch(() => {}); // always delete the temp file
  }
}

// Compute the corrected name for an existing file from its detected MIME type,
// WITHOUT touching storage. Returns { name, changed, detectedMime }.
async function correctedNameForStoredFile(fileObj, fileStoreStrategyFactory) {
  const detectedMime = await detectStoredFileMime(fileObj, fileStoreStrategyFactory);
  if (!detectedMime) {
    return { name: fileObj && fileObj.name, changed: false, detectedMime: undefined };
  }
  const corrected = sanitizeUploadFileName(fileObj.name, detectedMime);
  return {
    name: corrected,
    changed: corrected !== fileObj.name,
    detectedMime,
  };
}

// Two stored files are the "same file" (may share a name) when they have the same
// size and, when both carry a timestamp, the same timestamp. Different size or a
// different date means different content that must get its own numbered name.
function sameStoredContent(a, b) {
  if (!a || !b) return false;
  if ((a.size || 0) !== (b.size || 0)) return false;
  const da = a.updatedAt || a.uploadedAtOstrio || a.uploadedAt;
  const db = b.updatedAt || b.uploadedAtOstrio || b.uploadedAt;
  if (da && db && new Date(da).getTime() !== new Date(db).getTime()) return false;
  return true;
}

// Return a name unique within the collection: if another document already has the
// desired name AND is a different file (different size/date), append an increasing
// "-N" until free; if the clashing document is the same content, share the name.
async function disambiguateName(collection, fileObj, desiredName) {
  if (!collection || typeof collection.findOneAsync !== 'function') return desiredName;
  let candidate = desiredName;
  for (let i = 0; i < 1000; i++) {
    let clash;
    try {
      clash = await collection.findOneAsync({ _id: { $ne: fileObj._id }, name: candidate });
    } catch (e) {
      return candidate; // query failed — do not block the migration
    }
    if (!clash) return candidate;
    if (sameStoredContent(clash, fileObj)) return candidate;
    candidate = numberedName(desiredName, i + 1);
  }
  return candidate;
}

// The general "finalize the stored filename at the destination" used by
// migrations/moves: detect the real file type, correct the extension + strip
// invisible/exploit chars + fold homoglyphs + cap the length (sanitizeUploadFileName),
// keep it path-safe (sanitizeFilename), and disambiguate different-content
// same-name collisions with increasing numbering. Returns { name, changed }.
async function finalizeStoredFileName(collection, fileObj, fileStoreStrategyFactory) {
  if (!fileObj) return { name: fileObj && fileObj.name, changed: false };
  let detectedMime;
  try {
    detectedMime = await detectStoredFileMime(fileObj, fileStoreStrategyFactory);
  } catch (e) { /* detection unavailable — fall back to the client type below */ }
  let desired = sanitizeUploadFileName(fileObj.name, detectedMime || fileObj.type);
  desired = sanitizeFilename(desired); // path-traversal + on-disk byte cap
  const finalName = await disambiguateName(collection, fileObj, desired);
  return { name: finalName, changed: finalName !== fileObj.name, detectedMime };
}

module.exports = {
  HEADER_BYTES,
  ensureTempDir,
  streamHeaderToTemp,
  detectStoredFileMime,
  correctedNameForStoredFile,
  sameStoredContent,
  disambiguateName,
  finalizeStoredFileName,
};
