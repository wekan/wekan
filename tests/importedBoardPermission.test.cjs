'use strict';
(async () => {

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { importedBoardPermission } = await import('../models/lib/importedBoardPermission.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('#1991: a Sandstorm export without permission imports privately', () => {
  assert.strictEqual(importedBoardPermission(undefined), 'private');
  assert.strictEqual(importedBoardPermission(null), 'private');
});

test('an explicitly private export remains private', () => {
  assert.strictEqual(importedBoardPermission('private'), 'private');
});

test('an explicitly public export remains public', () => {
  assert.strictEqual(importedBoardPermission('public'), 'public');
});

test('negative: malformed and lookalike values fail closed', () => {
  for (const value of ['', 'PUBLIC', ' public ', 'org', true, 1, {}, []]) {
    assert.strictEqual(importedBoardPermission(value), 'private');
  }
});

test('WekanCreator routes imported visibility through the safe helper', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'models', 'wekanCreator.js'),
    'utf8',
  );
  assert.ok(source.includes("from '/models/lib/importedBoardPermission'"));
  assert.ok(source.includes('permission: importedBoardPermission(boardToImport.permission)'));
  assert.ok(!source.includes('permission: boardToImport.permission'));
});

console.log(`\n${passed} tests passed`);

})().catch(error => {
  console.error(error);
  process.exit(1);
});
