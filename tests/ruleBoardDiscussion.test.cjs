'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRuleBoardDiscussion: prepare } = require('../server/lib/ruleBoardDiscussion');
const { resolveRuleEmailSource } = require('../server/lib/ruleEmailSource');
function fixture() {
  const f = { activity: { cardId: 'wrapper', boardId: 'local', userId: 'actor' }, allowed: true };
  f.boards = { local: { _id: 'local' }, target: { _id: 'target', title: 'Target',
    members: [{ userId: 'actor', isActive: true, isReadAssignedOnly: true }] } };
  f.cards = { wrapper: { _id: 'wrapper', boardId: 'local', type: 'cardType-linkedBoard', linkedId: 'target' },
    visible: { _id: 'visible', boardId: 'target', title: 'Readable card', assignees: ['actor'] },
    private: { _id: 'private', boardId: 'target', title: 'SECRET TITLE' },
    deleted: { _id: 'deleted', boardId: 'target', deletedAt: new Date() },
    foreign: { _id: 'foreign', boardId: 'elsewhere', title: 'SECRET FOREIGN' } };
  f.comments = ['visible', 'private', 'deleted', 'foreign', 'missing'].map(cardId => ({
    _id: `comment-${cardId}`, cardId, boardId: 'target', text: cardId === 'visible' ? 'Public comment' : 'SECRET COMMENT',
    userId: 'author', createdAt: new Date('2027-01-01'), webhookResponsePending: 'SECRET WEBHOOK',
  }));
  f.cache = { getCard: async id => f.cards[id] && { ...f.cards[id] },
    getBoard: async id => f.boards[id],
    getCardComments: async (selector, options) => {
      assert.equal(selector.deletedAt, null);
      if (!selector.cardId) { assert.equal(options.fields.cardId, 1); assert.equal(options.limit, 1001); }
      return f.comments.filter(row => !selector.cardId || row.cardId === selector.cardId);
    },
    getCardCommentReactions: async () => [{ cardId: 'visible', boardId: 'target', cardCommentId: 'comment-visible',
      reactions: [{ reactionCodepoint: '&#128077;', userIds: ['SECRET REACTOR'] }] }],
    getUser: async () => ({ username: 'Public author', emails: ['SECRET EMAIL'] }),
    getChecklists: async () => { throw new Error('board comments must not export every checklist'); },
    getChecklistItems: async () => { throw new Error('board comments must not export every checklist item'); },
  };
  f.canReadBoard = (_, board) => !!board && (board._id !== 'target' || f.allowed);
  return f;
}
test('board discussion includes only authorized card comments and persists their source evidence', async () => {
  const f = fixture(); const root = await resolveRuleEmailSource(f);
  const text = await prepare({ ...f, onRelatedSource: root.addRelatedSource });
  for (const part of ['Linked board discussion:', 'Card: Readable card', 'Public comment', 'Author: Public author', 'Reactions: 👍 1']) assert.ok(text.includes(part), part);
  assert.doesNotMatch(text, /SECRET|Checklists:/);
  assert.equal(root.binding.relatedSources.length, 1);
  assert.equal(root.binding.relatedSources[0].cards[0][0], 'visible');
  f.cards.visible.assignees = [];
  await assert.rejects(root.assertCurrent(), /not-authorized/);
});
test('permission loss during author reads rejects the complete board discussion', async () => {
  const f = fixture(); f.cache.getUser = async () => { f.allowed = false; return { username: 'Public author' }; };
  await assert.rejects(prepare(f), /not-authorized/);
});
test('retargeting the board wrapper during comment capture rejects the snapshot', async () => {
  const f = fixture(); f.boards.other = { _id: 'other' };
  f.cache.getUser = async () => { f.cards.wrapper.linkedId = 'other'; return { username: 'Public author' }; };
  await assert.rejects(prepare(f), /source-changed/);
});
test('oversized board scans and aggregate comment bodies fail without truncation', async () => {
  const f = fixture(); f.comments = Array.from({ length: 1001 }, () => f.comments[0]);
  await assert.rejects(prepare(f), /board-discussion-too-large/);
  const g = fixture(); g.comments = [g.comments[0], { ...g.comments[0], _id: 'second', cardId: 'second' }];
  g.cards.second = { ...g.cards.visible, _id: 'second' };
  for (const row of g.comments) row.text = 'x'.repeat(400 * 1024);
  await assert.rejects(prepare(g), /board-discussion-too-large/);
});
test('ordinary cards do not scan a board or disclose unrelated comments', async () => {
  const f = fixture(); f.cards.wrapper.type = 'cardType-card';
  f.cache.getCardComments = async () => { throw new Error('unexpected board scan'); };
  assert.equal(await prepare(f), '');
});
