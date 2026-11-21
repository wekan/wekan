'use strict';
// The on-disk name of an uploaded file starts with its file id, which the
// CLIENT supplies (opts.meta.fileId) during an upload. Used verbatim, a value
// like "../../x" is a path traversal: an arbitrary file write on the server.
// Attachments checked it (UploadPathBleed); avatars, the same Meteor-Files
// pipeline, did not until 2026-10-02. One rule for both: it must look like the
// ids WeKan generates, or a fresh one is used and the attempt recorded.
// Pure apart from the record: tests/uploadFileId.test.cjs.
const SAFE_FILE_ID = /^[a-zA-Z0-9_-]{1,40}$/;

function isSafeUploadFileId(fileId) {
  return typeof fileId === 'string' && SAFE_FILE_ID.test(fileId);
}

// The id to use: the client's when it is safe, otherwise `fresh()`.
function safeUploadFileId(fileId, { source, fresh, isServer }) {
  if (isSafeUploadFileId(fileId)) return fileId;
  if (isServer) {
    try {
      // eslint-disable-next-line global-require
      require('/server/lib/securityLog').record({
        key: 'authz.upload-path', action: 'blocked', source,
        detail: 'rejected a malformed/unsafe fileId, generated a fresh one instead',
      });
    } catch (e) { /* logging must never break the upload */ }
  }
  return fresh();
}

// What a Meteor-Files namingFunction is given, read the same way for every
// collection (attachments, avatars): the file id the upload brought and the
// file's name without its extension. On the client both come from `opts.name`
// and `opts.meta.fileId`, and the id is taken out of `meta` - it was put there
// only for the namingFunction. On the server they are `opts.fileId` and
// `opts.file`. The id still has to go through safeUploadFileId.
function uploadNameParts(opts) {
  if (opts && opts.name) {
    const fileId = opts.meta && opts.meta.fileId;
    if (opts.meta) delete opts.meta.fileId;
    return { fileId, filenameWithoutExtension: opts.name.replace(/(.+)\..+/, '$1') };
  }
  if (opts && opts.file && opts.file.name) {
    const name = opts.file.name;
    // A literal suffix, never a RegExp built from the uploaded name. A file
    // with no extension keeps its whole name (extensionWithDot is then '.',
    // and removing it would cut the last character).
    const suffix = opts.file.extensionWithDot;
    const filenameWithoutExtension = opts.file.extension && name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
    return { fileId: opts.fileId, filenameWithoutExtension };
  }
  // Should never be reached.
  return {
    fileId: Math.random().toString(36).slice(2),
    filenameWithoutExtension: Math.random().toString(36).slice(2),
  };
}

module.exports = { SAFE_FILE_ID, isSafeUploadFileId, safeUploadFileId, uploadNameParts };
