// Pure, dependency-free storage path computation (no Meteor imports) so it can
// be unit tested directly with plain Node. Used by the attachment storage
// settings (Admin Panel > Attachments) and kept in sync with the path logic in
// models/attachments.js, models/avatars.js and server/initializeDirs.js.
//
// #6473: the Admin Panel used to compute these paths ON THE CLIENT from
// process.env.WRITABLE_PATH, which never exists in a browser, so it always
// showed "/data" — a path that does not exist on a Snap install
// (WRITABLE_PATH=$SNAP_COMMON/files there). The real paths are:
// - Docker  (WRITABLE_PATH=/data):              /data/files/{attachments,avatars}
// - Snap    (WRITABLE_PATH=$SNAP_COMMON/files): $SNAP_COMMON/files/{attachments,avatars}
// - Dev     (WRITABLE_PATH unset):              <cwd>/files/{attachments,avatars}
//
// Snap already appends '/files' to WRITABLE_PATH, so that case is detected and
// '/files' is not appended twice.
const path = require('path');

/**
 * Compute the real attachment/avatar storage paths for a given base path.
 * @param {string} [basePath] WRITABLE_PATH (falls back to process.cwd())
 * @return {{writablePath: string, attachments: string, avatars: string}}
 */
function computeStoragePaths(basePath) {
  const base = basePath || process.cwd();
  const endsWithFiles = base.endsWith('/files') || base.endsWith('\\files');
  const root = endsWithFiles ? base : path.join(base, 'files');
  return {
    writablePath: base,
    attachments: path.join(root, 'attachments'),
    avatars: path.join(root, 'avatars'),
  };
}

module.exports = { computeStoragePaths };
