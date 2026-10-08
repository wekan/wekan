'use strict';
// #1759: "When I move/copy cards to other boards the cards' labels do not copy
// to the destination boards." Labels are matched by name; a missing one is now
// created on the destination board when the actor is its admin
// (models/lib/crossBoardLabels.js), as label creation is admin-only there.
//
// Run: node tests/crossBoardLabels.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { planCrossBoardLabels } = require('../models/lib/crossBoardLabels');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('crossBoardLabels:');

const source = [
  { _id: 's1', name: 'Bug', color: 'red' },
  { _id: 's2', name: 'Docs', color: 'blue' },
  { _id: 's3', name: '', color: 'green' },
  { _id: 's4', name: 'Unused', color: 'black' },
];
let n = 0;
const newId = () => `new-${++n}`;

test('an admin of the destination board brings every named label along', () => {
  n = 0;
  const plan = planCrossBoardLabels({ sourceLabels: source, labelIds: ['s1', 's2', 's3'],
    destLabels: [{ _id: 'd1', name: 'Bug', color: 'orange' }], canCreate: true, newId });
  assert.deepEqual(plan.labelIds, ['d1', 'new-1'], 'Bug matched by name, Docs created');
  assert.deepEqual(plan.create, [{ _id: 'new-1', name: 'Docs', color: 'blue' }], 'with its colour');
});

test('negative: a member who may not create labels gets only the matching ones, as before', () => {
  const plan = planCrossBoardLabels({ sourceLabels: source, labelIds: ['s1', 's2'],
    destLabels: [{ _id: 'd1', name: 'Bug' }], canCreate: false, newId });
  assert.deepEqual(plan, { labelIds: ['d1'], create: [] });
});

test('negative: unnamed labels are never created or matched; unused labels are not brought', () => {
  const plan = planCrossBoardLabels({ sourceLabels: source, labelIds: ['s3'],
    destLabels: [{ _id: 'd0', name: '' }], canCreate: true, newId });
  assert.deepEqual(plan, { labelIds: [], create: [] });
  const none = planCrossBoardLabels({ sourceLabels: undefined, labelIds: undefined, destLabels: undefined, canCreate: true, newId });
  assert.deepEqual(none, { labelIds: [], create: [] });
});

test('one label per name, even when the destination board has duplicates', () => {
  const plan = planCrossBoardLabels({ sourceLabels: [...source, { _id: 's5', name: 'Bug', color: 'red' }], labelIds: ['s1', 's5'],
    destLabels: [{ _id: 'd1', name: 'Bug' }, { _id: 'd2', name: 'Bug' }], canCreate: true, newId });
  assert.deepEqual(plan, { labelIds: ['d1'], create: [] });
});

test('move and copy both use it; the admin check is the destination board\'s', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'models', 'cards.js'), 'utf8');
  assert.match(src, /canCreate: !!\(newBoard && actorId && typeof newBoard\.hasAdmin === 'function' && newBoard\.hasAdmin\(actorId\)\)/);
  assert.equal((src.match(/await crossBoardLabelIds\(this, oldBoard, newBoard\)/g) || []).length, 2, 'copy and move');
  assert.match(src, /await Boards\.updateAsync\(newBoard\._id, \{ \$push: \{ labels: \{ \$each: plan\.create \} \} \}\);/);
});

console.log(`\ncrossBoardLabels: ${passed} tests passed`);
