'use strict';
// #3143: a "display-only" custom field - every member sees its value (a score,
// a computed value), only a board admin, the REST API as an admin or a rule
// sets it. It reuses the adminOnly write guard: models/lib/adminOnlyCustomFields.js
// decides, server/lib/adminOnlyCustomFields.js assertFieldWrite refuses.
//
// Run: node tests/readOnlyCustomField.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { mayReadField, mayWriteField, writeProtectedValues } = require('../models/lib/adminOnlyCustomFields');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('readOnlyCustomField:');

const defs = new Map([
  ['score', { _id: 'score', boardIds: ['b'], readOnly: true }],
  ['note', { _id: 'note', boardIds: ['b'] }],
  ['shared', { _id: 'shared', boardIds: ['b', 'c'], readOnly: true }],
]);
const member = new Set();
const admin = new Set(['b']);

test('every member reads it; only a board admin writes it', () => {
  assert.equal(mayReadField(defs.get('score'), 'b', member), true);
  assert.equal(mayWriteField(defs.get('score'), 'b', member), false);
  assert.equal(mayWriteField(defs.get('score'), 'b', admin), true);
  assert.equal(mayWriteField(defs.get('note'), 'b', member), true, 'an ordinary field is unchanged');
  assert.equal(mayWriteField(defs.get('shared'), null, admin), false, 'a field shared with a board one is not admin of');
});

test('negative: a member changing, setting or clearing a read-only value is a change the guard sees', () => {
  const card = values => ({ boardId: 'b', customFields: values });
  const before = card([{ _id: 'score', value: 7 }, { _id: 'note', value: 'x' }]);
  const same = writeProtectedValues(before, defs, member);
  assert.deepEqual(writeProtectedValues(card([{ _id: 'note', value: 'changed' }, { _id: 'score', value: 7 }]), defs, member), same,
    'the member may change the ordinary field and reorder');
  for (const after of [
    card([{ _id: 'score', value: 99 }, { _id: 'note', value: 'x' }]),
    card([{ _id: 'score', value: null }, { _id: 'note', value: 'x' }]),
    card([{ _id: 'note', value: 'x' }]),
  ]) assert.notDeepEqual(writeProtectedValues(after, defs, member), same);
  assert.notDeepEqual(writeProtectedValues(card([{ _id: 'score', value: 1 }]), defs, member),
    writeProtectedValues(card([{ _id: 'score', value: null }]), defs, member), 'setting an empty one');
  assert.deepEqual(writeProtectedValues(card([{ _id: 'score', value: 99 }]), defs, admin), [], 'an admin is not restricted');
});

test('the server guard, the definition guard and the editors use it', () => {
  const guard = read('server/lib/adminOnlyCustomFields.js');
  assert.match(guard, /if \(!EJSON\.equals\(writeProtectedValues\(before, definitions, adminBoards\), writeProtectedValues\(after, definitions, adminBoards\)\)\) \{\s*fieldWriteDenied\(userId, source\);/);
  assert.match(guard, /fields: \{ adminOnly: 1, readOnly: 1, boardIds: 1 \}/);
  assert.match(read('server/adminOnlyFieldWrites.js'), /if \(row\.adminOnly \|\| after\?\.adminOnly \|\| row\.readOnly \|\| after\?\.readOnly\) \{/);
  assert.match(read('client/config/blazeHelpers.js'), /if \(this && this\.definition && this\.definition\.readOnly\) \{[\s\S]*?user\.isBoardAdmin\(\)/);
  assert.match(read('client/components/sidebar/sidebarCustomFields.jade'), /a\.flex\.js-field-read-only/);
  assert.match(read('models/customFields.js'), /readOnly: \{[\s\S]*?type: Boolean,\s*defaultValue: false,/);
});

console.log(`\nreadOnlyCustomField: ${passed} tests passed`);
