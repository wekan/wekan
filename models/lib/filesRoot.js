'use strict';

// Is WRITABLE_PATH already the files root, or does WeKan append "files"?
//
// - Docker and dev (WRITABLE_PATH=/data or ..): WeKan appends /files, so
//   attachments are at /data/files/attachments.
// - Snap (WRITABLE_PATH=$SNAP_COMMON/files): already the files root.
// - Single-file WeKan (releases/single-file): WRITABLE_PATH is the
//   wekan-files directory beside the executable, and is already the files
//   root, so attachments are at wekan-files/attachments and the database at
//   wekan-files/db.
//
// "files" keeps its exact old rule (a separator before it, no trailing
// slash), so no existing install's files move. "wekan-files" is new: the
// last path segment must be exactly that, so /srv/my-files still gets
// /files appended, as it always did.
// No imports, so it works on the client and in release scripts too.
function isFilesRoot(base) {
  const b = String(base || '');
  if (b.endsWith('/files') || b.endsWith('\\files')) return true;
  return b === 'wekan-files' || b.endsWith('/wekan-files') || b.endsWith('\\wekan-files');
}

module.exports = { isFilesRoot };
