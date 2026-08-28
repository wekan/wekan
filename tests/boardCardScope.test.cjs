'use strict';

// Tests for models/lib/boardCardScope.js and its use in the card publications.
//
// These helpers retain the normal MongoDB selector shapes. Compatibility databases
// must optimize those shapes rather than requiring application-specific rewrites.
// Run: node tests/boardCardScope.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  boardScopeIds,
  boardCardScope,
  isAssignedOnlyMember,
  assignedOnlyCardScope,
  mergeCardScope,
} = require('../models/lib/boardCardScope');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

check('a board with no subtasks-default board keeps the null $in member', () => {
  assert.deepStrictEqual(boardScopeIds({ _id: 'B' }), ['B', null]);
  assert.deepStrictEqual(boardCardScope({ _id: 'B' }), { boardId: { $in: ['B', null] } });
});

check('null and undefined subtasksDefaultBoardId use the same MongoDB selector', () => {
  assert.deepStrictEqual(boardCardScope({ _id: 'B', subtasksDefaultBoardId: null }),
    { boardId: { $in: ['B', null] } });
  assert.deepStrictEqual(boardCardScope({ _id: 'B' }),
    { boardId: { $in: ['B', null] } });
});

check('a real subtasks-default board -> an all-string $in (still pushes down)', () => {
  assert.deepStrictEqual(boardScopeIds({ _id: 'B', subtasksDefaultBoardId: 'S' }), ['B', 'S']);
  assert.deepStrictEqual(boardCardScope({ _id: 'B', subtasksDefaultBoardId: 'S' }),
    { boardId: { $in: ['B', 'S'] } });
});

check('tolerates a missing board', () => {
  assert.deepStrictEqual(boardScopeIds(undefined), []);
  assert.deepStrictEqual(boardScopeIds({}), []);
  assert.deepStrictEqual(boardCardScope({ _id: 'B', subtasksDefaultBoardId: 5 }),
    { boardId: { $in: ['B', 5] } });
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

check('the lazy window keeps ordinary MongoDB conjunction semantics', () => {
  assert.deepStrictEqual(
    mergeCardScope({ listId: 'L', swimlaneId: 'S' }, { boardId: 'B', archived: false }),
    { $and: [
      { listId: 'L', swimlaneId: 'S' },
      { boardId: 'B', archived: false },
    ] });

  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'publications', 'cardsWindow.js'), 'utf8');
  assert.ok(/mergeCardScope\(safe, \{/.test(src), 'the window selector merges through it');
});

// ── assigned-only members ─────────────────────────────────────────────────────
//
// isReadAssignedOnly / isNormalAssignedOnly / isCommentAssignedOnly all mean the
// same thing: the member may only see the cards they are assigned to. The `board`
// publication has always narrowed its card cursor that way; `boardCardsWindow` —
// which is what ships the cards in LAZY card-loading mode — did not, so whether
// the restriction applied at all depended on the board's card-loading mode.
const member = (userId, extra = {}) => ({ userId, isActive: true, ...extra });
const boardWith = (...members) => ({ _id: 'B', members });

check('each of the three assigned-only flags restricts the member', () => {
  for (const flag of ['isReadAssignedOnly', 'isNormalAssignedOnly', 'isCommentAssignedOnly']) {
    const board = boardWith(member('ada', { [flag]: true }));
    assert.strictEqual(isAssignedOnlyMember(board, 'ada'), true, flag);
    assert.deepStrictEqual(assignedOnlyCardScope(board, 'ada'),
      { assignees: { $in: ['ada'] } }, flag);
  }
});

check('an ordinary member is not restricted', () => {
  const board = boardWith(member('ada'), member('bob', { isAdmin: true }));
  assert.strictEqual(isAssignedOnlyMember(board, 'ada'), false);
  assert.strictEqual(assignedOnlyCardScope(board, 'ada'), null);
  assert.strictEqual(assignedOnlyCardScope(board, 'bob'), null);
});

check('an INACTIVE assigned-only member document does not restrict', () => {
  // Matches findWhere(board.members, { userId, isActive: true }) in the board
  // publication: a removed member's leftover document must not narrow anything.
  const board = boardWith({ userId: 'ada', isActive: false, isReadAssignedOnly: true });
  assert.strictEqual(assignedOnlyCardScope(board, 'ada'), null);
});

check('a non-member and a logged-out visitor are not restricted here', () => {
  // Deliberate, and the same as the board publication: the restriction narrows
  // what a MEMBER sees; whether a non-member may see the board at all is decided
  // before this, by boardVisibleTo / isVisibleBy.
  const board = boardWith(member('ada', { isReadAssignedOnly: true }));
  assert.strictEqual(assignedOnlyCardScope(board, 'zoe'), null);
  assert.strictEqual(assignedOnlyCardScope(board, null), null);
  assert.strictEqual(assignedOnlyCardScope(board, undefined), null);
});

check('negative: a board with no/!array members never throws', () => {
  assert.strictEqual(assignedOnlyCardScope({ _id: 'B' }, 'ada'), null);
  assert.strictEqual(assignedOnlyCardScope({ _id: 'B', members: null }, 'ada'), null);
  assert.strictEqual(assignedOnlyCardScope({ _id: 'B', members: {} }, 'ada'), null);
  assert.strictEqual(assignedOnlyCardScope(null, 'ada'), null);
  assert.strictEqual(assignedOnlyCardScope({ _id: 'B', members: [null] }, 'ada'), null);
});

check('the restriction survives a client selector that filters by assignee', () => {
  // The board Filter has an assignee filter of its own, so this collision is
  // reachable from the UI. A top-level merge would let one silently replace the
  // other — and in the direction the publication spreads them, the CLIENT's value
  // would win and the restriction would be gone. $and keeps both, so an
  // assigned-only member filtering for someone else gets nothing rather than
  // everything.
  const board = boardWith(member('ada', { isReadAssignedOnly: true }));
  const clientFilter = { listId: 'L', assignees: { $in: ['bob'] } };
  const merged = mergeCardScope(clientFilter, {
    boardId: 'B',
    archived: false,
    ...assignedOnlyCardScope(board, 'ada'),
  });
  assert.deepStrictEqual(merged, {
    $and: [clientFilter, { boardId: 'B', archived: false, assignees: { $in: ['ada'] } }],
  });
});

check('an unrestricted member also keeps client and server selectors separate', () => {
  const board = boardWith(member('ada'));
  const merged = mergeCardScope({ listId: 'L' }, {
    boardId: 'B',
    archived: false,
    ...assignedOnlyCardScope(board, 'ada'),
  });
  assert.deepStrictEqual(merged, {
    $and: [{ listId: 'L' }, { boardId: 'B', archived: false }],
  });
});

check('both the window and its COUNT are narrowed', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'publications', 'cardsWindow.js'), 'utf8');
  // On the CODE: the comments explain the restriction and name the function, and a
  // guard that counts its own explanation counts wrong.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const uses = code.match(/\.\.\.assignedOnlyCardScope\(/g) || [];
  assert.strictEqual(uses.length, 2,
    'boardCardsWindow AND boardListCardCount — an unrestricted count would still '
    + 'tell the member how many cards the list really holds, and offer to scroll '
    + 'in cards that never arrive');

  // The children (comments/attachments/checklists/items) hang off windowCardIds,
  // which builds on the same selector — so they cannot leak past the restriction.
  assert.ok(/const windowCardIds = async board => \{[\s\S]*?windowSel\(board\)/.test(src),
    'the window children are derived from the restricted window selector');
});

check('the composite parent publishes the members its children read', () => {
  // publish-composite hands each child the document as the PARENT cursor published
  // it. With the old `{ _id: 1 }` projection, board.members was undefined in every
  // child, so assignedOnlyCardScope() would have found no flag to act on and the
  // restriction would have been dead code.
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'publications', 'cardsWindow.js'), 'utf8');
  assert.ok(/fields: \{ _id: 1, members: 1 \}/.test(src),
    'the parent cursor must publish members');
  assert.ok(!/fields: \{ _id: 1 \}, limit: 1/.test(src),
    'the id-only projection must not come back');
});

console.log(`\nboardCardScope: ${passed} checks passed`);
