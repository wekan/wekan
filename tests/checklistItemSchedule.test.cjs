'use strict';

// #1618: a person responsible for each checklist item, and dated items in the
// calendar and Gantt.
// Run: node tests/checklistItemSchedule.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const s = require('../models/lib/checklistItemSchedule.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const cards = { c1: { _id: 'c1', title: 'Release' }, c2: { _id: 'c2', title: 'Old', archived: true } };
const items = [
  { _id: 'i2', cardId: 'c1', title: 'Tag', dueAt: new Date('2026-10-20T10:00:00Z'), assigneeId: 'u1' },
  { _id: 'i1', cardId: 'c1', title: 'Notes', dueAt: new Date('2026-10-15T10:00:00Z'), isFinished: true },
  { _id: 'i3', cardId: 'c1', title: 'Undated' },
  { _id: 'i4', cardId: 'c2', title: 'On an archived card', dueAt: new Date('2026-10-16T10:00:00Z') },
  { _id: 'i5', cardId: 'gone', title: 'Orphan', dueAt: new Date('2026-10-16T10:00:00Z') },
];

// Positive.
const dated = s.datedChecklistItems(items, id => cards[id]);
assert.deepEqual(dated.map(d => d.id), ['ci:i1', 'ci:i2'], 'dated items, by due date');
assert.equal(dated[0].title, 'Release: Notes');
assert.equal(dated[0].cardId, 'c1');
assert.equal(dated[0].isFinished, true);
assert.equal(dated[1].assigneeId, 'u1');
assert.deepEqual(s.datedChecklistItems(items, id => cards[id], { from: '2026-10-16', to: '2026-10-31' }).map(d => d.id), ['ci:i2'], 'in the range');
assert.equal(s.checklistItemIdOf('ci:i2'), 'i2');
const board = { members: [{ userId: 'u1', isActive: true }, { userId: 'u2', isActive: false }] };
assert.equal(s.mayBeAssigned(board, 'u1'), true);
assert.equal(s.mayBeAssigned(board, null), true, 'nobody');
console.log('  ok - dated items with their card, and members can be made responsible');

// Negative.
assert.equal(s.checklistItemIdOf('c1'), null, 'a card id is never taken for an item');
assert.equal(s.isChecklistItemEventId(undefined), false);
assert.equal(s.mayBeAssigned(board, 'u2'), false, 'not an inactive member');
assert.equal(s.mayBeAssigned(board, 'stranger'), false);
assert.equal(s.mayBeAssigned(null, 'u1'), false);
assert.equal(s.mayBeAssigned(board, { $ne: null }), false);
console.log('  ok - no undated, archived-card or orphan items; no outsider responsible');

// Wiring.
assert.match(read('models/checklistItems.js'), /assigneeId: \{[\s\S]{0,300}type: String,\s*optional: true,/);
const perm = read('server/permissions/checklistItems.js');
assert.match(perm, /if \(!set \|\| !Object\.prototype\.hasOwnProperty\.call\(set, 'assigneeId'\)\) return false;[\s\S]{0,200}return !mayBeAssigned\(await Boards\.findOneAsync\(doc\.boardId\), set\.assigneeId\);/);
const cal = read('client/components/boards/boardBody.js');
assert.match(cal, /datedChecklistItems\([\s\S]{0,800}editable: false,/, 'calendar: shown, not draggable as a card');
for (const f of ['client/components/gantt/frappeGantt.js', 'client/components/gantt/dhtmlxGantt.js']) {
  const g = read(f);
  assert.match(g, /const tasks = \[\.\.\.cardsToTasks\(cards\), \.\.\.itemTasks\];/, f);
  assert.match(g, /const itemId = checklistItemIdOf\(.*?\);\s*\n\s*if \(itemId\) \{[\s\S]{0,200}item\.setDue\(/, `${f}: dragging moves only the item`);
}
const jade = read('client/components/cards/checklists.jade');
assert.match(jade, /a\.checklist-item-assignee\.js-checklist-item-assignee/);
assert.match(jade, /template\(name="checklistItemAssigneePopup"\)/);
console.log('  ok - calendar and both Gantt views, and the assignee picker');
console.log('\nchecklistItemSchedule: all tests passed');
