#!/usr/bin/env node
// Remove the native-REBUILD toolchain from a built bundle's server modules.
//
//     node releases/prune-build-only-modules.mjs [bundle dir] [--dry-run]
//
// Run it right after `npm install` in `<bundle>/programs/server`, in every place
// a bundle is made: the Dockerfile and each per-arch leg of release-all.yml.
//
// Why. `programs/server/package.json` is Meteor's `meteor-dev-bundle`, and two
// of its dependencies - `node-gyp` and `@mapbox/node-pre-gyp` - exist to COMPILE
// native modules during that install. They drag in 85 of the 116 packages that
// end up in `programs/server/node_modules`, and WeKan compiles nothing at run
// time: every native module in the bundle (uWebSockets.js, bcrypt, argon2) is a
// prebuilt `.node` picked by `node-gyp-build`, and `npm-rebuild.js` is an
// install script that never runs again once the image or the .zip is made.
//
// They were shipped anyway, and a container scan reads them as what they are -
// old code on a published image. `node-gyp` and `cacache` each carry their own
// `tar` 6.2.1, which is where the image's CRITICAL tar finding came from, and
// the same tree brings `ip-address`, `brace-expansion`, `minimatch`, `socks` and
// the rest of npm's networking stack along with it. None of it is reachable from
// `boot.js`.
//
// What it keeps. Not a list - a REACHABILITY walk, so it cannot go stale when
// Meteor changes its dev-bundle dependencies: start from every dependency of
// `programs/server/package.json` EXCEPT the two build-only ones, follow each
// package's own `dependencies` and `optionalDependencies`, and keep the closure.
// Everything else at the top level of `programs/server/node_modules` is removed.
// Dot-entries (`.bin`, `.package-lock.json`) are never touched.
//
// What it does NOT touch: `programs/server/npm/node_modules`, where the Meteor
// packages' own npm dependencies live. Those are loaded at run time.

import fs from 'fs';
import path from 'path';

// The dependencies of meteor-dev-bundle that are there to build native modules
// during `npm install`, and for nothing else afterwards.
const BUILD_ONLY = ['node-gyp', '@mapbox/node-pre-gyp'];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const bundle = args.find(a => !a.startsWith('--')) || 'bundle';
const serverDir = path.join(bundle, 'programs', 'server');
const modulesDir = path.join(serverDir, 'node_modules');

if (!fs.existsSync(modulesDir)) {
  // Called before `npm install`, or on a bundle that has none: nothing to do,
  // and this must not fail a build.
  console.log(`prune-build-only-modules: no ${modulesDir}, nothing to prune`);
  process.exit(0);
}

const readJson = file => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

const depsOf = name => {
  const pkg = readJson(path.join(modulesDir, name, 'package.json'));
  if (!pkg) return [];
  return [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
  ];
};

const serverPkg = readJson(path.join(serverDir, 'package.json'));
if (!serverPkg) {
  console.error(`prune-build-only-modules: cannot read ${serverDir}/package.json`);
  process.exit(1);
}

const roots = [
  ...Object.keys(serverPkg.dependencies || {}),
  ...Object.keys(serverPkg.devDependencies || {}),
].filter(name => !BUILD_ONLY.includes(name));

const keep = new Set();
const stack = [...roots];
while (stack.length) {
  const name = stack.pop();
  if (keep.has(name)) continue;
  keep.add(name);
  stack.push(...depsOf(name));
}

// Top-level entries, with scopes expanded to `@scope/name`. Dot-entries are
// npm's own bookkeeping and are left alone.
const present = [];
for (const entry of fs.readdirSync(modulesDir).sort()) {
  if (entry.startsWith('.')) continue;
  if (entry.startsWith('@')) {
    for (const scoped of fs.readdirSync(path.join(modulesDir, entry)).sort()) {
      present.push(`${entry}/${scoped}`);
    }
  } else {
    present.push(entry);
  }
}

const remove = present.filter(name => !keep.has(name));

for (const name of remove) {
  const target = path.join(modulesDir, name);
  if (!dryRun) fs.rmSync(target, { recursive: true, force: true });
}

// An emptied scope directory is left behind by the removals above; take it too.
for (const entry of fs.readdirSync(modulesDir)) {
  if (!entry.startsWith('@')) continue;
  const scopeDir = path.join(modulesDir, entry);
  if (fs.statSync(scopeDir).isDirectory() && fs.readdirSync(scopeDir).length === 0) {
    if (!dryRun) fs.rmdirSync(scopeDir);
  }
}

console.log(
  `prune-build-only-modules: ${dryRun ? 'would remove' : 'removed'} `
  + `${remove.length} of ${present.length} packages from ${modulesDir}`);
if (remove.length) console.log(`  ${remove.join(' ')}`);
