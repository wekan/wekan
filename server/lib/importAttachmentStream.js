// Attachments brought in by an import - a WeKan .zip, a Trello .zip - are
// streamed into the default storage the Admin Panel configures, one at a time,
// and never held whole in memory, whatever their size. The only size limit is
// the one an administrator set for uploads (Admin Panel > Attachments >
// Limits, or ATTACHMENTS_UPLOAD_MAX_SIZE): an import is an upload too. With no
// limit set, there is none.
const { Transform } = require('stream');

// The upload limit in bytes; 0 means none.
async function importAttachmentLimit() {
  try {
    const { getAttachmentUploadMaxBytes } = require('/models/attachments.server');
    const limit = await getAttachmentUploadMaxBytes();
    return Number.isFinite(limit) && limit > 0 ? limit : 0;
  } catch (e) {
    return 0;
  }
}

// `source` piped through a counter that fails the stream once more than `max`
// bytes have passed, so a file over the limit is never written in full.
function limitStream(source, max) {
  if (!max) return source;
  let total = 0;
  const guard = new Transform({
    transform(chunk, encoding, done) {
      total += chunk.length;
      if (total > max) done(new Error('import-attachment-too-large'));
      else done(null, chunk);
    },
  });
  source.on('error', error => guard.destroy(error));
  return source.pipe(guard);
}

// Stream one imported attachment into storage. `declaredSize`, when the
// archive states it, lets a file over the limit be skipped before it is read.
// Returns the new file's reference, or { skipped: reason }.
async function writeImportedAttachment(stream, { fileName, type, meta, userId, declaredSize }) {
  const max = await importAttachmentLimit();
  if (max && Number.isFinite(declaredSize) && declaredSize > max) {
    try { stream.destroy(); } catch (e) { /* not opened */ }
    return { skipped: 'larger than the attachment upload limit' };
  }
  const { addAttachmentFromStream } = require('/models/lib/fileStoreStrategy');
  const { fileStoreStrategyFactory } = require('/models/attachments.server');
  try {
    return await addAttachmentFromStream(limitStream(stream, max), {
      fileName: fileName || 'attachment',
      type: type || 'application/octet-stream',
      userId,
      size: Number.isFinite(declaredSize) ? declaredSize : undefined,
      meta,
    }, fileStoreStrategyFactory);
  } catch (error) {
    if (error && error.message === 'import-attachment-too-large') return { skipped: 'larger than the attachment upload limit' };
    throw error;
  }
}

module.exports = { importAttachmentLimit, limitStream, writeImportedAttachment };
