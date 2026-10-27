'use strict';

// Setup installs Meteor the way https://docs.meteor.com/about/install.html
// does on Linux, macOS and Windows alike: `npx meteor`, as the user, never
// with sudo. npx runs the meteor package's bin, cli.js, which installs when
// given no command, into ~/.meteor (%LOCALAPPDATA%\.meteor on Windows).
//
// It used `sudo npm -g install meteor`, and npm 12 (NPM_VERSION in the
// Dockerfile, which build.sh and build.bat install right before Meteor)
// stopped that three ways in turn, each a Setup -> Install dependencies run.
// A global npm install of meteor left anywhere - a script, or the .agents
// notes it is copied from - still has to get past all three:
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

// Positive: every script that installs Meteor does it with `npx -y meteor`.
// build.sh has it twice: the Linux and the macOS branch. On Linux and macOS
// HOME is .tools for the installer only, so Meteor lands in .tools/.meteor:
// every file WeKan's scripts write stays in .tools/ (releases/tools-env.sh).
for (const [file, line, count] of [
  ['build.sh', 'HOME="$WEKAN_TOOLS_DIR" npx -y meteor', 2],
  ['build.bat', 'call npx -y meteor', 1],
  ['releases/rebuild-release.sh', 'HOME="$WEKAN_TOOLS_DIR" npx -y meteor', 1],
]) {
  assert.strictEqual(lines(path.join(root, file)).filter(({ text }) => text.trim() === line).length,
    count, `${file} installs Meteor with: ${line}`);
}
// And they no longer install it with a global npm install, as the docs advise
// only when npx fails, nor through Homebrew, which has no Meteor formula.
for (const file of ['build.sh', 'build.bat', 'releases/rebuild-release.sh']) {
  const found = lines(path.join(root, file))
    .filter(({ text }) => globalMeteorInstall.test(text) || /brew install meteor\b/.test(text));
  assert.deepStrictEqual(found.map(({ where }) => where), [], `${file} installs Meteor with npx`);
}

// Negative: never as root. The installer warns against it, and as root it
// writes ~/.meteor and the rc files somewhere other than the user's.
assert.deepStrictEqual(offenders(scripts, (text) => /\bsudo\b[^\n]*\bnpx\b[^\n]*\bmeteor\b/.test(text)), [],
  'Meteor is installed as the user, not with sudo');
// A previous setup's global installer package is removed, never left as a
// second `meteor` command beside ~/.meteor/meteor.
assert.match(fs.readFileSync(path.join(root, 'build.sh'), 'utf8'),
  /^\s*sudo npm -g uninstall meteor >\/dev\/null 2>&1 \|\| true$/m);

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
