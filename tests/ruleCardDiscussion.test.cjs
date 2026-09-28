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
    comments: [{ _id: 'comment', cardId: 'card', boardId: 'board', text: 'Ready for review', createdAt: new Date('2026-09-28'), webhookResponsePending: 'PRIVATE' }] };
  const read = name => async selector => { assert.equal(selector.cardId, 'card'); assert.equal(selector.deletedAt, null); return f[name]; };
  f.cache = { getCard: async () => f.card, getBoard: async () => f.board,
    getCardCommentReactions: async () => [],
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
test('checklist dates, reset schedule and public comment author accompany prose', async () => {
  const f = fixture(); Object.assign(f.checklists[0], { dueAt: new Date('2027-01-01'), finishedAt: new Date('2027-01-02'),
    resetInterval: 'weekly', lastResetAt: new Date('2027-01-03') });
  f.items[0].dueAt = new Date('2027-01-01');
  Object.assign(f.comments[0], { userId: 'author', modifiedAt: new Date('2027-01-04') });
  f.cache.getUser = async () => ({ profile: { fullname: 'Comment author' }, emails: ['SECRET'], services: { token: 'SECRET' } });
  const text = await prepare(f);
  for (const expected of ['  Due: 2027-01-01T00:00:00.000Z', '  Finished: 2027-01-02T00:00:00.000Z',
    'Reset interval: weekly', 'Last reset: 2027-01-03T00:00:00.000Z', '    Due: 2027-01-01T00:00:00.000Z',
    'Author: Comment author', 'Edited: 2027-01-04T00:00:00.000Z']) assert.ok(text.includes(expected), expected);
  assert.doesNotMatch(text, /PRIVATE|SECRET/);
  f.cache.getUser = async () => null; assert.match(await prepare(f), /Author: Unknown user/);
  f.cache.getUser = async () => { f.allowed = false; return { username: 'author' }; };
  await assert.rejects(prepare(f), /not-authorized/);
});

test('reactions are scoped to live comments, decoded as text and count distinct people without exposing IDs', async () => {
  const f = fixture();
  f.comments.push({ _id: 'deleted', cardId: 'card', boardId: 'board', deletedAt: new Date(), text: 'SECRET' });
  f.cache.getCardCommentReactions = async selector => {
    assert.deepEqual(selector, { cardId: 'card', boardId: 'board', cardCommentId: { $in: ['comment'] } });
    const row = { cardId: 'card', boardId: 'board', cardCommentId: 'comment', reactions: [
      { reactionCodepoint: '&#128077;', userIds: ['SECRET-ID', 'other', 'other'] },
      { reactionCodepoint: '&#10084;', userIds: ['other'] },
      { reactionCodepoint: '<script>SECRET</script>', userIds: ['other'] },
      { reactionCodepoint: '&#0000;', userIds: ['other'] },
      { reactionCodepoint: '&#55296;', userIds: ['other'] },
      { reactionCodepoint: '&#128578;', userIds: [] }, null,
    ] };
    return [row, row, { ...row, boardId: 'foreign' }, { ...row, cardId: 'foreign' },
      { ...row, cardCommentId: 'deleted' }];
  };
  const text = await prepare(f); assert.match(text, /Reactions: ❤ 1, 👍 2/);
  assert.equal(text.split('Reactions:').length, 2);
  assert.doesNotMatch(text, /SECRET|script|�|🙂/);
  f.cache.getCardCommentReactions = async () => { f.allowed = false; return []; };
  await assert.rejects(prepare(f), /not-authorized/);
});
test('converted subtask references resolve readable live titles and capture the full source chain', async () => {
  const f = fixture(), references = [];
  f.items[0].linkedCardId = 'linked';
  const cards = { card: f.card, linked: { _id: 'linked', boardId: 'board', type: 'cardType-linkedCard', linkedId: 'target', title: 'STALE' },
    target: { _id: 'target', boardId: 'other', title: 'Current subtask' } };
  const boards = { board: f.board, other: { members: [] } };
  f.cache.getCard = async id => cards[id]; f.cache.getBoard = async id => boards[id];
  f.canReadBoard = (_, board) => f.allowed && !!board;
  f.onRelatedSource = binding => references.push(binding);
  const text = await prepare(f);
  assert.match(text, /Converted subtask: Current subtask/); assert.doesNotMatch(text, /STALE/);
  assert.deepEqual(references[0].cards.map(row => row[0]), ['linked', 'target']);
  for (const change of [() => { delete cards.target; }, () => { cards.target.deletedAt = new Date(); },
    () => { boards.other.members = [{ userId: 'reader', isActive: true, isReadAssignedOnly: true }]; }]) {
    cards.target = { _id: 'target', boardId: 'other', title: 'SECRET' }; boards.other.members = [];
    change(); assert.doesNotMatch(await prepare(f), /Converted subtask|SECRET|STALE/);
  }
  cards.target = { _id: 'target', boardId: 'other', title: 'Current subtask' }; boards.other.members = [];
  f.onRelatedSource = () => { cards.linked.linkedId = 'elsewhere'; };
  await assert.rejects(prepare(f), /source-changed/);
});
