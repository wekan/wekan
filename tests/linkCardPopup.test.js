/**
 * Test: link-card popup logic (client/components/lists/listBody.js).
 *
 * Regression coverage for https://github.com/wekan/wekan/issues/5715
 * "Impossible to create a Link to a whole BOARD if that board already has
 * cards." Selecting a board used to auto-populate the List/Card sub-selects,
 * leaving no way to link to the whole board once it had content.
 *
 * These tests re-implement the pure decision logic of the popup so they can run
 * as a plain Node script (no Meteor / DB), mirroring the style of
 * tests/cards.stickers.test.js. They assert two things:
 *
 *   - the cards-query selector only constrains by board/swimlane/list when one
 *     is actually selected (faithful copy of the `cards()` helper), and
 *   - clicking the popup's confirm button picks the right link given the
 *     blank-defaulting selects (faithful copy of the `.js-done` handler), so a
 *     whole board can be linked even when the board already has cards, and a
 *     blank card selection never produces a phantom linked card.
 */

const assert = require('assert');

// --- Faithful copy of the cards() helper selector (listBody.js) -----------
// The select <option value=""> entries mean an unselected sub-field is the
// empty string. Only selected ids should narrow the query; otherwise every
// linkable card on the board is returned. ownCardsIds are excluded so a card
// cannot be linked to itself / re-linked.
function buildCardsSelector({ boardId, swimlaneId, listId, ownCardsIds }) {
  const selector = {
    archived: false,
    linkedId: { $nin: ownCardsIds },
    _id: { $nin: ownCardsIds },
    type: { $nin: ['template-card'] },
  };
  if (boardId) selector.boardId = boardId;
  if (swimlaneId) selector.swimlaneId = swimlaneId;
  if (listId) selector.listId = listId;
  return selector;
}

// --- Faithful copy of the change-board handler (listBody.js) --------------
// Choosing a board clears the swimlane/list selection so nothing is
// auto-forced; the blank "(none)" option stays the default.
function onChangeBoard(state, val) {
  return { ...state, selectedSwimlaneId: '', selectedListId: '', selectedBoardId: val };
}

// --- Faithful copy of the `.js-done` confirm handler decision -------------
// Returns the card document that would be inserted, or null when nothing
// should be linked. `existingBoardLink` mirrors the duplicate-board guard
// (ReactiveCache.getCard({ linkedId: boardId, archived: false })).
function decideLink({ selectedCardId, selectedBoardId, existingBoardLink }) {
  if (selectedCardId) {
    return { type: 'cardType-linkedCard', linkedId: selectedCardId };
  }
  // No card chosen: fall back to a board-level link when a board is selected.
  if (!selectedBoardId) return null;
  if (existingBoardLink) return null;
  return { type: 'cardType-linkedBoard', linkedId: selectedBoardId };
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// ----- selector: only narrows by what is actually selected -----------------

test('cards selector with only a board narrows by boardId, not swimlane/list', () => {
  const sel = buildCardsSelector({
    boardId: 'b1',
    swimlaneId: '',
    listId: '',
    ownCardsIds: ['own1'],
  });
  assert.strictEqual(sel.boardId, 'b1');
  assert.ok(!('swimlaneId' in sel), 'must not constrain by an unselected swimlane');
  assert.ok(!('listId' in sel), 'must not constrain by an unselected list');
  assert.deepStrictEqual(sel.linkedId, { $nin: ['own1'] });
  assert.deepStrictEqual(sel._id, { $nin: ['own1'] });
});

test('cards selector adds swimlane/list only when chosen', () => {
  const sel = buildCardsSelector({
    boardId: 'b1',
    swimlaneId: 's1',
    listId: 'l1',
    ownCardsIds: [],
  });
  assert.strictEqual(sel.boardId, 'b1');
  assert.strictEqual(sel.swimlaneId, 's1');
  assert.strictEqual(sel.listId, 'l1');
});

test('cards selector with no board still excludes own/template cards', () => {
  const sel = buildCardsSelector({
    boardId: '',
    swimlaneId: '',
    listId: '',
    ownCardsIds: ['own1', 'own2'],
  });
  assert.ok(!('boardId' in sel));
  assert.deepStrictEqual(sel.type, { $nin: ['template-card'] });
  assert.strictEqual(sel.archived, false);
});

// ----- negative: choosing a board does not auto-force a card ---------------

test('choosing a board clears swimlane/list (no auto-select)', () => {
  let state = { selectedBoardId: '', selectedSwimlaneId: 's_old', selectedListId: 'l_old' };
  state = onChangeBoard(state, 'b1');
  assert.strictEqual(state.selectedBoardId, 'b1');
  assert.strictEqual(state.selectedSwimlaneId, '', 'swimlane must reset to blank');
  assert.strictEqual(state.selectedListId, '', 'list must reset to blank');
});

// ----- positive: link to a whole board even when it has cards --------------

test('board selected + blank card => board-level link (board HAS cards)', () => {
  // Board has cards, but the user left the Card select on the blank option.
  const result = decideLink({
    selectedCardId: '',
    selectedBoardId: 'b1',
    existingBoardLink: false,
  });
  assert.ok(result, 'a link should be created');
  assert.strictEqual(result.type, 'cardType-linkedBoard');
  assert.strictEqual(result.linkedId, 'b1');
});

test('board selected + blank card => board-level link (empty board behaves the same)', () => {
  const result = decideLink({
    selectedCardId: '',
    selectedBoardId: 'emptyBoard',
    existingBoardLink: false,
  });
  assert.ok(result);
  assert.strictEqual(result.type, 'cardType-linkedBoard');
  assert.strictEqual(result.linkedId, 'emptyBoard');
});

// ----- positive: linking a specific card still works -----------------------

test('card selected => linked-card link (board choice is overridden by card)', () => {
  const result = decideLink({
    selectedCardId: 'cardX',
    selectedBoardId: 'b1',
    existingBoardLink: false,
  });
  assert.ok(result);
  assert.strictEqual(result.type, 'cardType-linkedCard');
  assert.strictEqual(result.linkedId, 'cardX');
});

// ----- negative: no phantom/undefined card link ----------------------------

test('nothing selected => no link (no phantom/undefined card)', () => {
  const result = decideLink({
    selectedCardId: '',
    selectedBoardId: '',
    existingBoardLink: false,
  });
  assert.strictEqual(result, null);
});

test('blank card with no board never yields an undefined linkedId', () => {
  const result = decideLink({
    selectedCardId: undefined,
    selectedBoardId: undefined,
    existingBoardLink: false,
  });
  assert.strictEqual(result, null);
});

// ----- negative: duplicate board link guard --------------------------------

test('board already linked + blank card => no duplicate board link', () => {
  const result = decideLink({
    selectedCardId: '',
    selectedBoardId: 'b1',
    existingBoardLink: true,
  });
  assert.strictEqual(result, null, 'must not create a second linkedBoard card');
});

test('board already linked but a card is chosen => still links the card', () => {
  // The duplicate-board guard must not block linking a specific card.
  const result = decideLink({
    selectedCardId: 'cardX',
    selectedBoardId: 'b1',
    existingBoardLink: true,
  });
  assert.ok(result);
  assert.strictEqual(result.type, 'cardType-linkedCard');
  assert.strictEqual(result.linkedId, 'cardX');
});

if (typeof describe === 'function') {
  describe('link-card popup logic (#5715)', () => {
    tests.forEach(([name, fn]) => it(name, fn));
  });
} else {
  console.log('Link-card popup tests (#5715)\n');
  let failed = 0;
  tests.forEach(([name, fn]) => {
    try {
      fn();
      console.log(`✓ ${name}`);
    } catch (e) {
      failed++;
      console.log(`✗ ${name}\n    ${e.message}`);
    }
  });
  console.log(`\n${tests.length - failed}/${tests.length} passed`);
  if (failed > 0) process.exitCode = 1;
}
