#!/usr/bin/env node
'use strict';

// Remove packages from a built bundle's programs/server/npm/node_modules that
// no require() from the server can reach.
//
// Usage: node releases/prune-unreachable-npm.mjs <bundle-dir> [--dry-run]
//
// WHY THIS TREE IS BIG
//
// programs/server/npm/node_modules is 347 MB of an ~850 MB bundle, and 206 MB of
// it is not reachable from any server entry point. Two things make that happen
// and neither is a bug in Meteor:
//
//   * It is OUTSIDE the bundler's graph. Meteor 3.5 compiles through rspack -
//     the server output is minified, and programs/server/app/app.js requires only
//     76 bare specifiers because rspack inlined the app's real dependencies into
//     it. But this tree is what Atmosphere packages declare with Npm.depends()
//     and load through Npm.require(), a call rspack cannot follow. So tree
//     shaking never sees it. The tree is largely the INPUT to a build whose
//     OUTPUT ships beside it.
//   * It is a full `npm install`, devDependencies included. `typescript` is a
//     devDependency of 196 packages here and a runtime dependency of none.
//
// Duplication is the smaller half of the story: 586 distinct packages exist as
// 815 copies, but the redundant copies are only ~28 MB, because Meteor keeps
// per-package node_modules on purpose so packages can pin conflicting versions.
//
// HOW THIS IS KEPT SAFE
//
// The reachable set is computed from the bundle every run, and it is
// deliberately OVER-approximated: once a package is reached, every file in it is
// scanned and every require() string literal counts. Then deletion is restricted
// to an explicit POLICY list - a name is removed only if the policy names it AND
// the graph says nothing reaches it. So the policy cannot outlive its own
// justification: if a future WeKan really does require `typescript`, the graph
// says so and the entry is refused rather than silently applied.
//
// After deleting, it re-checks that every path in the reachable set still
// exists, and fails if one does not. A bundle that boots is worth more than the
// megabytes.
//
// What the policy does NOT include is the long tail. 590 packages are unreached,
// and only these are removed, because these are the ones whose reason is
// provable rather than merely plausible - the same standard the uWebSockets.js
// removal met. The rest stays until someone can say as much about it.

import { readdirSync, readFileSync, statSync, existsSync, rmSync } from 'fs';
import { join, dirname, basename } from 'path';

const argv = process.argv.slice(2);
const bundle = argv.find(a => !a.startsWith('--'));
const dryRun = argv.includes('--dry-run');

if (!bundle) {
  console.error('usage: node releases/prune-unreachable-npm.mjs <bundle-dir> [--dry-run]');
  process.exit(2);
}
const SERVER = join(bundle, 'programs', 'server');
const NPM = join(SERVER, 'npm', 'node_modules');
const OWN = join(SERVER, 'node_modules');
if (!existsSync(SERVER)) {
  console.error(`prune-unreachable-npm: ${bundle} does not look like a Meteor bundle (no programs/server)`);
  process.exit(2);
}
if (!existsSync(NPM)) {
  console.log('prune-unreachable-npm: no programs/server/npm/node_modules; nothing to do');
  process.exit(0);
}

// ── The policy ───────────────────────────────────────────────────────────────
// Each entry says WHY, because the why is what a later reader has to re-check.
// `test` gets the package directory and returns true if this entry claims it.
const POLICY = [
  {
    why: 'a TypeScript compiler. A devDependency of 196 packages in this tree '
      + '(the @aws-sdk family) and a runtime dependency of none.',
    test: dir => basename(dir) === 'typescript',
  },
  {
    why: 'TypeScript declaration packages. Verified to contain no .js at all, so '
      + 'no require() can resolve into one.',
    test: dir => dirname(dir).endsWith('/@types') && !hasJs(dir),
  },
  // REMOVED: openpgp + nodemailer-openpgp, 21.3 MiB. The claim was "reachable
  // only through an optional nodemailer plugin nothing requires", and it was
  // wrong: packages/email.js links it on its first tick with
  // `module.link('nodemailer-openpgp', ...)`, which the scanner did not read as a
  // reference until it learned Meteor's linker calls. A bundle shipped without it
  // crash-looped. The entry is gone rather than left to be vetoed every run - the
  // reason is what grants the permission, and this reason was never true.
  {
    why: 'a test framework, shipped inside meteor/ostrio_files.',
    test: dir => basename(dir) === 'sinon',
  },
];

function hasJs(dir) {
  let ents;
  try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return true; }
  for (const e of ents) {
    if (e.isDirectory()) { if (hasJs(join(dir, e.name))) return true; }
    else if (/\.(js|cjs|mjs|node)$/.test(e.name)) return true;
  }
  return false;
}

// ── The reachability graph ───────────────────────────────────────────────────
const CODE = /\.(js|cjs|mjs)$/;
// EVERY WAY A METEOR BUNDLE NAMES A PACKAGE, not just require().
//
// A bundle that shipped without nodemailer-openpgp crash-looped on
// `Cannot find module ".../nodemailer-openpgp/lib/nodemailer-openpgp.js"`,
// because packages/email.js does not require() it - Meteor compiles an ESM
// import to its own linker call:
//
//   module.link('nodemailer-openpgp',{openpgpEncrypt(v){openpgpEncrypt=v}},6);
//
// Scanning only for require() therefore missed every ESM import in every Meteor
// package, which is most of them, and reported packages as unreachable that the
// server links on its first tick. All four forms below are counted now.
const REQ = new RegExp([
  /(?:^|[^.\w])(?:Npm\.)?require\s*\(\s*['"]([^'"\n]+)['"]\s*\)/,   // require('x')
  /module\.link\s*\(\s*['"]([^'"\n]+)['"]/,                          // ESM import
  /module\.watch\s*\(\s*require\s*\(\s*['"]([^'"\n]+)['"]/,          // watched require
  /module\.dynamicImport\s*\(\s*['"]([^'"\n]+)['"]/,                  // await import()
].map(r => r.source).join('|'), 'g');

function filesOf(dir, out = []) {
  let ents;
  try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (e.isSymbolicLink()) continue;
    const p = join(dir, e.name);
    // A nested node_modules is a different package; it is reached on its own.
    if (e.isDirectory()) { if (e.name !== 'node_modules') filesOf(p, out); }
    else if (CODE.test(e.name)) out.push(p);
  }
  return out;
}

// "@scope/name/sub" -> "@scope/name". Node builtins, relative paths and Meteor's
// virtual `meteor/<package>` modules are not npm packages.
function packageOf(spec) {
  if (!spec || spec.startsWith('.') || spec.startsWith('/')) return null;
  if (spec.startsWith('node:')) return null;
  if (spec === 'meteor' || spec.startsWith('meteor/')) return null;
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

// Node resolution: up through each node_modules, then the two trees a Meteor
// server bundle always has.
function resolvePackage(name, from) {
  let d = from;
  while (d.startsWith(bundle)) {
    const p = join(d, 'node_modules', name);
    if (existsSync(p)) return p;
    d = dirname(d);
  }
  for (const base of [NPM, OWN]) {
    const p = join(base, name);
    if (existsSync(p)) return p;
  }
  return null;
}

const reached = new Set();
const queue = [];

function scanFile(file, from) {
  let src;
  try { src = readFileSync(file, 'utf8'); } catch { return; }
  for (const m of src.matchAll(REQ)) {
    const name = packageOf(m[1] || m[2] || m[3] || m[4]);
    if (!name) continue;
    const dir = resolvePackage(name, from);
    if (dir && !reached.has(dir)) { reached.add(dir); queue.push(dir); }
  }
}

// Roots: what the server actually loads.
const roots = [];
for (const f of ['boot.js', 'main.js', join('app', 'app.js')]) {
  const p = join(SERVER, f);
  if (existsSync(p)) roots.push([p, SERVER]);
}
// Each packages/<name>.js is a Meteor package, and its Npm.require() resolves
// first in npm/node_modules/meteor/<name>/node_modules.
const packagesDir = join(SERVER, 'packages');
if (existsSync(packagesDir)) {
  for (const f of readdirSync(packagesDir)) {
    if (!f.endsWith('.js')) continue;
    const own = join(NPM, 'meteor', basename(f, '.js'));
    roots.push([join(packagesDir, f), existsSync(own) ? own : SERVER]);
  }
}
for (const [file, from] of roots) scanFile(file, from);
while (queue.length) {
  const dir = queue.shift();
  for (const f of filesOf(dir)) scanFile(f, dir);
}

// ── Apply ────────────────────────────────────────────────────────────────────
// Every package directory in the tree: the hoisted ones, and each Meteor
// package's own node_modules.
function packagesIn(nodeModules) {
  const out = [];
  let ents;
  try { ents = readdirSync(nodeModules, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (!e.isDirectory() || e.isSymbolicLink()) continue;
    if (e.name === 'meteor' && nodeModules === NPM) continue;   // handled below
    if (e.name.startsWith('@')) {
      for (const s of readdirSync(join(nodeModules, e.name))) out.push(join(nodeModules, e.name, s));
    } else out.push(join(nodeModules, e.name));
  }
  return out;
}
const all = packagesIn(NPM);
for (const pkg of readdirSync(join(NPM, 'meteor'))) {
  const nested = join(NPM, 'meteor', pkg, 'node_modules');
  if (existsSync(nested)) all.push(...packagesIn(nested));
}

function sizeOf(dir) {
  let total = 0;
  const walk = d => {
    let ents;
    try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = join(d, e.name);
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) walk(p);
      else { try { total += statSync(p).size; } catch { /* vanished */ } }
    }
  };
  walk(dir);
  return total;
}

const rel = p => p.slice(NPM.length + 1);
const mib = n => (n / 1048576).toFixed(1);

const removals = [];
const refused = [];
for (const dir of all) {
  const entry = POLICY.find(e => e.test(dir));
  if (!entry) continue;
  if (reached.has(dir)) {
    // The policy claimed it and the graph disagrees. The graph wins.
    refused.push([dir, entry]);
    continue;
  }
  removals.push([dir, entry, sizeOf(dir)]);
}

for (const [dir, entry] of refused) {
  console.log(`prune-unreachable-npm: KEEPING ${rel(dir)} - the policy names it (${entry.why}) `
    + 'but a require() reaches it. The graph wins.');
}

let freed = 0;
for (const [dir, , size] of removals) {
  if (!dryRun) {
    try { rmSync(dir, { recursive: true, force: true }); }
    catch (e) { console.log(`prune-unreachable-npm: could not remove ${rel(dir)}: ${e.message}`); continue; }
  }
  freed += size;
}

// A removed package leaves its .bin symlinks dangling - `.bin/tsc` pointing into
// a directory that is gone. Harmless to run, untidy to ship, and confusing to
// anything that walks the tree, so they go with it.
let danglingRemoved = 0;
if (!dryRun) {
  const bins = [join(NPM, '.bin')];
  for (const pkg of readdirSync(join(NPM, 'meteor'))) {
    bins.push(join(NPM, 'meteor', pkg, 'node_modules', '.bin'));
  }
  for (const bin of bins) {
    let ents;
    try { ents = readdirSync(bin, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      const p = join(bin, e.name);
      // existsSync FOLLOWS the link, so a dangling one answers false.
      if (!existsSync(p)) {
        try { rmSync(p, { force: true }); danglingRemoved += 1; } catch { /* leave it */ }
      }
    }
  }
}

// Nothing that is reached may have gone. A bundle that boots is worth more than
// the megabytes, so this is checked rather than assumed.
if (!dryRun) {
  const missing = [...reached].filter(p => !existsSync(p));
  if (missing.length) {
    console.error('prune-unreachable-npm: FAILED - these are reachable and no longer present:');
    for (const p of missing.slice(0, 10)) console.error(`  ${rel(p)}`);
    process.exit(1);
  }
}

const byWhy = new Map();
for (const [, entry, size] of removals) {
  const cur = byWhy.get(entry.why) || { n: 0, bytes: 0 };
  byWhy.set(entry.why, { n: cur.n + 1, bytes: cur.bytes + size });
}
console.log(`prune-unreachable-npm: ${dryRun ? 'would remove' : 'removed'} ${removals.length} package(s), `
  + `${mib(freed)} MiB from programs/server/npm/node_modules, of ${all.length} in the tree `
  + `(${reached.size} reachable)`
  + (danglingRemoved ? `, and ${danglingRemoved} dangling .bin symlink(s)` : ''));
for (const [why, { n, bytes }] of byWhy) {
  console.log(`  ${mib(bytes).padStart(7)} MiB  ${String(n).padStart(3)} pkg  ${why}`);
}
