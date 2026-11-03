'use strict';

// Dependabot alerts #180 and #182 (and the exceljs lockfile alert), GHSA-g3hv-75wg-m249 (CVE-2026-118764):
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

// The same advisory in the second lockfile: npm-packages/exceljs (@wekanteam/exceljs),
// whose archiver reaches minimatch through readdir-glob 3, which asks for ^10.2.2.
// Alert #180 named that manifest and stayed open after the root lockfile was fixed.
const exceljsDir = 'npm-packages/exceljs';
const exceljsLock = read(`${exceljsDir}/package-lock.json`);
const exceljsPkg = read(`${exceljsDir}/package.json`);
const exceljsCopies = Object.entries(exceljsLock.packages).filter(([key]) => /(^|\/)node_modules\/minimatch$/.test(key));
assert.ok(exceljsCopies.length > 0, 'the exceljs lockfile installs minimatch');
for (const [key, entry] of exceljsCopies) {
  assert.ok(Number(entry.version.split('.')[0]) >= 11 && entry.version !== '11.0.0', `${exceljsDir}: ${key} ${entry.version} is in the affected range`);
}
assert.match(String(exceljsPkg.overrides && exceljsPkg.overrides['readdir-glob'] && exceljsPkg.overrides['readdir-glob'].minimatch), /^\^11\./, 'exceljs: readdir-glob is overridden to minimatch 11');
// Negative: no lockfile in the repository outside node_modules keeps a minimatch in the affected 10.x line or at 11.0.0.
const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true })) {
    if (/^(node_modules|\.|_build)/.test(entry.name) || entry.name === 'log') continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (entry.name === 'package-lock.json') out.push(rel);
  }
  return out;
};
// The whole repository: every lockfile outside node_modules and the ignored tool
// and build directories (those start with a dot or _build).
const lockfiles = ['package-lock.json', ...fs.readdirSync(path.join(__dirname, '..'), { withFileTypes: true })
  .filter(e => e.isDirectory() && !/^(node_modules|\.|_build)/.test(e.name)).flatMap(e => walk(e.name))];
for (const file of new Set(lockfiles)) {
  for (const [key, entry] of Object.entries(read(file).packages || {})) {
    if (!/(^|\/)node_modules\/minimatch$/.test(key)) continue;
    assert.doesNotMatch(entry.version, /^10\./, `${file}: ${key} ${entry.version}`);
    assert.notEqual(entry.version, '11.0.0', `${file}: ${key}`);
  }
}

console.log('minimatchGlobparts: no minimatch 10.x in any lockfile, archiver, typescript-estree, babel and exceljs use 11.0.1 or later');
