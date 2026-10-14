'use strict';

// Guard: #2040 - a board-defined label order, which a list can be sorted by.
// Run: node tests/labelOrder.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const o = require('../models/lib/labelOrder.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const labels = [{ _id: 'urgent' }, { _id: 'bug' }, { _id: 'idea' }];

test('a label moves one step; the ends and unknown labels do not move', () => {
  assert.deepStrictEqual(o.moveLabel(labels, 'idea', 'up').map(l => l._id), ['urgent', 'idea', 'bug']);
  assert.deepStrictEqual(o.moveLabel(labels, 'urgent', 'down').map(l => l._id), ['bug', 'urgent', 'idea']);
  assert.deepStrictEqual(o.moveLabel(labels, 'urgent', 'up').map(l => l._id), ['urgent', 'bug', 'idea']);
  assert.deepStrictEqual(o.moveLabel(labels, 'idea', 'down').map(l => l._id), ['urgent', 'bug', 'idea']);
  assert.deepStrictEqual(o.moveLabel(labels, 'nope', 'up').map(l => l._id), ['urgent', 'bug', 'idea']);
  assert.deepStrictEqual(o.moveLabel(labels, 'bug', 'sideways').map(l => l._id), ['urgent', 'bug', 'idea']);
  assert.deepStrictEqual(labels.map(l => l._id), ['urgent', 'bug', 'idea'], 'the input is not changed');
});

test('cards sort by their first label in the board\'s order, unlabelled last, ties keep their order', () => {
  const cards = [
    { _id: 'a', labelIds: [] },
    { _id: 'b', labelIds: ['idea'] },
    { _id: 'c', labelIds: ['bug', 'idea'] },
    { _id: 'd', labelIds: ['urgent'] },
    { _id: 'e', labelIds: ['idea'] },
    { _id: 'f', labelIds: ['removed-label'] },
  ];
  assert.deepStrictEqual(o.sortCardsByLabelOrder(cards, labels).map(c => c._id), ['d', 'c', 'b', 'e', 'a', 'f']);
  // Reordering the labels reorders the list.
  const moved = o.moveLabel(labels, 'idea', 'up');
  assert.deepStrictEqual(o.sortCardsByLabelOrder(cards, o.moveLabel(moved, 'idea', 'up')).map(c => c._id), ['b', 'c', 'e', 'd', 'a', 'f']);
});

test('UI: Move up / Move down when editing a label, and the sort entry', () => {
  assert.match(read('client/components/cards/labels.jade'), /button\.js-move-label\(type="button" data-direction="up"/);
  assert.match(read('client/components/cards/labels.js'), /await board\.moveLabel\(this\._id, event\.currentTarget\.dataset\.direction\)/);
  assert.match(read('client/components/boards/boardHeader.jade'), /a\.js-sort-label-order/);
  assert.match(read('client/components/boards/boardHeader.js'), /setCardsSortBy\(\{ labelOrder: 1 \}\)/);
  assert.match(read('client/components/lists/listBody.js'), /sortCardsByLabelOrder\(cards, board \? board\.labels : \[\]\)/);
});

test('negative: a display order only, through the board-admin label write', () => {
  const list = read('client/components/lists/listBody.js');
  // the cards' manual `sort` is never written by this sort
  assert.doesNotMatch(read('models/lib/labelOrder.js'), /updateAsync|sort:/);
  assert.match(list, /if \(sortByVotes \|\| sortByLabelOrder\) \{\s*sortBy = defaultSort;/);
  // the same Boards update as editing a label: board admins (server/permissions/boards.js)
  const boards = read('models/boards.js');
  assert.match(boards, /async moveLabel\(labelId, direction\) \{[\s\S]*?return await Boards\.updateAsync\(this\._id, \{ \$set: \{ labels \} \}\);/);
});

console.log(`# ${passed} passed`);
