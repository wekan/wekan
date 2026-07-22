'use strict';

// Tests for models/lib/boardCardScope.js and its use in the card publications.
//
// 10.22: boards loaded their lists/columns but never their CARDS on FerretDB v1
// (SQLite). Root cause: card queries used `{ boardId: { $in: [board._id,
// board.subtasksDefaultBoardId] } }`, and subtasksDefaultBoardId defaults to null;
// a $in that contains null does NOT push down on FerretDB, so the whole cards table
// was full-scanned + sjson-decoded on every poll while lists (plain equality) stayed
// index-backed. boardCardScope() builds the scope WITHOUT null and prefers equality.
// Run: node tests/boardCardScope.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { boardScopeIds, boardCardScope } = require('../models/lib/boardCardScope');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

check('a board with no subtasks-default board -> plain equality (index-backed)', () => {
  assert.deepStrictEqual(boardScopeIds({ _id: 'B' }), ['B']);
  assert.deepStrictEqual(boardCardScope({ _id: 'B' }), { boardId: 'B' });
});

check('null / undefined / "" subtasksDefaultBoardId is NEVER put in the $in', () => {
  assert.deepStrictEqual(boardCardScope({ _id: 'B', subtasksDefaultBoardId: null }), { boardId: 'B' });
  assert.deepStrictEqual(boardCardScope({ _id: 'B', subtasksDefaultBoardId: '' }), { boardId: 'B' });
  assert.deepStrictEqual(boardCardScope({ _id: 'B' }), { boardId: 'B' });
});

check('a real subtasks-default board -> an all-string $in (still pushes down)', () => {
  assert.deepStrictEqual(boardScopeIds({ _id: 'B', subtasksDefaultBoardId: 'S' }), ['B', 'S']);
  assert.deepStrictEqual(boardCardScope({ _id: 'B', subtasksDefaultBoardId: 'S' }),
    { boardId: { $in: ['B', 'S'] } });
});

check('tolerates a missing/invalid board', () => {
  assert.deepStrictEqual(boardScopeIds(undefined), []);
  assert.deepStrictEqual(boardScopeIds({}), []);
  assert.deepStrictEqual(boardCardScope({ _id: 'B', subtasksDefaultBoardId: 5 }), { boardId: 'B' });
});

// ── source guards: no card query still uses the null-containing $in ────────────
check('board/card publications use boardCardScope, not the null-in-$in literal', () => {
  for (const rel of [
    'server/publications/boards.js',
    'server/publications/cardsWindow.js',
    'server/publications/cards.js',
  ]) {
    const src = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
    assert.ok(!/boardId: \{ \$in: \[board\._id, board\.subtasksDefaultBoardId\] \}/.test(src),
      `${rel} must not use the null-containing $in card scope`);
    assert.ok(/boardCardScope\(board\)/.test(src), `${rel} must use boardCardScope`);
  }
});

check('the lazy window scopes the board at TOP level (not inside a $and)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'publications', 'cardsWindow.js'), 'utf8');
  // The default (non-colliding) path merges the board scope at the top level so it pushes down.
  assert.ok(/\{ \.\.\.safe, boardId: board\._id, archived: false \}/.test(src),
    'the window selector merges boardId/archived at the top level');
  assert.ok(/safeCollides/.test(src), 'a collision guard keeps $and semantics when needed');
});

console.log(`\nboardCardScope: ${passed} checks passed`);
