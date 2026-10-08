'use strict';
// #4906 / #4256: "I like to view some boards as calendar, others as
// swimlanes" - the view menu sits on a board but changed every board. A view
// chosen on a board is now that board's own (profile.boardViews[boardId]); a
// board without its own choice uses the view all boards shared before, then
// the board's default.
//
// Run: node tests/boardViewPerBoard.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const settings = require('../models/lib/boardViewSettings');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const source = read('client/lib/utils.js');
const methods = source.slice(source.indexOf('  boardView() {'), source.indexOf('  // `swimlaneId` scopes'));
let user, boardId = null, pending = null;
const context = {
  ...settings,
  allowBoardView: () => true,
  pendingBoardView: { get: () => pending, set: value => { pending = value; } },
  ReactiveCache: { getCurrentUser: () => user },
  currentUserWith: () => user,
  window: { localStorage: { getItem: () => null, setItem: () => { throw Error('Reading a view must not write storage'); } } },
};
vm.createContext(context);
vm.runInContext(`var Utils = {${methods} getCurrentBoard() { return null; }, getCurrentBoardId() { return currentBoardId(); } };`,
  Object.assign(context, { currentBoardId: () => boardId }));
const Utils = context.Utils;
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('boardViewPerBoard:');

test('each board keeps its own view; others keep the shared one', () => {
  user = { boardViewPreference: 'board-view-swimlanes', boardViewPreferences: { A: 'board-view-cal', B: 'board-view-lists' } };
  boardId = 'A'; assert.equal(Utils.storedBoardView(), 'board-view-cal');
  boardId = 'B'; assert.equal(Utils.storedBoardView(), 'board-view-lists');
  boardId = 'C'; assert.equal(Utils.storedBoardView(), 'board-view-swimlanes', 'a board never chosen on uses the shared view');
  boardId = null; assert.equal(Utils.storedBoardView(), 'board-view-swimlanes', 'off any board, the shared view');
});

test('a pending choice belongs to the board it was made on', () => {
  user = { boardViewPreference: 'board-view-swimlanes', boardViewPreferences: {} };
  pending = { view: 'board-view-cal', boardId: 'A' };
  boardId = 'A'; assert.equal(Utils.storedBoardView(), 'board-view-cal');
  boardId = 'B'; assert.equal(Utils.storedBoardView(), 'board-view-swimlanes', 'not on another board');
  user.boardViewPreferences.A = 'board-view-cal';
  boardId = 'A'; Utils.storedBoardView();
  assert.equal(pending, null, 'acknowledged once board A has it');
});

test('negative: an unknown per-board value falls back rather than rendering nothing', () => {
  user = { boardViewPreference: 'board-view-lists', boardViewPreferences: { A: 'board-view-nonsense' } };
  boardId = 'A'; assert.equal(Utils.storedBoardView(), 'board-view-lists');
});

test('the server stores the choice under the board, checked, and publishes it', () => {
  const model = read('models/users.js');
  assert.match(model, /async setBoardView\(view, boardId\) \{\s*if \(boardId\) \{\s*assertSafeMapKey\(boardId\);[\s\S]*?if \(!isKnownBoardView\(view\)\) throw new Meteor\.Error\('invalid-board-view'[\s\S]*?\[`profile\.boardViews\.\$\{boardId\}`\]: view/);
  assert.match(read('server/models/users.js'), /check\(boardId, Match\.Optional\(Match\.Maybe\(String\)\)\);/);
  assert.match(read('server/publications/userBoardView.js'), /boardViewPreferences: fields\.profile\?\.boardViews \|\| \{\}/);
  assert.match(source, /Meteor\.call\('setBoardView', view, boardId,/);
  assert.match(source, /if \(!boardId\) window\.localStorage\.setItem\('boardView', view\);/);
});

console.log(`\nboardViewPerBoard: ${passed} tests passed`);
