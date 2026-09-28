'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { prepareRuleCardAttachments } = require('../server/lib/ruleCardAttachments');
function fixture() {
  const f = { activity: { cardId: 'card', boardId: 'board', userId: 'reader' },
    board: { permission: 'private', members: [] }, card: { _id: 'card', boardId: 'board', assignees: [] },
    files: [{ _id: 'file', name: 'report.txt', type: 'text/plain', meta: { cardId: 'card' } }], allowed: true, reads: 0 };
  f.cache = { getCard: async () => f.card, getBoard: async () => f.board, getAttachments: async selector => {
    assert.equal(selector['meta.cardId'], 'card'); assert.ok(Object.hasOwn(selector, 'deletedAt'));
    return structuredClone(f.files);
  } };
  f.canReadBoard = () => f.allowed;
  f.openStream = () => { f.reads++; return Readable.from([Buffer.from('content')]); };
  return f;
}
test('authorized live card files become byte snapshots; empty cards have no attachments', async () => {
  const f = fixture(), files = await prepareRuleCardAttachments(f);
  assert.equal(Buffer.from(files[0].content, 'base64').toString(), 'content');
  f.files = []; assert.deepEqual(await prepareRuleCardAttachments(f), []);
});
test('unauthorized, foreign and unassigned cards are refused before opening files', async () => {
  for (const change of [f => { f.allowed = false; }, f => { f.card.boardId = 'foreign'; }, f => { f.activity.userId = null; },
    f => { f.card = null; }, f => { f.board.members = [{ userId: 'reader', isActive: true, isReadAssignedOnly: true }]; }]) {
    const f = fixture(); change(f); await assert.rejects(prepareRuleCardAttachments(f), /not-authorized/); assert.equal(f.reads, 0);
  }
});
test('access revocation and file changes during reads discard the entire message attachments', async () => {
  for (const mutate of [f => { f.allowed = false; }, f => { f.files = []; }, f => { f.files[0].name = 'changed'; }]) {
    const f = fixture(); f.openStream = () => { mutate(f); return Readable.from([Buffer.from('data')]); };
    await assert.rejects(prepareRuleCardAttachments(f), /not-authorized|changed/);
  }
});
