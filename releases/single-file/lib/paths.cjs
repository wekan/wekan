'use strict';

// Where a single-file WeKan keeps everything that is not inside itself.
//
// The executable holds WeKan, Node.js and FerretDB. What it writes - the
// database, attachments, avatars, backups, logs, older versions - goes in ONE
// directory beside it, `wekan-files`, so the executable and its data can be
// moved or copied together. WRITABLE_PATH points there, and WeKan's own
// models/lib/filesRoot.js treats a directory named `wekan-files` as the files
// root, so attachments are `wekan-files/attachments`, not
// `wekan-files/files/attachments`.
//
// An explicit WRITABLE_PATH still wins, as on every other platform.

const path = require('node:path');
const { isFilesRoot } = require('../../../models/lib/filesRoot.js');

const SUBDIRS = ['attachments', 'avatars', 'db', 'bin', 'backup', 'logs', 'run', 'versions'];

/**
 * @param {object} opts
 * @param {string} opts.exePath the single-file executable (process.execPath)
 * @param {object} [opts.env] process.env, or a fake one
 * @param {object} [opts.pathImpl] path or path.win32/path.posix, for tests
 */
function layout({ exePath, env = {}, pathImpl = path }) {
  const exeDir = pathImpl.dirname(pathImpl.resolve(exePath));
  const writable = env.WRITABLE_PATH
    ? pathImpl.resolve(exeDir, env.WRITABLE_PATH)
    : pathImpl.join(exeDir, 'wekan-files');
  // Same rule as WeKan itself and start-wekan.sh: a WRITABLE_PATH that is not
  // already a files root gets /files appended.
  const files = isFilesRoot(writable) ? writable : pathImpl.join(writable, 'files');
  const dirs = {};
  for (const name of SUBDIRS) dirs[name] = pathImpl.join(files, name);
  return {
    exePath: pathImpl.resolve(exePath),
    exeDir,
    writable,
    files,
    ...dirs,
    envFile: pathImpl.join(files, 'wekan.env'),
    pidFile: pathImpl.join(files, 'run', 'wekan.pid'),
    logFile: pathImpl.join(files, 'logs', 'wekan.log'),
  };
}

module.exports = { SUBDIRS, layout };
