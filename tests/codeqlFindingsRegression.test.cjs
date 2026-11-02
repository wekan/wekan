'use strict';

// GitHub code scanning "Code quality" findings fixed on 2026-11-02, the ones that
// were real faults rather than style. Each is pinned by the shape of the fault,
// so it cannot return anywhere in the tree, not only at the reported line.
//
// Run: node tests/codeqlFindingsRegression.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('codeqlFindingsRegression:');

test('Missing await: a card\'s original-position description awaits the history it formats', () => {
  const src = read('models/cards.js');
  assert.match(src, /async getOriginalPositionDescription\(\) \{\n\s+const history = await this\.getOriginalPosition\(\);/);
  // negative: no helper formats the result of an async getOriginalPosition without awaiting it
  assert.doesNotMatch(src, /[^t] getOriginalPositionDescription\(\) \{\n\s+const history = this\.getOriginalPosition\(\);/);
});

test('Missing variable declaration: the swipe distances and the drag-scroll locals are declared', () => {
  const att = read('client/components/cards/attachments.js');
  assert.match(att, /const xDist = /);
  assert.match(att, /const yDist = /);
  assert.doesNotMatch(att, /^\s+(xDist|yDist) = /m, 'no assignment to an undeclared global');
  const drag = read('npm-packages/dragscroll/dragscroll.js');
  assert.match(drag, /let obj = e\.target/);
  assert.match(drag, /let noteEditableChild = false/);
});

test('Unhandled error in stream pipeline: a file that cannot be read unlinks itself instead of hanging the upload', () => {
  const src = read('models/lib/fsHooks/createOnAfterUpload.js');
  assert.match(src, /const source = fs\.createReadStream\(/);
  assert.match(src, /source\.on\('error', \(\) => \{\n\s+self\.unlink\(file, versionName\);/);
});

test('Use of exit(): api.py leaves with sys.exit, which exists when the site module is not loaded', () => {
  for (const file of ['api.py', 'docs/Features/Board-Sidebar/Board-Settings/Import-Export/Trello/trello/api.py']) {
    const src = read(file);
    assert.doesNotMatch(src, /^\s*exit\(/m, `${file}: a bare exit() call`);
    assert.doesNotMatch(src, /^\s*exit\s*$/m, `${file}: a bare exit statement does nothing`);
  }
});

test('Overwritten property and unreachable statement in tests are gone', () => {
  assert.doesNotMatch(read('tests/rulesBleed.test.cjs'), /added: \[\], ready\(\)/);
  assert.doesNotMatch(read('tests/securityLog.test.cjs'), /if \(false\) \{/);
});

test('Unhandled rejection: the instance-editing hook and the service worker registration catch their failures', () => {
  const hook = read('server/instanceEditing.js');
  assert.match(hook, /boardOf\(doc\)\n\s+\.then\(boardId => joinOnEdit\(userId, boardId\)\)\n\s+\.catch\(/);
  assert.doesNotMatch(hook, /boardOf\(doc\)\.then\([^)]*\)\); \};/, 'no .then without a catch');
  assert.match(read('client/00-startup.js'), /serviceWorker\.register\(swPath\)\.catch\(/);
});

console.log(`codeqlFindingsRegression: ${passed} tests passed`);
