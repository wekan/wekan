'use strict';
// Server-only: what importBoard reads for an Import page upload that was
// streamed to the local disk (server/lib/importUpload.js), by the source's
// own way of reading (models/lib/importSources.js):
//   a .zip that is one export of the tool -> { zipFile, maxBytes, inflateLimit }
//                                            (opened from disk, never whole)
//   mail                                  -> { mboxFile }   (a message at a time)
//   a workbook                            -> { excelBase64 } / { xlsxBase64 }
//   JSON                                  -> the parsed document
//   text                                  -> the text
// A zip's entries may inflate to the administrator's limit, or with none to
// the free disk space - what unpacking it there could take.
const fs = require('fs');
const { takeUpload } = require('./importUpload');
const { roomFor, importLimitBytes } = require('./importDiskSpace');
const { isZipMagic } = require('./zipSource');

class UploadError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

async function startsAsZip(file) {
  const fd = await fs.promises.open(file, 'r');
  const head = Buffer.alloc(4);
  try { await fd.read(head, 0, 4, 0); } finally { await fd.close(); }
  return isZipMagic(head);
}

async function uploadedImportValue(uploadId, userId, source, { setting = {}, spec } = {}) {
  const upload = takeUpload(uploadId, userId, source);
  if (!upload) throw new UploadError('import-upload-not-found', 'The uploaded file is not there any more; choose it again');
  const { file } = upload;
  const limit = importLimitBytes(setting);
  if (spec && spec.zipSend === 'zip' && await startsAsZip(file)) {
    const room = await roomFor(require('path').dirname(file));
    return { zipFile: file, maxBytes: limit, inflateLimit: limit || (room === Infinity ? 0 : room) };
  }
  if (source === 'mail') return { mboxFile: file };
  // CSV/TSV: the rows, parsed on the server as the page parses a pasted text.
  if (source === 'csv') {
    try {
      return await require('./csvUpload').readCsvUploadRows(file);
    } catch (e) {
      throw new UploadError(e.code || 'invalid-import-format', e.message);
    }
  }
  if (spec && spec.send === 'excel') {
    const base64 = (await fs.promises.readFile(file)).toString('base64');
    return source === 'plane' ? { xlsxBase64: base64 } : { excelBase64: base64 };
  }
  if (source === 'plane' && /\.xlsx$/i.test(upload.name || '')) {
    return { xlsxBase64: (await fs.promises.readFile(file)).toString('base64') };
  }
  // JSON is built from the file a chunk at a time (server/lib/streamJson.js):
  // a JavaScript string cannot exceed about 512 MB, so a larger export could
  // not be read as text at all.
  if (spec && spec.send === 'json') {
    try {
      return await require('./streamJson').parseJsonStream(fs.createReadStream(file, { encoding: 'utf8' }));
    } catch (e) {
      throw new UploadError('invalid-import-format', `The file is not JSON: ${e.message}`);
    }
  }
  // A Mattermost bulk export is JSON Lines: read a line at a time, each line
  // parsed on its own.
  if (source === 'mattermost') {
    const readline = require('readline');
    const lines = [];
    let n = 0;
    for await (const line of readline.createInterface({ input: fs.createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity })) {
      n += 1;
      if (!line.trim()) continue;
      try { lines.push(JSON.parse(n === 1 ? line.replace(/^\uFEFF/, '') : line)); } catch (e) {
        throw new UploadError('invalid-import-format', `Line ${n} is not JSON`);
      }
    }
    return { jsonLines: lines };
  }
  // The other text formats are parsed as one text; past what one string can
  // hold that is refused with its reason rather than failing as out of memory.
  const { size } = await fs.promises.stat(file);
  if (size > MAX_TEXT_BYTES) {
    throw new UploadError('import-too-large', `A ${source} file is read as one text, at most ${MAX_TEXT_BYTES} bytes`);
  }
  return (await fs.promises.readFile(file, 'utf8')).replace(/^\uFEFF/, '');
}
const MAX_TEXT_BYTES = 256 * 1024 * 1024;

module.exports = { uploadedImportValue, UploadError, MAX_TEXT_BYTES };
