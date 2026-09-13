'use strict';

// Platform paths and repeat-run behavior for the human-run Git mirror scripts.
// This test inspects the scripts; it never contacts or writes to a remote.
// Run: node tests/gitMirrorUpdateScripts.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const shell = read('releases/mirror.sh');
const batch = read('releases/mirror.bat');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('gitMirrorUpdateScripts:');

test('Unix resolves Linux and macOS checkouts from the script location', () => {
  assert.ok(/BASH_SOURCE\[0\]/.test(shell), 'script directory is discovered');
  assert.ok(/WEKAN_ROOT="\$\(cd "\$SCRIPT_DIR\/\.\."/.test(shell),
    'repository root is the parent of releases on either Unix checkout path');
  assert.ok(!/["']~\/repos\/wekan/.test(shell), 'a quoted tilde cannot return');
});

test('Windows discovers its checkout from the script, including the documented Downloads location', () => {
  assert.ok(/%USERPROFILE%\\Downloads\\repos\\wekan/i.test(batch));
  assert.ok(/set "TOOLS_DIR=%WEKAN_ROOT%\\\.tools"/i.test(batch));
  assert.ok(batch.includes('for %%I in ("%~dp0..") do set "WEKAN_ROOT=%%~fI"'));
});

test('both launchers export once and dispatch each active target', () => {
  const menu = read('tools/mirror-menu.mjs');
  assert.ok(shell.includes('mirror-menu.mjs'));
  assert.ok(batch.includes('mirror-menu.mjs'));
  assert.ok(menu.includes('--export-source'));
  assert.ok(menu.includes('mirror-${target}.sh'));
  assert.ok(menu.includes('mirror-${target}.bat'));
  assert.ok(menu.includes('--snapshot'));
  const engine = read('tools/mirror-active-forges.mjs');
  assert.ok(engine.includes("'fetch', 'origin'"), 'existing Git cache fetches new commits');
  assert.ok(engine.includes("'refs/heads/*:refs/heads/*', 'refs/tags/*:refs/tags/*'"), 'only branches and tags are pushed');
  assert.ok(!engine.includes("'--force'"), 'no forced destination updates');
});

test('the active registry has SSH destinations and Windows reads the same registry', () => {
  assert.ok(shell.includes('git@gitlab.com:wekan/wekan'));
  assert.ok(shell.includes('git@codeberg.org:wekan/wekan'));
  assert.ok(shell.includes('ssh://wekan@git.code.sf.net/p/wekan/code'));
  assert.ok(batch.includes('mirror-menu.mjs'));
  assert.ok(read('tools/mirror-menu.mjs').includes('loadSettings'));
});

console.log(`\ngitMirrorUpdateScripts: ${passed} tests passed`);
