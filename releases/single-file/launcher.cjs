'use strict';

// The single-file WeKan's entry point (docs/Platforms/Single-File.md).
//
// One executable per platform: Node.js with WeKan, FerretDB and these
// scripts embedded as a ZIP that Node mounts as a read-only virtual file
// system (SEA "useVfs"). Nothing is unpacked except FerretDB, which is a
// program of its own and is copied once to wekan-files/bin. Native addons
// are loaded from the VFS by Node itself.
//
// The same executable plays several roles, chosen by WEKAN_SINGLE_FILE_ROLE:
//
//   (unset)  the launcher: the menu, or a command (start, stop, status, ...)
//   server   WeKan's Meteor server, started by the launcher
//   script   one of the bundled .mjs helpers (sqlite-recovery.mjs, ...)
//
// Outside a SEA (tests, development) the "executable" is this Node.js plus
// this file, and WEKAN_SINGLE_FILE_APP may point at an unpacked archive.

const path = require('node:path');

// The archive keeps this repository's paths (releases/single-file/...,
// models/lib/filesRoot.js, bundle/...), so the app root is two directories up
// from here both inside the executable and in a checkout. The SEA's own main
// script is a one-line stub at the archive root that requires this file
// (releases/single-file/build.mjs).
function context() {
  let sea = false;
  try {
    sea = require('node:sea').isSea();
  } catch (e) {
    sea = false;
  }
  const appRoot = (!sea && process.env.WEKAN_SINGLE_FILE_APP)
    ? path.resolve(process.env.WEKAN_SINGLE_FILE_APP)
    : path.resolve(__dirname, '..', '..');
  if (sea) {
    return { sea: true, appRoot, exePath: process.execPath, self: [process.execPath] };
  }
  return {
    sea: false,
    appRoot,
    exePath: process.env.WEKAN_SINGLE_FILE_EXE || process.execPath,
    self: [process.execPath, __filename],
  };
}

async function main() {
  const ctx = context();
  // Before anything else writes a file: Node 26.11.1's VFS breaks
  // fs.writev/readv for every file while it is mounted (lib/vfsWorkarounds.cjs).
  if (ctx.sea) require('./lib/vfsWorkarounds.cjs').patchVectoredIo(require('node:fs'));
  const role = process.env.WEKAN_SINGLE_FILE_ROLE || '';
  if (role === 'server') {
    require('./lib/server.cjs').runServer(ctx.appRoot);
    return;
  }
  if (role === 'script') {
    const { pathToFileURL } = require('node:url');
    const script = path.join(ctx.appRoot, process.argv[2]);
    process.argv.splice(1, 2, script);
    await import(pathToFileURL(script).href);
    return;
  }
  const code = await require('./lib/cli.cjs').run(ctx, process.argv.slice(2));
  if (typeof code === 'number') process.exitCode = code;
}

main().catch(err => {
  console.error(`WeKan: ${err && err.message ? err.message : err}`);
  process.exitCode = 1;
});
