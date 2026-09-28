'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { canWriteWebhookCard, isCurrentWebhookTarget } = require('../server/lib/syncWebhookAccess');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');
test('replay requires a current active writer with access to the actual card', () => {
  const user = { _id: 'actor' }, card = { _id: 'card', boardId: 'board', assignees: ['actor'] };
  const board = { _id: 'board', members: [{ userId: 'actor', isActive: true }] };
  assert.equal(canWriteWebhookCard({ user, board, card }), true);
  for (const member of [{ isActive: false }, { isReadOnly: true }, { isCommentOnly: true }, { isWorker: true }]) {
    assert.equal(canWriteWebhookCard({ user, card, board: { ...board, members: [{ ...board.members[0], ...member }] } }), false);
  }
  assert.equal(canWriteWebhookCard({ user: { ...user, loginDisabled: true }, board, card }), false);
  assert.equal(canWriteWebhookCard({ user, board, card: { ...card, boardId: 'other' } }), false);
  const restricted = { ...board, members: [{ ...board.members[0], isNormalAssignedOnly: true }] };
  assert.equal(canWriteWebhookCard({ user, board: restricted, card }), true);
  for (const assignees of [[], 'actor', undefined]) assert.equal(canWriteWebhookCard({ user, board: restricted, card: { ...card, assignees } }), false);
});
test('integration replay binds identity, configuration and board/global scope', () => {
  for (const boardId of ['board', '_global']) {
    const integration = { _id: 'hook', boardId, enabled: true, url: 'https://example.test', token: 'original' };
    const target = { integrationId: 'hook', integrationBoardId: boardId, integrationHash: sha256(canonical(integration)) };
    const input = { integration, target, activity: { boardId: 'board' } };
    assert.equal(isCurrentWebhookTarget(input), true);
    for (const change of [{ _id: 'recreated' }, { enabled: false }, { url: 'https://changed.test' }, { token: 'rotated' }, { boardId: 'foreign' }]) {
      assert.equal(isCurrentWebhookTarget({ ...input, integration: { ...integration, ...change } }), false);
    }
    assert.equal(isCurrentWebhookTarget({ ...input, integration: null }), false);
  }
});
