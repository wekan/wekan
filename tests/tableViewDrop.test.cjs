'use strict';

// #864: drag-and-drop and adding cards in the Table view.
// Run: node tests/tableViewDrop.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { tableViewDropTarget } = require('../models/lib/tableViewDrop.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const cell = [
  { _id: 'a', sort: 0, boardId: 'b', listId: 'L2', swimlaneId: 'S2' },
  { _id: 'b', sort: 1, boardId: 'b', listId: 'L2', swimlaneId: 'S2' },
  { _id: 'c', sort: 2, boardId: 'b', listId: 'L2', swimlaneId: 'S2' },
];
const dragged = { _id: 'x', sort: 7, listId: 'L1', swimlaneId: 'S1' };

// Positive.
assert.deepEqual(tableViewDropTarget(dragged, cell[1], cell), { boardId: 'b', swimlaneId: 'S2', listId: 'L2', sort: 0.5 }, 'between the card before and the target');
assert.equal(tableViewDropTarget(dragged, cell[0], cell).sort, -1, 'before the first');
assert.equal(tableViewDropTarget(cell[0], cell[2], cell).sort, 1.5, 'within the same list, ignoring itself');
console.log('  ok - the card lands just before the target, in its list and swimlane');

// Negative.
assert.equal(tableViewDropTarget(dragged, dragged, cell), null, 'onto itself: nothing');
assert.equal(tableViewDropTarget(null, cell[0], cell), null);
assert.equal(tableViewDropTarget(dragged, cell[1], null).sort, 0, 'unknown neighbours: one before the target');
console.log('  ok - no move onto itself or without both cards');

// Server: adding needs the right to write in that list, on that board.
const server = read('server/tableViewCards.js');
assert.match(server, /Lists\.findOneAsync\(\{ _id: input\.listId, boardId: board\._id, archived: \{ \$ne: true \} \}\)/);
assert.match(server, /Swimlanes\.findOneAsync\(\{ _id: input\.swimlaneId, boardId: board\._id, archived: \{ \$ne: true \} \}\)/);
assert.match(server, /if \(!\(await canWriteInList\(this\.userId, board, list\._id\)\)\) throw new Meteor\.Error\('not-authorized'\);/);
assert.match(server, /if \(!title\) throw new Meteor\.Error\('table-view-empty-title'\);/);
assert.match(read('server/imports.js'), /import '\/server\/tableViewCards';/);

// UI: only for those who may write; moves through card.move.
const jade = read('client/components/boards/tableView.jade');
assert.match(jade, /tr\.js-table-view-row\(draggable="\{\{#if canWrite\}\}true\{\{\/if\}\}" data-card-id=row\.card\._id\)/);
assert.match(jade, /if canWrite\s*\n\s*form\.table-view-add-card\.js-table-view-add-card/);
const js = read('client/components/boards/tableView.js');
assert.match(js, /canWrite\(\) \{[\s\S]{0,100}Utils\.currentUserCan\('write', board\)/);
assert.match(js, /await dragged\.move\(to\.boardId, to\.swimlaneId, to\.listId, to\.sort\);/);
assert.match(js, /Meteor\.callAsync\('tableViewAddCard', \{ boardId: board\._id, title,/);
console.log('  ok - adding checks the list on the server; rows drag only for writers');
console.log('\ntableViewDrop: all tests passed');
