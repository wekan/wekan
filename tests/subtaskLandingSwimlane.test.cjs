'use strict';

// #1953: Board Settings / Subtasks picks the swimlane new subtasks land in.
// Run: node tests/subtaskLandingSwimlane.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chooseSubtaskSwimlane } = require('../models/lib/subtaskLandingSwimlane.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const deposit = { _id: 'D', subtasksDefaultSwimlaneId: 'd2' };
const main = { _id: 'M', subtasksDefaultSwimlaneId: 'd3' };
const lanes = [
  { _id: 'd1', boardId: 'D', title: 'Default' },
  { _id: 'd2', boardId: 'D', title: 'Team A' },
  { _id: 'd3', boardId: 'D', title: 'Team B' },
  { _id: 'gone', boardId: 'D', title: 'Old', archived: true },
  { _id: 'm1', boardId: 'M', title: 'Team A' },
];
const choose = (parentBoard, targetBoard, title) => chooseSubtaskSwimlane({ parentBoard, targetBoard, swimlanes: lanes, parentSwimlaneTitle: title });

// Positive.
assert.deepEqual(choose(main, deposit, 'Team A'), { swimlaneId: 'd3' }, 'the main board\'s choice on a shared deposit board wins');
assert.deepEqual(choose({ _id: 'X' }, deposit, 'Team B'), { swimlaneId: 'd2' }, 'else the deposit board\'s own choice');
assert.deepEqual(choose(deposit, deposit, 'Team B'), { swimlaneId: 'd2' }, 'a board depositing on itself');
console.log('  ok - the chosen swimlane is used, the main board\'s first');

// Negative: a choice that is not a live swimlane of the deposit board is never used.
for (const bad of ['gone', 'm1', 'missing', '', null, undefined]) {
  assert.deepEqual(choose({ _id: 'M', subtasksDefaultSwimlaneId: bad }, { _id: 'D', subtasksDefaultSwimlaneId: bad }, 'Team A'),
    { swimlaneId: 'd2' }, `${bad}: falls back to the title match`);
  assert.deepEqual(choose({ _id: 'M', subtasksDefaultSwimlaneId: bad }, { _id: 'D', subtasksDefaultSwimlaneId: bad }, 'Nothing'),
    { fallback: true }, `${bad}: then the default swimlane`);
}
assert.deepEqual(chooseSubtaskSwimlane({ parentBoard: null, targetBoard: { _id: 'D' }, swimlanes: null }), { fallback: true });
console.log('  ok - an archived, foreign or missing choice is ignored');

// Wiring and UI.
const cards = read('server/models/cards.js');
assert.match(cards, /chooseSubtaskSwimlane\(\{ parentBoard, targetBoard,\s*\n\s*swimlanes: await Swimlanes\.find\(\{ boardId: targetBoard\._id, archived: \{ \$ne: true \} \}\)\.fetchAsync\(\),/);
const boards = read('models/boards.js');
assert.match(boards, /subtasksDefaultSwimlaneId: \{[\s\S]{0,300}type: String,\s*optional: true,/);
assert.match(boards, /async setSubtasksDefaultSwimlaneId\(subtasksDefaultSwimlaneId\) \{/);
assert.match(read('models/lib/boardCopyDefaults.js'), /patch\.subtasksDefaultSwimlaneId = null;/, 'a copied board does not keep the template\'s swimlane');
const jade = read('client/components/sidebar/sidebar.jade');
assert.match(jade, /\{\{_ 'deposit-subtasks-swimlane'\}\}\s*\n\s*select\.js-field-deposit-swimlane/);
const js = read('client/components/sidebar/sidebar.js');
assert.match(js, /'change \.js-field-deposit-swimlane'\(evt, tpl\) \{[\s\S]{0,200}setSubtasksDefaultSwimlaneId\(value\)/);
assert.match(js, /setSubtasksDefaultListId\(null\);\s*\n\s*\/\/ #1953[^\n]*\n\s*tpl\.currentBoard\.setSubtasksDefaultSwimlaneId\(null\);/, 'changing the deposit board clears it');
console.log('  ok - addSubtaskCard and Board Settings / Subtasks use it');
console.log('\nsubtaskLandingSwimlane: all tests passed');
