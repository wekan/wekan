'use strict';

// #211: named column sets over the same cards, per board.
// Run: node tests/columnSets.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cs = require('../models/lib/columnSets.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let sets = cs.addColumnSet([], 'Priority', 'p');
sets = cs.addColumn(sets, 'p', 'High', 'red', 'ph');
sets = cs.addColumn(sets, 'p', 'Low', 'green', 'pl');
sets = cs.addColumnSet(sets, 'Milestone', 'm');
sets = cs.addColumn(sets, 'm', 'v1', 'blue', 'm1');
const [priority, milestone] = sets;
const cards = [{ _id: 'a', columnSetValues: { p: 'ph', m: 'm1' } }, { _id: 'b', columnSetValues: { p: 'gone' } }, { _id: 'c' }];

// Positive.
assert.deepEqual(cs.columnsWithCards(priority, cards).map(c => [c._id, c.cards.map(x => x._id)]),
  [[null, ['b', 'c']], ['ph', ['a']], ['pl', []]], 'each card in its column; a removed column is "not placed"');
assert.deepEqual(cs.otherSetBadges(cards[0], sets, 'p'), [{ setName: 'Milestone', title: 'v1', color: 'blue' }], 'its place in the other sets');
assert.deepEqual(cs.placeModifier(priority, 'pl'), { $set: { 'columnSetValues.p': 'pl' } }, 'moves only within this set');
assert.deepEqual(cs.placeModifier(priority, null), { $unset: { 'columnSetValues.p': '' } });
assert.equal(cs.removeColumn(sets, 'p', 'ph')[0].columns.length, 1);
assert.equal(cs.removeColumnSet(sets, 'p').length, 1);
console.log('  ok - sets, columns, places and the other sets\' badges');

// Negative.
assert.equal(cs.placeModifier(priority, 'm1'), null, 'not a column of this set');
assert.equal(cs.placeModifier({ _id: 'a.b', columns: [{ _id: 'x' }] }, 'x'), null, 'no dotted keys');
assert.equal(cs.addColumnSet(sets, '   '), null);
assert.equal(cs.addColumn(sets, 'nope', 'X', 'red', 'x'), null, 'unknown set');
assert.equal(cs.addColumn(sets, 'p', 'X', '<b>', 'x')[0].columns[2].color, '', 'unknown colour dropped');
assert.equal(cs.addColumnSet(Array.from({ length: cs.MAX_SETS }, (_, i) => ({ _id: `s${i}` })), 'more', 'n'), null, 'bounded');
console.log('  ok - foreign columns, dotted keys, empty names and unknown colours refused');

assert.match(read('models/boards.js'), /columnSets: \{[\s\S]{0,300}type: Array,\s*optional: true,\s*\},\s*'columnSets\.\$': \{\s*type: Object,\s*blackbox: true,/);
assert.match(read('models/cards.js'), /columnSetValues: \{[\s\S]{0,300}type: Object,\s*optional: true,\s*blackbox: true,/);
const js = read('client/components/boards/columnSetsView.js');
assert.match(js, /const modifier = cs\.placeModifier\(set, event\.currentTarget\.dataset\.columnId \|\| null\);\s*if \(cardId && modifier\) Cards\.update\(cardId, modifier\);/);
assert.match(read('client/components/boards/columnSetsView.jade'), /if isBoardAdmin\s*\n\s*form\.js-add-column-set/, 'only board admins manage the sets');
assert.match(read('client/components/boards/boardBody.jade'), /else if isViewColumnSets\s*\n\s*\+columnSetsView/);
console.log('  ok - the board and card fields, the view and who manages it');
console.log('\ncolumnSets: all tests passed');
