'use strict';

// Platform paths and repeat-run behavior for the human-run Git mirror scripts.
// This test inspects the scripts; it never contacts or writes to a remote.
// Run: node tests/gitMirrorUpdateScripts.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const shell = read('releases/git-mirror-update.sh');
const batch = read('releases/git-mirror-update.bat');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('gitMirrorUpdateScripts:');

test('Unix resolves Linux and macOS checkouts from the script location', () => {
  assert.ok(/BASH_SOURCE\[0\]/.test(shell), 'script directory is discovered');
  assert.ok(/WEKAN_ROOT="\$\(cd "\$SCRIPT_DIR\/\.\."/.test(shell),
    'repository root is the parent of releases on either Unix checkout path');
  assert.ok(!/["']~\/repos\/wekan/.test(shell), 'a quoted tilde cannot return');
});

test('Windows uses the documented Downloads checkout', () => {
  assert.ok(/%USERPROFILE%\\Downloads\\repos\\wekan/i.test(batch));
  assert.ok(/set "TOOLS_DIR=%WEKAN_ROOT%\\\.tools"/i.test(batch));
});

test('both scripts update existing mirrors as well as new clones', () => {
  for (const [name, script] of [['Unix', shell], ['Windows', batch]]) {
    for (const command of ['pull', 'fetch upstream', 'merge upstream/main', 'push']) {
      assert.ok(script.includes(command), `${name} runs git ${command}`);
    }
  }
  assert.ok(shell.indexOf('git -C "$mirror_dir" pull') > shell.indexOf('fi\n\n  git -C'),
    'Unix update commands are outside the clone-only condition');
});

test('both configured mirrors use their SSH clone URLs', () => {
  for (const script of [shell, batch]) {
    assert.ok(script.includes('git@gitlab.com:wekan/wekan'));
    assert.ok(script.includes('git@codeberg.org:wekan/wekan'));
  }
});

console.log(`\ngitMirrorUpdateScripts: ${passed} tests passed`);
