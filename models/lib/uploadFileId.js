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

module.exports = { SAFE_FILE_ID, isSafeUploadFileId, safeUploadFileId };
