'use strict';

// npm 7 removed --unsafe-perm, and npm 11 refuses an unknown cli flag with
// EUNKNOWNCONFIG, so `build.sh` -> Setup -> Install dependencies stopped at
// `sudo npm -g install meteor --unsafe-perm` right after `n` installed the
// pinned Node and npm. Meteor's installer is given --foreground-script, the
// flag Meteor's own install documentation uses, so its download is visible.
//
// Every script this repository runs is checked, not just build.sh: the same
// flag sat in releases/rebuild-release.sh. Old docs for Meteor 2 (which ships
// npm 6, where the flag still existed) and the legacy stacksmith scripts are
// not run with this repository's npm and are not checked.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const skip = new Set(['.git', '.tools', 'node_modules', '_build', '.build', '.meteor',
  'old-CHANGELOG', 'stacksmith', 'docs', 'tests']);
const scripts = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(sh|bat|cmd|ps1|ya?ml)$|^Dockerfile|^Makefile$|^snapcraft/.test(entry.name)) scripts.push(file);
  }
})(root);

assert.ok(scripts.some((file) => file.endsWith(`${path.sep}build.sh`)), 'build.sh is scanned');
const offenders = scripts.filter((file) =>
  /\bnpm\b[^\n]*--unsafe-perm|--unsafe-perm[^\n]*\bnpm\b/.test(fs.readFileSync(file, 'utf8')));
assert.deepStrictEqual(offenders.map((file) => path.relative(root, file)), [],
  'npm 11 rejects --unsafe-perm with EUNKNOWNCONFIG');

// Positive: the Linux dependency install still installs Meteor globally, with
// the flag npm 11 accepts.
const sh = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
assert.match(sh, /^\s*sudo npm -g install meteor --foreground-script$/m,
  'build.sh installs Meteor with --foreground-script');

// Negative: the scan finds the flag when it is there.
assert.ok(/\bnpm\b[^\n]*--unsafe-perm/.test('sudo npm -g install meteor --unsafe-perm'));

console.log('npmNoUnsafePerm: ok');
