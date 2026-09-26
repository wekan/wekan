'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('client/components/boards/boardBody.js', 'utf8');
const start = source.indexOf("    const currentBoardId = Session.get('currentBoard');", source.indexOf('// Pattern:'));
const end = source.indexOf('\n    if (ready) {', start);
assert.ok(start > 0 && end > start);
let boardId = 'first';
let ready = false;
let generation = 0;
let visible = false;
const subscriptions = [];
const instance = { isBoardReady: { set(value) { visible = value; } } };
const run = vm.runInNewContext(`(function () { ${source.slice(start, end)} })`, {
  Session: { get(key) { return key === 'currentBoard' ? boardId : generation; } },
  Meteor: { subscribe(...args) { subscriptions.push(args); return { ready: () => ready }; } },
});
function update(expected) { run.call(instance); assert.equal(visible, expected); }
update(false); // Initial subscription must finish before showing the board.
ready = true;
update(true);
ready = false;
generation++;
update(true); // Refresh keeps the same board's windows mounted.
assert.deepEqual(Array.from(subscriptions.at(-2)), ['board', 'first', false, 1]);
ready = true;
update(true);
boardId = 'second';
ready = false;
update(false); // A different board cannot inherit readiness.
ready = true;
update(true);
boardId = null;
update(false); // Leaving a board clears readiness even after a refresh.
boardId = 'first';
ready = false;
update(false);
console.log('board refresh readiness: initial load, refresh, navigation and no-board cases pass');
