'use strict';

// Every script that installs Meteor with npm has to satisfy npm 12 (NPM_VERSION
// in the Dockerfile, which build.sh and build.bat install right before Meteor).
// Each rule below was a Setup -> Install dependencies run that stopped:
//
// 1. --unsafe-perm: npm 7 removed it and npm 12 refuses an unknown cli flag
//    with EUNKNOWNCONFIG.
// 2. --foreground-script: Meteor's install documentation spells it that way;
//    npm 11 took it as an abbreviation, npm 12 stops with 'Invalid abbreviated
//    flag'. The flag is --foreground-scripts.
// 3. npm 12 runs no package's install script unless allow-scripts names it,
//    and only warns. The meteor npm package is just an installer - its
//    `install` script (`node cli.js install`) is what downloads Meteor - so
//    the install "succeeded" and left no Meteor. --allow-scripts=meteor lets
//    that one script run; npm matches it against the registry URL's name, not
//    the tarball's own package.json, so it allows nothing else.
//
// `npx -y meteor` (the macOS branch) needs none of this: npx runs the
// package's bin, cli.js, which installs when given no command.
//
// Every script this repository runs is checked, and the .agents notes the
// spellings get copied from. Old docs for Meteor 2 (which ships npm 6, where
// --unsafe-perm still existed) and the legacy stacksmith scripts are not run
// with this repository's npm and are not checked.

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
const agentNotes = [];
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.md')) agentNotes.push(file);
  }
})(path.join(root, '.agents'));
assert.ok(scripts.some((file) => file.endsWith(`${path.sep}build.sh`)), 'build.sh is scanned');
assert.ok(scripts.some((file) => file.endsWith(`${path.sep}build.bat`)), 'build.bat is scanned');

const unsafePerm = /\bnpm\b[^\n]*--unsafe-perm|--unsafe-perm[^\n]*\bnpm\b/;
const abbreviated = /--foreground-script(?!s)\b/;
// A global npm install of the meteor package: `npm -g install meteor`,
// `npm install -g meteor`, `npm i -g meteor@3.5.2` - not `meteor npm install`.
const globalMeteorInstall = /(?<!meteor )\bnpm\b(?=[^\n]*\s(?:-g|--global)\b)[^\n]*\s(?:install|i)\s[^\n]*\bmeteor(?:@[\w.]+)?(?=\s|$|`)/;

const lines = (file) => fs.readFileSync(file, 'utf8').split(/\r?\n/)
  .map((text, index) => ({ where: `${path.relative(root, file)}:${index + 1}`, text }))
  .filter(({ text }) => !/^\s*(?:#|REM\b|::)/i.test(text));

const offenders = (files, test) => files.flatMap(lines).filter(({ text }) => test(text))
  .map(({ where }) => where);

assert.deepStrictEqual(offenders(scripts, (text) => unsafePerm.test(text)), [],
  'npm 12 rejects --unsafe-perm with EUNKNOWNCONFIG');
assert.deepStrictEqual(offenders(scripts.concat(agentNotes), (text) => abbreviated.test(text)), [],
  'npm 12 rejects the abbreviated --foreground-script; write --foreground-scripts');

const meteorInstalls = scripts.concat(agentNotes).flatMap(lines)
  .filter(({ text }) => globalMeteorInstall.test(text));
assert.deepStrictEqual(meteorInstalls.filter(({ text }) => !/--allow-scripts=meteor\b/.test(text))
  .map(({ where }) => where), [],
  'npm 12 blocks the meteor installer\'s install script without --allow-scripts=meteor');

// Positive: the scripts that install Meteor still do, in the form npm 12 runs.
for (const [file, line] of [
  ['build.sh', 'sudo npm -g install meteor --foreground-scripts --allow-scripts=meteor'],
  ['build.bat', 'call npm -g install meteor --foreground-scripts --allow-scripts=meteor'],
  ['releases/rebuild-release.sh', 'sudo npm install -g meteor --foreground-scripts --allow-scripts=meteor'],
]) {
  assert.ok(lines(path.join(root, file)).some(({ text }) => text.trim() === line),
    `${file} installs Meteor with: ${line}`);
}
assert.ok(meteorInstalls.length >= 3, 'the global Meteor installs are found');

// Negative: each pattern finds what it is there to find, and nothing else.
assert.ok(unsafePerm.test('sudo npm -g install meteor --unsafe-perm'));
assert.ok(abbreviated.test('npm install -g meteor --foreground-script'));
assert.ok(!abbreviated.test('npm install -g meteor --foreground-scripts'));
for (const text of ['sudo npm -g install meteor', 'npm install -g meteor --foreground-scripts',
  'call npm i --global meteor@3.5.2', '`npm install -g meteor`']) {
  assert.ok(globalMeteorInstall.test(text), text);
}
for (const text of ['meteor npm install', 'npm install meteor-globals', 'npm -g install n',
  'meteor npm install -g meteor-node-stubs', 'npm install -g npm@12.2.0']) {
  assert.ok(!globalMeteorInstall.test(text), text);
}

console.log('npmMeteorInstall: ok');
