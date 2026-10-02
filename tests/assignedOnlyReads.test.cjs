'use strict';

// Guard: AssignedBleed, read siblings (2026-10-02). An assigned-only member (isReadAssignedOnly,
// isNormalAssignedOnly, isCommentAssignedOnly) sees only the cards assigned to
// them. The board publication enforced that, but several other read paths
// asked only "is this a member of the board?" and so showed that member every
// card of it:
//   - the attachment API (REST and DDP): list enumerated every attachment of
//     the board, download and info served any of them;
//   - the activities publication: a board's whole activity feed, and the
//     feed of any card by id;
//   - Due Cards with "all users", and Global Search;
//   - the structural move dialog's card and checklist-item pickers;
//   - position history for the board and a card's original position.
// Run: node tests/assignedOnlyReads.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const scope = require('../models/lib/boardCardScope');

function loadAttachments(cards) {
  const src = read('server/lib/assignedOnlyAttachments.js')
    .replace(/^import [^\n]*\n/gm, '').replace(/^const \{ isAssignedOnlyMember \} = require[^\n]*\n/m, '')
    .replace(/^export /gm, '');
  const ReactiveCache = {
    getCards: async selector => cards.filter(c => c.boardId === selector.boardId && c.assignees.includes(selector.assignees)),
    getCard: async id => cards.find(c => c._id === id),
  };
  const lib = { records: [] };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'ReactiveCache', 'isAssignedOnlyMember', 'require',
    `${src}\nexports.assignedOnlyAttachmentScope = assignedOnlyAttachmentScope;\nexports.mayReadBoardAttachment = mayReadBoardAttachment;`)(
    lib, ReactiveCache, scope.isAssignedOnlyMember, () => ({ record: r => lib.records.push(r) }));
  return lib;
}

const board = {
  _id: 'b',
  members: [
    { userId: 'restricted', isActive: true, isNormalAssignedOnly: true },
    { userId: 'normal', isActive: true },
  ],
};
const cards = [
  { _id: 'mine', boardId: 'b', assignees: ['restricted'] },
  { _id: 'theirs', boardId: 'b', assignees: ['normal'] },
  { _id: 'elsewhere', boardId: 'other', assignees: ['restricted'] },
];

test('the reported shape: an assigned-only member reads only their own cards\' attachments', async () => {
  const { assignedOnlyAttachmentScope, mayReadBoardAttachment, records } = loadAttachments(cards);
  assert.deepEqual(await assignedOnlyAttachmentScope(board, 'restricted'), { 'meta.cardId': { $in: ['mine'] } });
  assert.equal(await mayReadBoardAttachment(board, 'restricted', { meta: { cardId: 'theirs' } }), false);
  assert.equal(await mayReadBoardAttachment(board, 'restricted', { meta: { cardId: 'elsewhere' } }), false);
  assert.equal(await mayReadBoardAttachment(board, 'restricted', { meta: {} }), false);
  assert.equal(await mayReadBoardAttachment(board, 'restricted', { meta: { cardId: 'mine' } }), true);
  // An ordinary member is not narrowed (negative).
  assert.equal(await assignedOnlyAttachmentScope(board, 'normal'), null);
  assert.equal(await mayReadBoardAttachment(board, 'normal', { meta: { cardId: 'mine' } }), true);
  // The three refusals are in Admin Panel -> Problems, and never disable.
  assert.equal(records.length, 3);
  assert.deepEqual([...new Set(records.map(r => `${r.key}/${r.action}/${r.userId}`))], ['authz.assigned/blocked/restricted']);
  assert.match(read('models/lib/securityCategories.js'), /'authz\.assigned':\s*\{[^}]*severity: 'medium'/);
});

test('negative: every attachment API read applies the assigned-only rule', () => {
  for (const file of ['server/attachmentApi.js', 'server/routes/attachmentApi.js']) {
    const src = read(file);
    // Each "access this attachment" refusal also asks mayReadBoardAttachment.
    const refusals = src.split('\n').filter(l => /hasMember\((this\.)?userId\)/.test(l));
    for (const line of refusals.filter(l => !/download-background|Background/.test(l))) {
      const i = src.indexOf(line);
      const next = src.slice(i, src.indexOf('\n', src.indexOf('\n', i) + 1));
      if (/access this attachment/.test(next)) assert.match(line, /mayReadBoardAttachment\(/, `${file}: ${line.trim()}`);
    }
    // Each board-wide listing is narrowed.
    let at = src.indexOf("{ 'meta.boardId': boardId }");
    assert.ok(at > 0, file);
    while (at > 0) {
      const window = src.slice(Math.max(0, at - 300), at + 900);
      assert.match(window, /assignedOnlyAttachmentScope\(board, (this\.)?userId\)/, `${file} @${at}`);
      at = src.indexOf("{ 'meta.boardId': boardId }", at + 1);
    }
  }
});

test('the other read paths apply the same rule', () => {
  const activities = read('server/publications/activities.js');
  assert.match(activities, /if \(!mayCopyFromBoard\(board, this\.userId, card\)\) \{\n\s*return this\.ready\(\);/);
  assert.match(activities, /if \(kind === 'board' && isAssignedOnlyMember\(board, this\.userId\)\)/);
  const cardsPub = read('server/publications/cards.js');
  assert.match(cardsPub, /\{ boardId: \{ \$in: assignedOnlyBoards \}, assignees: userId \}/);
  assert.match(cardsPub, /\{ boardId: \{ \$in: assignedOnlyBoardIds \}, assignees: userId \}/);
  const move = read('server/moveBoardObjects.js');
  assert.match(move, /result\.cardId = await projected\(Cards, \{[^}]*\.\.\.cardScope \}\)/);
  assert.match(move, /Cards\.findOneAsync\(\{ _id: targetChecklist\.cardId, boardId: target\.boardId, \.\.\.cardScope \}\)\) result\.itemId/);
  const history = read('server/methods/positionHistory.js');
  assert.equal((history.match(/\.\.\.\(scope \|\| \{\}\),/g) || []).length, 2);
  assert.match(history, /if \(!mayCopyFromBoard\(cardBoard, this\.userId, card\)\)/);
});
