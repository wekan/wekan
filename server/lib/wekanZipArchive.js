'use strict';

const { Transform } = require('stream');

const DEFAULT_MAX_ENTRIES = 10000;
const DEFAULT_MAX_DOCUMENT_BYTES = 64 * 1024 * 1024;
const DEFAULT_MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const DEFAULT_MAX_TOTAL_UNCOMPRESSED = 10 * 1024 * 1024 * 1024;

function positiveLimit(name, fallback) {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

const ZIP_LIMITS = Object.freeze({
  entries: positiveLimit('WEKAN_IMPORT_ZIP_MAX_ENTRIES', DEFAULT_MAX_ENTRIES),
  documentBytes: positiveLimit('WEKAN_IMPORT_ZIP_MAX_DOCUMENT_BYTES',
    DEFAULT_MAX_DOCUMENT_BYTES),
  fileBytes: positiveLimit('WEKAN_IMPORT_ZIP_MAX_FILE_BYTES', DEFAULT_MAX_FILE_BYTES),
  totalBytes: positiveLimit('WEKAN_IMPORT_ZIP_MAX_EXPANDED_BYTES',
    DEFAULT_MAX_TOTAL_UNCOMPRESSED),
});

function archiveError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function safeArchivePath(value) {
  const name = String(value || '');
  if (!name || name.includes('\0') || name.includes('\\') || name.startsWith('/')
    || /^[A-Za-z]:/.test(name)) return false;
  const parts = name.split('/');
  return parts.every(part => part && part !== '.' && part !== '..');
}

function declaredSize(entry) {
  const size = Number(entry?.vars?.uncompressedSize);
  return Number.isSafeInteger(size) && size >= 0 ? size : 0;
}

function boundedEntryStream(entry, maximum, consumeBytes = null) {
  let read = 0;
  const limiter = new Transform({
    transform(chunk, encoding, callback) {
      read += chunk.length;
      if (read > maximum) {
        callback(archiveError('import-zip-file-too-large'));
        return;
      }
      try {
        if (consumeBytes) consumeBytes(chunk.length);
        callback(null, chunk);
      } catch (error) {
        callback(error);
      }
    },
  });
  return entry.stream().pipe(limiter);
}

async function readDocument(entry) {
  if (declaredSize(entry) > ZIP_LIMITS.documentBytes) {
    throw archiveError('import-zip-document-too-large');
  }
  const bytes = await entry.buffer();
  if (bytes.length > ZIP_LIMITS.documentBytes) {
    throw archiveError('import-zip-document-too-large');
  }
  try {
    return { document: JSON.parse(bytes.toString('utf8')), bytes: bytes.length };
  } catch (_) {
    throw archiveError('error-json-malformed');
  }
}

// Open one WeKan ZIP export without extracting paths to the filesystem. The
// central directory is inspected before a document or attachment is inflated,
// and the returned attachment streams enforce the same bound against dishonest
// size metadata while Default Storage consumes them one at a time.
async function readWekanZipArchive(tempPath, context = {}) {
  const unzipper = require('unzipper');
  const directory = await unzipper.Open.file(tempPath);
  const files = directory.files.filter(entry => entry.type === 'File');
  if (files.length > ZIP_LIMITS.entries) throw archiveError('import-zip-too-many-files');

  let total = 0;
  let documentEntry = null;
  const attachmentEntries = new Map();
  for (const entry of files) {
    if (!safeArchivePath(entry.path)) throw archiveError('import-zip-unsafe-path');
    const size = declaredSize(entry);
    if (size > ZIP_LIMITS.fileBytes) throw archiveError('import-zip-file-too-large');
    total += size;
    if (!Number.isSafeInteger(total) || total > ZIP_LIMITS.totalBytes) {
      throw archiveError('import-zip-expanded-too-large');
    }
    if (/(^|\/)wekan\.json$/.test(entry.path)) {
      if (documentEntry) throw archiveError('import-zip-duplicate-document');
      documentEntry = entry;
      continue;
    }
    const match = /(?:^|\/)attachments\/([^/]+)$/.exec(entry.path);
    if (!match) continue;
    const dash = match[1].indexOf('-');
    const id = dash === -1 ? match[1] : match[1].slice(0, dash);
    if (!id || attachmentEntries.has(id)) throw archiveError('import-zip-duplicate-attachment');
    attachmentEntries.set(id, entry);
  }
  if (!documentEntry) throw archiveError('import-not-wekan-export');

  const parsed = await readDocument(documentEntry);
  let actualTotal = parsed.bytes;
  const consumeBytes = count => {
    actualTotal += count;
    if (!Number.isSafeInteger(actualTotal) || actualTotal > ZIP_LIMITS.totalBytes) {
      throw archiveError('import-zip-expanded-too-large');
    }
  };
  const doc = require('/server/lib/secureTransfer').secureTransfer(parsed.document, {
    direction: 'import', source: 'import:zip', userId: context.userId,
    ip: context.ip,
  });
  if (doc._format && doc._format !== 'wekan-board-1.0.0') {
    throw archiveError('invalid-format');
  }
  return {
    doc,
    attachmentStream(attachment) {
      const entry = attachmentEntries.get(attachment?._id);
      return entry ? boundedEntryStream(entry, ZIP_LIMITS.fileBytes, consumeBytes) : null;
    },
  };
}

module.exports = {
  ZIP_LIMITS,
  archiveError,
  boundedEntryStream,
  declaredSize,
  readWekanZipArchive,
  safeArchivePath,
};
