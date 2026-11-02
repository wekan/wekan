'use strict';

// Dependabot alerts #180 and #182, GHSA-g3hv-75wg-m249 (CVE-2026-118764):
// minimatch before 11.0.1 grows its glob parts without bound while it
// preprocesses an attacker's pattern (the "**/../" step clones an entry into
// the same array, inside a loop that runs until nothing changes), then
// compares them pairwise: CPU and memory exhaustion. WeKan reached 10.2.6
// through archiver (readdir-glob), @typescript-eslint/typescript-estree and
// @babel/cli's glob. Fixed by raising all of them to minimatch 11.0.1 or later.
//
// Run: node tests/minimatchGlobparts.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => JSON.parse(fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'));
const lock = read('package-lock.json');
const pkg = read('package.json');
// Every copy of minimatch the lockfile installs, with the range of its consumers.
const copies = Object.entries(lock.packages)
  .filter(([key]) => /(^|\/)node_modules\/minimatch$/.test(key))
  .map(([key, entry]) => ({ key, version: entry.version }));
assert.ok(copies.length > 0);

// The release line the advisory names (10.x, and every 11.0.0) is gone.
for (const { key, version } of copies) {
  assert.doesNotMatch(version, /^10\./, `${key} ${version} is the affected 10.x line`);
  assert.notEqual(version, '11.0.0', `${key} is the affected 11.0.0`);
}
// The root copy, the one archiver, typescript-estree and babel resolve to.
const root = lock.packages['node_modules/minimatch'];
assert.ok(root && Number(root.version.split('.')[0]) >= 11, 'root minimatch is 11 or later');
assert.ok(/^11\.(0\.[1-9]|[1-9]|\d\d)/.test(root.version) || Number(root.version.split('.')[0]) > 11, root.version);

// No consumer is held on 10.x by its own range or by an override.
for (const [key, entry] of Object.entries(lock.packages)) {
  const range = entry.dependencies && entry.dependencies.minimatch;
  if (!range || /^\^?3\./.test(range)) continue;
  if (/^\^?10\./.test(range)) {
    assert.ok(key.includes('node_modules/'), key);
    const overridden = ['readdir-glob', '@typescript-eslint/typescript-estree', '@babel/cli'].some(name => key.includes(`node_modules/${name}`));
    assert.ok(overridden, `${key} asks for minimatch ${range} and no override raises it`);
  }
}
for (const name of ['readdir-glob', '@typescript-eslint/typescript-estree', '@babel/cli']) {
  assert.match(String(pkg.overrides[name] && pkg.overrides[name].minimatch), /^\^11\./, `${name} is overridden to minimatch 11`);
}
assert.match(pkg.devDependencies.minimatch, /^\^11\./, 'the root copy is declared, so every consumer finds it');

console.log('minimatchGlobparts: no minimatch 10.x in the lockfile, archiver, typescript-estree and babel use 11.0.1 or later');
