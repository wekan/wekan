#!/usr/bin/env node
// Raise the node-gyp a built bundle compiles its native modules with.
//
//     node releases/bump-bundle-node-gyp.mjs [bundle dir] [--dry-run]
//
// Run it ONCE, on the amd64 bundle, right after `meteor build` and BEFORE the
// first `npm install` in `<bundle>/programs/server`. Every other architecture's
// bundle is that bundle with `programs/server` reinstalled from the same
// package.json, so one rewrite here travels to all of them - Windows included.
//
// Why. `programs/server/package.json` is Meteor's `meteor-dev-bundle`, and the
// bundler writes its `node-gyp` pin from the node-gyp inside the Meteor tool
// itself (tools/isobuild/bundler.js: `serverPkgJson.dependencies["node-gyp"] =
// require("node-gyp/package.json").version`). Meteor 3.5.2 carries node-gyp
// 10.2.0, and nothing in this repository's package.json or overrides reaches
// that file. The shrinkwrap beside it does not list node-gyp at all, so the
// pin in package.json is the only thing `npm install` consults for it.
//
// That pin is what stopped the v11.70 release on both Windows legs. On
// 2026-09-07 GitHub's `windows-latest` moved to the `windows-2025-vs2026`
// image, which carries Visual Studio 18 (2026) and no longer Visual Studio 17
// (2022). node-gyp 10.2.0 knows the major versions 15, 16 and 17 and nothing
// newer, so argon2's install script (`node-gyp-build`, which always compiles
// on Windows because the Linux-made `.bin/` shims it probes with are not
// `.cmd` files) died with:
//
//   gyp ERR! find VS unknown version "undefined" found at
//     "C:\Program Files\Microsoft Visual Studio\18\Enterprise"
//   gyp ERR! find VS could not find a version of Visual Studio 2017 or newer to use
//
// node-gyp 12.1.0 (2025-11-12) added Visual Studio 2026, and 13.0.1/13.0.2
// fixed its version detection ("fix windows vs2026 version", nodejs/node-gyp
// #3338). The minimum below is the newest of those; it is only ever RAISED, so
// a Meteor release that one day ships a newer node-gyp keeps its own.
//
// What it does. Reads `<bundle>/programs/server/package.json`, and when
// `dependencies["node-gyp"]` is below MIN_NODE_GYP, replaces it with
// MIN_NODE_GYP and writes the file back with the same 2-space layout the
// bundler used. Nothing else in the file is touched, and a bundle without a
// node-gyp pin is left alone: there is nothing to raise.

import fs from 'fs';
import path from 'path';

// The oldest node-gyp that detects Visual Studio 2026 (18.x) correctly.
export const MIN_NODE_GYP = '13.0.2';

const parse = v => String(v).split('.').map(n => parseInt(n, 10) || 0);
export const isBelow = (have, want) => {
  const a = parse(have);
  const b = parse(want);
  for (let i = 0; i < 3; i += 1) {
    if ((a[i] || 0) < (b[i] || 0)) return true;
    if ((a[i] || 0) > (b[i] || 0)) return false;
  }
  return false;
};

// Rewrite the pin in one server package.json. Returns what it decided so a
// caller (or the test) can see it without re-reading the file.
export function bumpNodeGyp(serverPkgPath, { dryRun = false, min = MIN_NODE_GYP } = {}) {
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(serverPkgPath, 'utf8'));
  } catch (e) {
    return { status: 'unreadable', error: e.message };
  }
  const have = pkg.dependencies && pkg.dependencies['node-gyp'];
  if (!have) return { status: 'no-pin' };
  // A pin that is not a plain version (a range, a tarball URL) is somebody
  // else's decision; only an exact version below the minimum is raised.
  if (!/^\d+\.\d+\.\d+$/.test(have)) return { status: 'kept', have };
  if (!isBelow(have, min)) return { status: 'kept', have };
  pkg.dependencies['node-gyp'] = min;
  if (!dryRun) {
    try {
      fs.writeFileSync(serverPkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    } catch (e) {
      return { status: 'unwritable', have, error: e.message };
    }
  }
  return { status: 'bumped', have, now: min };
}

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isMain) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const bundle = args.find(a => !a.startsWith('--')) || 'bundle';
  const serverPkgPath = path.join(bundle, 'programs', 'server', 'package.json');
  const result = bumpNodeGyp(serverPkgPath, { dryRun });
  const tag = 'bump-bundle-node-gyp:';
  switch (result.status) {
    case 'unreadable':
      console.error(`${tag} cannot read ${serverPkgPath}: ${result.error}`);
      process.exit(1);
      break;
    case 'unwritable':
      console.error(`${tag} node-gyp ${result.have} must be raised to ${MIN_NODE_GYP}` +
        ` but ${serverPkgPath} cannot be written: ${result.error}`);
      process.exit(1);
      break;
    case 'no-pin':
      console.log(`${tag} ${serverPkgPath} pins no node-gyp; nothing to raise`);
      break;
    case 'kept':
      console.log(`${tag} node-gyp ${result.have} is already >= ${MIN_NODE_GYP}; kept`);
      break;
    case 'bumped':
      console.log(`${tag} node-gyp ${result.have} -> ${result.now}` +
        `${dryRun ? ' (dry run, not written)' : ''} in ${serverPkgPath}`);
      break;
    default:
      break;
  }
}
