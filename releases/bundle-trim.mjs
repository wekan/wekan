#!/usr/bin/env node
'use strict';

// Trim a built Meteor bundle down to what the target platform actually runs.
//
// Usage: node releases/bundle-trim.mjs <bundle-dir> [--platform linux] [--arch x64]
//                                      [--transport sockjs] [--drop-legacy-client]
//                                      [--keep-maps] [--trim-prebuilds]
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
//     A machine is one platform running one Node. The other sixteen files can
//     never be opened by it. Keeping every ABI of the target platform+arch (so
//     a Node major bump still finds its binary) drops ~93 MB.
//
//     `--transport sockjs` drops all 121 MB instead, module and all. The uws
//     transport is OPTIONAL in Meteor 3: ddp-server resolves its transport from
//     Meteor.settings, then DDP_TRANSPORT, then DISABLE_SOCKJS, and DEFAULTS to
//     sockjs - and `Npm.require('uWebSockets.js')` sits INSIDE that transport's
//     setup(), which runs only for the transport that was chosen. A server on
//     sockjs therefore never loads the module at all. WeKan asks for uws nearly
//     everywhere (docker-compose, start-wekan.sh, build.sh), which is why this
//     is a flag and not the default; the Sandstorm grain is the exception, and
//     sandstorm-pkgdef.capnp pins DDP_TRANSPORT=sockjs so that the removal
//     rests on a stated fact rather than on an upstream default staying put.
//
//  2. Source maps - 4766 files, 188 MB, over a fifth of the bundle. They exist
//     for a debugger attached to the process. A packed app has none, and a
//     missing .map degrades a stack trace at worst; nothing fails to load.
//
//  3. prebuildify prebuilds - `--trim-prebuilds`. bcrypt and argon2 (Meteor's
//     accounts-password) each ship a prebuilds/<platform>-<arch>/ directory per
//     platform they support: 21 binaries of which ONE is ever opened. The
//     loader is node-gyp-build, and its resolve() reads exactly one directory:
//
//       var tuples = readdirSync(path.join(dir, 'prebuilds')).map(parseTuple)
//       var tuple = tuples.filter(matchTuple(platform, arch)).sort(compareTuples)[0]
//
//     with platform/arch from os.platform()/os.arch(). The same reasoning as
//     uWebSockets.js, and the same rule when nothing matches: leave the whole
//     directory alone. The tuple parsing below is node-gyp-build's, including
//     multi-arch names like "darwin-x64+arm64", so this keeps precisely what
//     that loader would have chosen.
//
//     It is OFF by default and requires an explicit --platform and --arch,
//     because the default (linux/x64) would delete the target's own addon on a
//     Windows or macOS bundle - the exact class of fault the single EXE was
//     just fixed for. build-amd64 deliberately does NOT pass it: every other
//     bundle WeKan ships is that bundle repacked, so trimming there would take
//     the prebuilds away from architectures that have not been built yet.
//
// This does NOT prune node_modules - releases/prune-build-only-modules.mjs is
// what removes the build-only toolchain, and the two run together.

import {
  readdirSync, statSync, unlinkSync, existsSync, rmSync, readFileSync, writeFileSync,
  chmodSync,
} from 'fs';
import { join, basename } from 'path';

const argv = process.argv.slice(2);
const bundle = argv.find(a => !a.startsWith('--'));
const flag = name => argv.includes(`--${name}`);
/* Whether an option was actually passed, as opposed to falling back. */
const given = name => argv.indexOf(`--${name}`) !== -1;
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
const prebuildDirs = new Set();
function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isSymbolicLink()) continue;   // never follow one out of the bundle
    if (e.isDirectory()) {
      if (e.name === 'uWebSockets.js') uwsDirs.add(p);
      if (e.name === 'prebuilds') prebuildDirs.add(p);
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

// 1. uWebSockets.js: the whole module when this bundle runs sockjs, otherwise
//    the prebuilds for platforms it will never run on.
const transport = value('transport', '');
if (transport && transport !== 'sockjs' && transport !== 'uws') {
  console.error(`bundle-trim: unknown --transport '${transport}' (sockjs or uws)`);
  process.exit(2);
}
let uwsKept = 0;
for (const dir of uwsDirs) {
  if (transport === 'sockjs') {
    // Nothing in a sockjs server reaches this module - see the header. Remove
    // it whole rather than keeping a loader for a transport that is not on.
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      if (f.isFile()) drop(join(dir, f.name));
    }
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* leftovers are harmless */ }
    continue;
  }
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

// 1b. prebuildify prebuilds: the platform directories this bundle can never
//     open. node-gyp-build's own parseTuple/matchTuple, so what survives is
//     exactly what it would have loaded.
function parseTuple(name) {
  const parts = name.split('-');
  if (parts.length !== 2) return null;
  const [tuplePlatform, archList] = parts;
  const architectures = archList.split('+');
  if (!tuplePlatform || !architectures.length || !architectures.every(Boolean)) return null;
  return { name, platform: tuplePlatform, architectures };
}
const matchesTarget = name => {
  const tuple = parseTuple(name);
  return tuple !== null && tuple.platform === platform &&
    tuple.architectures.includes(arch);
};

let prebuildsKept = 0;
let prebuildsUntouched = 0;
if (flag('trim-prebuilds')) {
  if (!given('platform') || !given('arch')) {
    console.error(
      'bundle-trim: --trim-prebuilds needs an explicit --platform and --arch. ' +
      "The defaults (linux/x64) would delete the target's own native addon on a " +
      'Windows or macOS bundle.');
    process.exit(2);
  }
  for (const dir of prebuildDirs) {
    let children;
    try {
      children = readdirSync(dir, { withFileTypes: true })
        .filter(e => e.isDirectory() && !e.isSymbolicLink()).map(e => e.name);
    } catch { continue; }

    // EVERY decision is made before anything is deleted, so there is no way to
    // stop half-way through with a tree that has lost the addon it needs.
    const addons = name => {
      try { return readdirSync(join(dir, name)).filter(f => f.endsWith('.node')); }
      catch { return []; }
    };

    // Only node-gyp-build's own trees. bare-fs, bare-path and bare-url ship a
    // prebuilds/ of .bare files for the Bare runtime, which is a different
    // loader with different rules - not something to reason about from here.
    if (!children.some(name => addons(name).length > 0)) {
      console.log(`bundle-trim: ${dir} holds no .node addon; left untouched`);
      prebuildsUntouched += 1;
      continue;
    }

    const keep = children.filter(matchesTarget);
    const kept = keep.reduce((total, name) => total + addons(name).length, 0);
    // Nothing for this target, or nothing loadable in what would be kept: the
    // package must find its addon another way (a build/Release from `npm
    // rebuild`). Deleting the rest would change nothing and could only be wrong.
    if (kept === 0) {
      console.log(`bundle-trim: ${dir} has no ${platform}-${arch} addon; left untouched`);
      prebuildsUntouched += 1;
      continue;
    }

    for (const name of children) {
      if (keep.includes(name)) continue;
      const victim = join(dir, name);
      for (const f of readdirSync(victim, { withFileTypes: true })) {
        if (f.isFile()) drop(join(victim, f.name));
      }
      try { rmSync(victim, { recursive: true, force: true }); } catch { /* harmless */ }
    }
    prebuildsKept += kept;
  }
}

// 2. Source maps.
//
// A NAMED map is not optional. boot.js reads every map listed in
// programs/server/program.json at boot, unconditionally:
//
//   serverJson.load.forEach(function (fileInfo) {
//     if (fileInfo.sourceMap) {
//       var rawSourceMap = fs.readFileSync(path.resolve(serverDir, fileInfo.sourceMap), ...)
//
// and a missing one is ENOENT before the server ever opens its port - a
// crash-loop, not a degraded stack trace. 63 of the 102 load entries name a map,
// 60 MiB of them. So the NAMES go with the files: the field is removed from the
// manifest in the same pass. The client is not affected - its program.json names
// no maps at all (678 manifest entries, zero sourceMap fields) and webapp reads
// only program.json itself at startup, so a client map is found through the
// //# sourceMappingURL comment and simply 404s when it is not there.
if (!flag('keep-maps')) {
  for (const m of maps) drop(m);
  const programJson = join(bundle, 'programs', 'server', 'program.json');
  if (existsSync(programJson)) {
    rewriteJson(programJson, program => {
      for (const entry of program.load || []) {
        delete entry.sourceMap;
        delete entry.sourceMapRoot;
      }
    });
  }
}

// 3. The legacy client bundle - a whole second copy of the client, built for
//    browsers without modern JS. 83 MiB.
//
//    Meteor supports running with architectures excluded, and says so in its own
//    code. webapp's categorizeRequest() walks a preferred order and comments "If
//    our preferred arch is not available, it's better to use another client arch
//    that is available than to guarantee the site won't work", so an old browser
//    is served web.browser instead; the 404 branch below it is reached only when
//    NO arch matches, which cannot happen while web.browser is there. autoupdate
//    iterates Object.keys(WebApp.clientPrograms) - the programs that actually
//    loaded - so it never asks for the one that was removed.
//
//    The directory is only half of it: the arch is also NAMED in two manifests,
//    and boot.js builds a dynamic-import root for every name it finds there. So
//    the name goes with the files, or the server registers a path that is not on
//    disk.
// A Meteor bundle's manifests are written READ-ONLY (mode 444), so a plain
// writeFileSync on one fails with EACCES and takes the whole trim down after it
// has already deleted files. Make it writable, rewrite it, put the mode back.
function rewriteJson(file, edit) {
  const mode = statSync(file).mode;
  const data = JSON.parse(readFileSync(file, 'utf8'));
  edit(data);
  chmodSync(file, mode | 0o200);
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  chmodSync(file, mode);
}

let legacyNote = '';
if (flag('drop-legacy-client')) {
  const legacyDir = join(bundle, 'programs', 'web.browser.legacy');
  const before = removed;
  const dropTree = dir => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isDirectory() && !e.isSymbolicLink()) dropTree(join(dir, e.name));
      else drop(join(dir, e.name));
    }
  };
  if (existsSync(legacyDir)) {
    dropTree(legacyDir);
    try { rmSync(legacyDir, { recursive: true, force: true }); } catch { /* leftovers are harmless */ }
  }

  // programs/server/config.json - clientArchs (and clientPaths in older bundles).
  const configPath = join(bundle, 'programs', 'server', 'config.json');
  if (existsSync(configPath)) {
    rewriteJson(configPath, config => {
      if (Array.isArray(config.clientArchs)) {
        config.clientArchs = config.clientArchs.filter(a => a !== 'web.browser.legacy');
      }
      if (config.clientPaths) delete config.clientPaths['web.browser.legacy'];
    });
  }

  // star.json - the program list the bundle ships with.
  const starPath = join(bundle, 'star.json');
  if (existsSync(starPath)) {
    rewriteJson(starPath, star => {
      if (Array.isArray(star.programs)) {
        star.programs = star.programs.filter(p => p.arch !== 'web.browser.legacy');
      }
    });
  }
  legacyNote = `, dropped the legacy client (${removed - before} files)`;
}

const mib = n => (n / 1048576).toFixed(0);
const uwsNote = transport === 'sockjs'
  ? `removed uWebSockets.js entirely (transport is sockjs)`
  : `kept ${uwsKept} uws prebuild(s) for ${platform}/${arch}`;
const prebuildNote = flag('trim-prebuilds')
  ? `, kept ${prebuildsKept} native prebuild(s) for ${platform}-${arch}` +
    (prebuildsUntouched ? ` (${prebuildsUntouched} package(s) left untouched)` : '')
  : '';
console.log(
  `bundle-trim: removed ${removed} files, ${mib(freed)} MiB from ${bundle} ` +
  `(${uwsNote}${prebuildNote}` +
  `${flag('keep-maps') ? ', kept source maps' : `, dropped ${maps.length} source maps`}` +
  `${legacyNote})`,
);
