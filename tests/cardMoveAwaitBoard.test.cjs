'use strict';

// Regression guard for #6504: "Rule to move Card is failing" with
//   TypeError: newBoard.getNextCardNumber is not a function
// On the server ReactiveCache.getBoard() is ASYNC (returns a Promise). In
// Cards.helpers.move(), the cross-board branch called it WITHOUT await, so
// `newBoard` was a Promise: `newBoard.getNextCardNumber()` threw, and `oldBoard`
// being a Promise silently dropped label carry-over. Both getBoard calls in the
// cross-board branch of move() must be awaited.
// Run: node tests/cardMoveAwaitBoard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const src = fs.readFileSync(path.join(__dirname, '..', 'models', 'cards.js'), 'utf8');

check('move(): the cross-board branch awaits both getBoard() calls', () => {
  const at = src.indexOf('async move(');
  assert.ok(at > -1, 'async move() must exist');
  // Look within the move() body (bounded window covering the cross-board branch).
  const body = src.slice(at, at + 4000);
  assert.ok(/const oldBoard = await ReactiveCache\.getBoard\(this\.boardId\)/.test(body),
    'oldBoard must be awaited (else label carry-over is silently lost on move)');
  assert.ok(/const newBoard = await ReactiveCache\.getBoard\(boardId\)/.test(body),
    'newBoard must be awaited (else newBoard.getNextCardNumber is not a function)');
});

check('the cross-board branch still calls getNextCardNumber on the awaited board', () => {
  assert.ok(/await newBoard\.getNextCardNumber\(\)/.test(src),
    'the number is taken from the destination board');
});

console.log(`\ncardMoveAwaitBoard: ${passed} checks passed`);
