'use strict';

// "Install WeKan dependencies" on macOS installs Node with nvm, and installs
// the NEWEST 24.x rather than a version somebody has to remember to bump.
//
// It used to be `brew install node@24`, which has two problems: Homebrew's
// bottle trails nodejs.org, so "24" meant whatever Homebrew had built, and the
// formula is keg-only, so PATH, LDFLAGS and CPPFLAGS had to be exported into
// ~/.zshrc by hand. It also ran `npm config set prefix '~/.npm'` - which is
// exactly what nvm cannot live with - and created the prefix directory with an
// UNEXPANDED tilde, so `mkdir "~/.npm"` made a directory literally named `~`
// in whatever directory build.sh was run from.
//
// Run: node tests/macosNodeInstall.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const sh = fs.readFileSync(path.join(__dirname, '..', 'build.sh'), 'utf8');

// The INSTALL branch specifically: `darwin` also appears in the branches that
// work out the machine's IP address, which have nothing to do with this.
const start = sh.indexOf('elif [[ "$OSTYPE" == "darwin"* ]]; then\n\t\t\techo "macOS"');
assert.ok(start !== -1, 'the macOS install branch must be findable');
const macos = sh.slice(start, sh.indexOf('elif [[ "$OSTYPE" == "cygwin" ]]', start));

// The CODE of that branch. The comments in it explain the change by naming what
// it replaced - "brew install node@24 gives whatever Homebrew has bottled" - so
// a guard that greps the whole branch for `brew install node@24` reads its own
// explanation and fails on a correct script.
const code = macos.replace(/^[ \t]*#.*$/gm, '');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('macosNodeInstall:');

test('Node comes from nvm', () => {
  assert.ok(/nvm install 24\b/.test(code), 'it installs Node through nvm');
  assert.ok(/nvm alias default 24\b/.test(code), 'and makes it the default for new shells');
  assert.ok(/nvm use 24\b/.test(code), 'and uses it for the rest of this run');
});

test('and the version asked for is the newest 24.x, not a pinned one', () => {
  // `nvm install 24` resolves to the latest 24.x on nodejs.org every time it
  // runs. `nvm install 24.18.1` would be correct for exactly as long as it
  // takes Node to cut the next patch.
  const spec = code.match(/nvm install (\S+)/);
  assert.ok(spec, 'there must be an nvm install line');
  assert.strictEqual(spec[1], '24', 'the major alone, so it never needs bumping');
  assert.ok(!/nvm install \d+\.\d+/.test(code), 'no pinned minor or patch');
});

test('the nvm installer is pinned to a tag, not to master', () => {
  // This pipes a downloaded script straight into a shell.
  const url = code.match(/https:\/\/raw\.githubusercontent\.com\/nvm-sh\/nvm\/([^/]+)\/install\.sh/);
  assert.ok(url, 'the nvm install script must be fetched from its repo');
  assert.match(url[1], /^v\d+\.\d+\.\d+$/, `a release tag, not "${url[1]}"`);
  assert.ok(/curl -fsSL /.test(code), 'and fail on an HTTP error rather than piping the error page');
});

test('nvm is sourced before it is used', () => {
  // nvm is a shell FUNCTION. Without this line `command -v nvm` finds nothing
  // and every nvm call below is "command not found", even right after a
  // successful install.
  const sourced = code.indexOf('. "$NVM_DIR/nvm.sh"');
  assert.ok(sourced !== -1, 'nvm.sh must be sourced');
  assert.ok(sourced < code.indexOf('nvm install 24'), 'before the first nvm call');
  assert.ok(/NVM_DIR="\$\{NVM_DIR:-\$HOME\/\.nvm\}"/.test(code),
    'and an NVM_DIR the caller already set must be honoured');
  assert.ok(/if ! command -v nvm/.test(code), 'a failed install is reported, not run into');
});

test('npm prefix is cleared, never set', () => {
  // `npm config set prefix` overrides the per-version prefix nvm points at:
  // global installs land outside the Node version they were installed for, and
  // nvm refuses to switch versions while it is set. A machine that ran the old
  // Homebrew branch has it set, so clearing it is not optional.
  assert.ok(!/npm config set prefix/.test(code), 'the prefix must not be set');
  assert.ok(/npm config delete prefix/.test(code), 'and any existing one is cleared');
  // The tilde bug: `directory_name="~/.npm"` then `mkdir "$directory_name"`.
  assert.ok(!/mkdir "\$directory_name"/.test(code), 'no mkdir of an unexpanded tilde');
  assert.ok(!/'~\/\.npm'/.test(code) && !/"~\/\.npm"/.test(code),
    'a quoted ~ is a literal ~, not the home directory');
});

test('the Homebrew node@24 keg and its hand-exported flags are gone', () => {
  for (const gone of ['brew install node@24', 'brew install npm',
    '/opt/homebrew/opt/node@24', 'LDFLAGS', 'CPPFLAGS']) {
    assert.ok(!code.includes(gone), `${gone} belongs to the Homebrew keg that was replaced`);
  }
});

test('a new shell finds nvm too', () => {
  assert.ok(/export NVM_DIR="\$HOME\/\.nvm"/.test(code), 'NVM_DIR is exported in the rc file');
  assert.ok(/for rc in "\$HOME\/\.zshrc" "\$HOME\/\.bashrc"/.test(code),
    'zsh (the macOS default) and bash both');
  // Appended once, however many times this menu entry is run.
  assert.strictEqual((code.match(/grep -qxF/g) || []).length, 2,
    'each line is added only if it is not already there');
  assert.ok(/touch "\$HOME\/\.zshrc"/.test(code),
    'and .zshrc is created if the machine has none');
});

test('Meteor is still installed the same way afterwards', () => {
  // The point of the branch is Node; everything after it is unchanged.
  assert.ok(/npx -y meteor/.test(code));
  assert.ok(/export PATH=~\/\.meteor:\$PATH/.test(code));
});

test('and Linux is untouched - it installs Node its own way', () => {
  // Only macOS was asked to move to nvm. Linux uses `n` from npm, which needs
  // sudo and is what the Debian/Ubuntu instructions say.
  const linux = sh.slice(sh.indexOf('if [[ "$OSTYPE" == "linux-gnu" ]]; then'), start);
  assert.ok(/sudo npm -g install n\b/.test(linux), 'Linux still uses n');
  assert.ok(!/nvm/.test(linux), 'and not nvm');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nmacosNodeInstall: ${passed} tests passed`);
