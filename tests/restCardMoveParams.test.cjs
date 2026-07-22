'use strict';

// Unit tests for the REST card board-move helpers (#3037: moving a card between
// boards via the API). server/lib/restCardHelpers.js is an ES module, so it is
// loaded with a dynamic import(). Run: node tests/restCardMoveParams.test.cjs
//
// #3037: the reporter tried to move a card to another board by editing the raw
// boardId/listId. The supported way is the edit-card API's newBoardId/
// newSwimlaneId/newListId form fields, which normalizeMoveParams recognises as a
// full board move so the handler re-homes the card through cardMove() (updating
// boardId + swimlaneId + listId together). A partial set must NOT be treated as
// a board move (which would leave the card half-moved and bounce back — the exact
// #3037 symptom).

const assert = require('assert');
const fs = require('fs');
const path = require('path');

(async () => {
  const { normalizeMoveParams, computeTopSort } = await import(
    '../server/lib/restCardHelpers.js'
  );

  let passed = 0;
  const check = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  // ── normalizeMoveParams: full board move needs ALL THREE new* ids ──────────
  check('#3037: all three new* ids => isBoardMove (full cross-board move)', () => {
    const p = normalizeMoveParams({ newBoardId: 'B2', newSwimlaneId: 'S2', newListId: 'L2' });
    assert.strictEqual(p.isBoardMove, true);
    assert.strictEqual(p.newBoardId, 'B2');
    assert.strictEqual(p.newSwimlaneId, 'S2');
    assert.strictEqual(p.newListId, 'L2');
  });
  check('#3037: a PARTIAL board move is NOT a board move (no half-move / bounce-back)', () => {
    // The bug class: updating only some of board/swimlane/list leaves the card
    // inconsistent and it bounces back to the old board.
    assert.strictEqual(normalizeMoveParams({ newBoardId: 'B2', newListId: 'L2' }).isBoardMove, false);
    assert.strictEqual(normalizeMoveParams({ newBoardId: 'B2' }).isBoardMove, false);
    assert.strictEqual(normalizeMoveParams({ newSwimlaneId: 'S2', newListId: 'L2' }).isBoardMove, false);
  });
  check('same-board move (listId/swimlaneId) is not a board move', () => {
    const p = normalizeMoveParams({ listId: 'L9', swimlaneId: 'S9' });
    assert.strictEqual(p.isBoardMove, false);
    assert.strictEqual(p.listId, 'L9');
    assert.strictEqual(p.swimlaneId, 'S9');
  });
  check('negative: empty / missing body yields all-undefined, not a board move', () => {
    for (const body of [undefined, null, {}, { title: 'x' }]) {
      const p = normalizeMoveParams(body);
      assert.strictEqual(p.isBoardMove, false);
      assert.strictEqual(p.newBoardId, undefined);
      assert.strictEqual(p.listId, undefined);
    }
  });
  check('negative: empty-string ids are treated as absent', () => {
    const p = normalizeMoveParams({ newBoardId: '', newSwimlaneId: 'S', newListId: 'L' });
    assert.strictEqual(p.isBoardMove, false);
    assert.strictEqual(p.newBoardId, undefined);
  });

  // ── computeTopSort: moved card lands on TOP of the destination list ─────────
  check('#5399: computeTopSort puts the card above the current minimum', () => {
    assert.strictEqual(computeTopSort([3, 5, 1]), 0); // min 1 -> 0
    assert.strictEqual(computeTopSort([-2, 4]), -3);
  });
  check('computeTopSort returns 0 for an empty destination list', () => {
    assert.strictEqual(computeTopSort([]), 0);
    assert.strictEqual(computeTopSort(undefined), 0);
    assert.strictEqual(computeTopSort([NaN, 'x', null]), 0);
  });

  // ── source guard: the edit-card handler re-homes via cardMove on a board move
  check('#3037 wiring: the PUT handler moves through cardMove(boardId,swimlaneId,listId)', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'server', 'models', 'cards.js'), 'utf8');
    assert.ok(/moveParams\.isBoardMove/.test(src), 'handler must branch on isBoardMove');
    assert.ok(/cardMove\(req\.userId, card, \['boardId', 'swimlaneId', 'listId'\]/.test(src),
      'a board move must re-home the card through cardMove with all three fields');
    // and it must validate the destination list/swimlane belong to the new board
    assert.ok(/Destination list not found or does not belong to destination board/.test(src),
      'must reject a destination list not on the destination board');
  });

  console.log(`\nrestCardMoveParams: ${passed} checks passed`);
})().catch(err => { console.error('FAILED:', err && err.stack || err); process.exit(1); });
