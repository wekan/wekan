#!/usr/bin/env node
'use strict';

// Trim a built Meteor bundle down to what the target platform actually runs.
//
// Usage: node releases/bundle-trim.mjs <bundle-dir> [--platform linux] [--arch x64] [--keep-maps]
//
// WHY THIS EXISTS
//
// Sandstorm refuses an app over 1 GiB uncompressed, and v10.93 through v10.95
// failed to pack for exactly that reason. Measuring the bundle rather than
// guessing at it (the size report in release-all.yml's build-sandstorm job)
// turned up two passengers that are large, useless on the target, and safe to
// drop. Together they are ~280 MB of an ~850 MB bundle:
//
//  1. uWebSockets.js ships TWENTY prebuilt binaries - linux/macOS/Windows x
//     x64/arm64 x four Node ABIs - 121 MB, and its loader is one line:
//
//       require('./uws_' + process.platform + '_' + process.arch + '_' +
//               process.versions.modules + '.node')
//
//     A grain is one platform running one Node. The other sixteen files can
//     never be opened by it. Keeping every ABI of the target platform+arch (so
//     a Node major bump still finds its binary) still drops ~93 MB.
//
//  2. Source maps - 4766 files, 188 MB, over a fifth of the bundle. They exist
//     for a debugger attached to the process. A packed app has none, and a
//     missing .map degrades a stack trace at worst; nothing fails to load.
//
// This does NOT prune node_modules - releases/prune-build-only-modules.mjs is
// what removes the build-only toolchain, and the two run together.

import { readdirSync, statSync, unlinkSync, existsSync } from 'fs';
import { join, basename } from 'path';

const argv = process.argv.slice(2);
const bundle = argv.find(a => !a.startsWith('--'));
const flag = name => argv.includes(`--${name}`);
const value = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

if (!bundle) {
  console.error('usage: node releases/bundle-trim.mjs <bundle-dir> [--platform linux] [--arch x64] [--keep-maps]');
  process.exit(2);
}
if (!existsSync(join(bundle, 'programs', 'server'))) {
  console.error(`bundle-trim: ${bundle} does not look like a Meteor bundle (no programs/server)`);
  process.exit(2);
}

const platform = value('platform', 'linux');
const arch = value('arch', 'x64');

// Walk once, collecting both kinds of victim, so a bundle of this size is read
// from disk a single time.
const maps = [];
const uwsDirs = new Set();
function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isSymbolicLink()) continue;   // never follow one out of the bundle
    if (e.isDirectory()) {
      if (e.name === 'uWebSockets.js') uwsDirs.add(p);
      walk(p);
    } else if (e.isFile() && e.name.endsWith('.map')) {
      maps.push(p);
    }
  }
}
walk(bundle);

let freed = 0;
let removed = 0;
function drop(file) {
  let size = 0;
  try { size = statSync(file).size; } catch { return; }
  try { unlinkSync(file); } catch { return; }
  freed += size;
  removed += 1;
}

// 1. uWebSockets.js prebuilds for platforms this bundle will never run on.
let uwsKept = 0;
for (const dir of uwsDirs) {
  const prebuilds = readdirSync(dir).filter(f => /^uws_.+\.node$/.test(f));
  const keep = prebuilds.filter(f => f.startsWith(`uws_${platform}_${arch}_`));
  // If nothing matches, this architecture has no prebuild at all (ppc64le,
  // s390x, riscv64 - uWebSockets.js publishes none) and ddp-server falls back
  // to sockjs. Deleting the others would change nothing and could only be
  // wrong, so leave the directory exactly as it is.
  if (keep.length === 0) {
    console.log(`bundle-trim: ${basename(dir)} has no uws_${platform}_${arch}_* prebuild; left untouched`);
    continue;
  }
  uwsKept += keep.length;
  for (const f of prebuilds) if (!keep.includes(f)) drop(join(dir, f));
}

// 2. Source maps.
if (!flag('keep-maps')) for (const m of maps) drop(m);

const mib = n => (n / 1048576).toFixed(0);
console.log(
  `bundle-trim: removed ${removed} files, ${mib(freed)} MiB from ${bundle} ` +
  `(kept ${uwsKept} uws prebuild(s) for ${platform}/${arch}` +
  `${flag('keep-maps') ? ', kept source maps' : `, dropped ${maps.length} source maps`})`,
);
