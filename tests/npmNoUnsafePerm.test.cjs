'use strict';

// npm 7 removed --unsafe-perm, and npm 12 (NPM_VERSION in the Dockerfile, which
// build.sh installs) refuses an unknown cli flag with
// EUNKNOWNCONFIG, so `build.sh` -> Setup -> Install dependencies stopped at
// `sudo npm -g install meteor --unsafe-perm` right after `n` installed the
// pinned Node and npm. Meteor's installer is given --foreground-scripts, so its
// download is visible. Meteor's install documentation spells it
// --foreground-script; npm 11 took that as an abbreviation, but npm 12 stops
// with 'Invalid abbreviated flag', so the full name is pinned below too.
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
  'npm 12 rejects --unsafe-perm with EUNKNOWNCONFIG');

// npm 12 refuses abbreviated flags: --foreground-script is not --foreground-scripts.
// The agent notes under .agents are checked as well, because they are where
// the short spelling would be copied from.
const agentNotes = [];
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.md')) agentNotes.push(file);
  }
})(path.join(root, '.agents'));
const abbreviated = /--foreground-script(?!s)\b/;
const short = scripts.concat(agentNotes).filter((file) => abbreviated.test(fs.readFileSync(file, 'utf8')));
assert.deepStrictEqual(short.map((file) => path.relative(root, file)), [],
  'npm 12 rejects the abbreviated --foreground-script; write --foreground-scripts');

// Positive: the Linux dependency install still installs Meteor globally, with
// the flag npm 12 accepts.
const sh = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
assert.match(sh, /^\s*sudo npm -g install meteor --foreground-scripts$/m,
  'build.sh installs Meteor with --foreground-scripts');

// Negative: the scan finds the flag when it is there.
assert.ok(/\bnpm\b[^\n]*--unsafe-perm/.test('sudo npm -g install meteor --unsafe-perm'));
assert.ok(abbreviated.test('npm install -g meteor --foreground-script'));
assert.ok(!abbreviated.test('npm install -g meteor --foreground-scripts'));

console.log('npmNoUnsafePerm: ok');
