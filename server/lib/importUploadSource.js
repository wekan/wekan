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
  if (spec && spec.send === 'excel') {
    const base64 = (await fs.promises.readFile(file)).toString('base64');
    return source === 'plane' ? { xlsxBase64: base64 } : { excelBase64: base64 };
  }
  if (source === 'plane' && /\.xlsx$/i.test(upload.name || '')) {
    return { xlsxBase64: (await fs.promises.readFile(file)).toString('base64') };
  }
  const text = (await fs.promises.readFile(file, 'utf8')).replace(/^\uFEFF/, '');
  if (spec && spec.send === 'json') {
    try { return JSON.parse(text); } catch (e) { throw new UploadError('invalid-import-format', 'The file is not JSON'); }
  }
  return text;
}

module.exports = { uploadedImportValue, UploadError };
