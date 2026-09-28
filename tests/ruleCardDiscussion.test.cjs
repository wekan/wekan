'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRuleCardDiscussion: prepare } = require('../server/lib/ruleCardDiscussion');
function fixture() {
  const f = { activity: { cardId: 'card', boardId: 'board', userId: 'reader' },
    card: { _id: 'card', boardId: 'board', assignees: [] }, board: { members: [] }, allowed: true,
    checklists: [{ _id: 'checklist', cardId: 'card', title: 'Release steps' }],
    items: [{ cardId: 'card', checklistId: 'checklist', title: 'Test', isFinished: true },
      { cardId: 'card', checklistId: 'checklist', title: 'Ship', isFinished: false },
      { cardId: 'foreign', checklistId: 'checklist', title: 'Private item' }],
    comments: [{ cardId: 'card', boardId: 'board', text: 'Ready for review', createdAt: new Date('2026-09-28'), webhookResponsePending: 'PRIVATE' }] };
  const read = name => async selector => { assert.equal(selector.cardId, 'card'); assert.equal(selector.deletedAt, null); return f[name]; };
  f.cache = { getCard: async () => f.card, getBoard: async () => f.board,
    getChecklists: read('checklists'), getChecklistItems: read('items'), getCardComments: read('comments') };
  f.canReadBoard = () => f.allowed;
  return f;
}
test('renders checklist completion and public comment text without private fields or foreign rows', async () => {
  const f = fixture();
  f.comments.push({ cardId: 'card', boardId: 'foreign', text: 'Private comment' }, { cardId: 'card', boardId: 'board', deletedAt: new Date(), text: 'Deleted' });
  assert.equal(await prepare(f), 'Checklists:\nRelease steps\n  [x] Test\n  [ ] Ship\n\nComments:\n[2026-09-28T00:00:00.000Z]\nReady for review');
});
test('access, assignment and card movement are checked again after child reads', async () => {
  for (const change of [f => { f.allowed = false; }, f => { f.card.boardId = 'foreign'; },
    f => { f.card.deletedAt = new Date(); },
    f => { f.board.members = [{ userId: 'reader', isActive: true, isReadAssignedOnly: true }]; }]) {
    const f = fixture(); f.cache.getCardComments = async () => { change(f); return f.comments; };
    await assert.rejects(prepare(f), /not-authorized/);
  }
});
test('empty cards add no section; excessive content fails instead of silently truncating', async () => {
  const f = fixture(); f.checklists = []; f.items = []; f.comments = [];
  assert.equal(await prepare(f), '');
  f.comments = [{ cardId: 'card', boardId: 'board', text: 'x'.repeat(768 * 1024) }];
  await assert.rejects(prepare(f), /too-large/);
});
