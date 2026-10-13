'use strict';

// Runs WeKan's Meteor server straight out of the executable's virtual file
// system. This is what bundle/main.js does, minus the one thing a virtual
// file system cannot give it:
//
//   process.argv.splice(2, 0, 'program.json');
//   process.chdir(<bundle>/programs/server);     <- this
//   require('./programs/server/runtime.js')(...);
//   require('./programs/server/boot.js');
//
// A working directory is the kernel's, and the kernel has no idea the bundle
// exists: chdir() into the VFS fails with ENOTDIR. So the working directory is
// made VIRTUAL instead: process.cwd() answers the bundle's programs/server,
// which is what path.resolve() and Node's VFS routing of relative fs paths
// both ask, while the process's real working directory stays wekan-files.
// program.json is passed as an absolute path, which is all boot.js needs to
// find every other server file.

const path = require('node:path');
const fs = require('node:fs');

function installVirtualCwd(start, { proc = process, fsImpl = fs, isVirtual } = {}) {
  let cwd = start;
  const realChdir = proc.chdir.bind(proc);
  proc.cwd = function cwdVirtual() {
    return cwd;
  };
  proc.chdir = function chdirVirtual(dir) {
    const target = path.resolve(cwd, String(dir));
    if (isVirtual(target)) {
      if (!fsImpl.statSync(target).isDirectory()) {
        const err = new Error(`ENOTDIR: not a directory, chdir '${target}'`);
        err.code = 'ENOTDIR';
        throw err;
      }
    } else {
      realChdir(target);
    }
    cwd = target;
  };
  return () => cwd;
}

function runServer(appRoot) {
  const serverDir = path.join(appRoot, 'bundle', 'programs', 'server');
  const root = path.resolve(appRoot);
  installVirtualCwd(serverDir, {
    isVirtual: p => p === root || p.startsWith(root + path.sep),
  });
  process.argv.splice(2, 0, path.join(serverDir, 'program.json'));
  require(path.join(serverDir, 'runtime.js'))({ cachePath: process.env.METEOR_REIFY_CACHE_DIR });
  require(path.join(serverDir, 'boot.js'));
}

module.exports = { installVirtualCwd, runServer };
