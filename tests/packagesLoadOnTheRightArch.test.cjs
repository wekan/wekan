'use strict';

// Guard: no package file that the BROWSER loads may require a Node builtin.
// Run: node tests/packagesLoadOnTheRightArch.test.cjs
//
// WHAT HAPPENED. The JamBleed fix hashed the source address of a login attempt
// with `require('crypto')`, in packages/wekan-accounts-lockout. That package was
// declared as
//
//     api.mainModule('accounts-lockout.js');
//
// with no architecture - which loads it into the CLIENT as well as the server.
// So the browser bundle pulled in crypto-browserify, which pulls in cipher-base,
// which does `require('stream')`, and the page died on load:
//
//     Uncaught Error: Cannot find module 'stream'
//
// before WeKan drew anything at all. The server started perfectly, answered
// HTTP 200, and served a page that could not run - which is why "does the bundle
// boot" (tests/bundleSmokeBoot + releases/bundle-smoke-boot.sh) did not catch
// it: that check proves the SERVER image loads, and this was the client.
//
// THE SHAPE OF THE FAULT, which is what this pins: a package whose files are
// server logic but whose declaration does not say so. Meteor's default is both
// architectures, so forgetting the argument is silent - the code works, the
// tests pass, and the cost lands in a browser bundle nobody reads. Two other
// packages (wekan-accounts-cas, wekan-oidc) keep their builtins in `*_server.js`
// files added with an explicit 'server', which is the pattern this enforces.
//
// It is a source-reading test on purpose: it needs no Meteor and no build, so it
// runs in the 15 seconds the node suites take rather than the hour a build does.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PACKAGES = path.join(ROOT, 'packages');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('packagesLoadOnTheRightArch:');

// Node builtins a browser does not have. Meteor substitutes a stub for some of
// them, which is exactly what went wrong: the stub tree loads, and something
// deep inside it asks for a module the map never installed.
const BUILTINS = [
  'crypto', 'stream', 'fs', 'path', 'net', 'tls', 'os', 'zlib', 'http', 'https',
  'child_process', 'cluster', 'dns', 'dgram', 'vm', 'worker_threads', 'buffer',
];
const REQUIRES_BUILTIN = new RegExp(
  `(?:require\\(\\s*['"](?:node:)?(${BUILTINS.join('|')})['"]\\s*\\)`
  + `|from\\s+['"](?:node:)?(${BUILTINS.join('|')})['"])`, 'g');

const packages = fs.readdirSync(PACKAGES, { withFileTypes: true })
  .filter(e => e.isDirectory() && fs.existsSync(path.join(PACKAGES, e.name, 'package.js')))
  .map(e => e.name);

// The entry files a package declares WITHOUT restricting them to the server.
// `api.mainModule('x.js')` and `api.addFiles('x.js')` both default to every
// architecture; an explicit 'server' (or ['server']) is what takes them off the
// client.
function clientEntries(source) {
  const entries = [];
  for (const m of source.matchAll(/api\.(?:mainModule|addFiles)\(([\s\S]*?)\);/g)) {
    const call = m[1];
    if (/'server'|"server"/.test(call)) continue;          // server only
    for (const f of call.matchAll(/['"]([\w./-]+\.js)['"]/g)) entries.push(f[1]);
  }
  return entries;
}

// Everything reachable from an entry file by relative import, inside the package.
function reachable(pkgDir, entry) {
  const seen = new Set();
  const queue = [entry];
  while (queue.length) {
    const rel = queue.pop();
    if (seen.has(rel)) continue;
    const file = path.join(pkgDir, rel);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
    seen.add(rel);
    const source = fs.readFileSync(file, 'utf8');
    for (const m of source.matchAll(/(?:from|require\()\s*['"](\.[^'"]*)['"]/g)) {
      let next = path.normalize(path.join(path.dirname(rel), m[1]));
      if (!next.endsWith('.js')) next += '.js';
      queue.push(next);
    }
  }
  return [...seen];
}

test('there are packages to check', () => {
  assert.ok(packages.length > 0, 'packages/ has no package.js to read');
});

test('nothing the browser loads requires a Node builtin', () => {
  const offenders = [];
  for (const name of packages) {
    const dir = path.join(PACKAGES, name);
    const source = fs.readFileSync(path.join(dir, 'package.js'), 'utf8');
    for (const entry of clientEntries(source)) {
      for (const rel of reachable(dir, entry)) {
        const code = fs.readFileSync(path.join(dir, rel), 'utf8')
          .split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
        for (const m of code.matchAll(REQUIRES_BUILTIN)) {
          offenders.push(`${name}/${rel} requires '${m[1] || m[2]}' (reached from ${entry})`);
        }
      }
    }
  }
  assert.deepStrictEqual(offenders, [],
    'these load in the BROWSER and require a Node builtin, which is how the page '
    + 'came to die on "Cannot find module \'stream\'":\n  ' + offenders.join('\n  '));
});

test('and nothing under client/ requires one either (negative)', () => {
  // The same fault, one directory over: a file in client/ that requires a Node
  // builtin puts the stub tree in the browser bundle just as surely as a package
  // does. models/lib is deliberately NOT checked - it is shared code, and the
  // modules there that need `crypto` (loginTally) are reached only from the
  // server, which the Meteor bundler is able to see.
  const walk = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.name === 'node_modules') continue;
      if (e.isDirectory()) walk(full, out);
      else if (e.name.endsWith('.js')) out.push(full);
    }
    return out;
  };
  const offenders = [];
  for (const file of walk(path.join(ROOT, 'client'))) {
    const code = fs.readFileSync(file, 'utf8')
      .split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
    for (const m of code.matchAll(REQUIRES_BUILTIN)) {
      offenders.push(`${path.relative(ROOT, file)} requires '${m[1] || m[2]}'`);
    }
  }
  assert.deepStrictEqual(offenders, [],
    `these run in the browser and require a Node builtin:\n  ${offenders.join('\n  ')}`);
});

test('the lockout package in particular is server-only (negative)', () => {
  // Named on its own because this is the one that was wrong, and because
  // shipping a brute-force lockout's decision to the browser would hand an
  // attacker the rules even if it cost nothing.
  const source = fs.readFileSync(path.join(PACKAGES, 'wekan-accounts-lockout/package.js'), 'utf8');
  assert.ok(/api\.mainModule\('accounts-lockout\.js',\s*'server'\)/.test(source),
    'wekan-accounts-lockout must declare its main module as server-only');
});

test('and no client code imports it either', () => {
  // The other half of "server-only": a client file importing it would fail to
  // build rather than fail in a browser, but the guard is cheap and the answer
  // is the one that matters - nothing in the interface needs it.
  const walk = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, out);
      else if (e.name.endsWith('.js')) out.push(full);
    }
    return out;
  };
  const importers = walk(path.join(ROOT, 'client'))
    .filter(f => /wekan-accounts-lockout/.test(fs.readFileSync(f, 'utf8')))
    .map(f => path.relative(ROOT, f));
  assert.deepStrictEqual(importers, [],
    `these client files reference the lockout package: ${importers.join(', ')}`);
});

console.log(`\npackagesLoadOnTheRightArch: ${passed} tests passed`);
