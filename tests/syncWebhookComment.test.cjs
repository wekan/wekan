'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareWebhookCommentPlan, validateWebhookCommentPlan } = require('../server/lib/syncWebhookComment');
const context = { activity: { _id: 'event', boardId: 'board', cardId: 'card', userId: 'actor' },
  target: { integrationId: 'hook', integrationBoardId: 'board', request: { is2way: true } },
  data: { boardId: 'board', cardId: 'card', commentId: 'comment', comment: 'Reply' } };
const comment = { _id: 'comment', boardId: 'board', cardId: 'card', text: 'Original', userId: 'author', createdAt: new Date(0), modifiedAt: new Date(1) };
const build = options => prepareWebhookCommentPlan({ context, comment, modifiedAt: new Date(2), ...options });
test('captures detached original text and fixed modification time, without private metadata', () => {
  const source = { ...comment, webhookResponseRevision: 'private' }, plan = build({ comment: source });
  source.text = 'Changed'; assert.equal(plan.change.before.text, 'Original');
  assert.equal(Object.hasOwn(plan.change.before, 'webhookResponseRevision'), false);
  assert.equal(plan.change.modifiedAt.getTime(), 2); assert.equal(validateWebhookCommentPlan(plan, context), true);
});
test('missing, malformed, cross-board or wrong-card replies are explicit no-action snapshots', () => {
  for (const data of [null, [], {}, { ...context.data, boardId: 'other' }, { ...context.data, cardId: 'other' },
    { ...context.data, commentId: { $ne: null } }, { ...context.data, comment: 123 }, { ...context.data, comment: '' }]) {
    assert.equal(build({ context: { ...context, data } }).change, null);
  }
  assert.equal(build({ comment: null }).change, null);
  assert.equal(build({ context: { ...context, target: { ...context.target, integrationBoardId: '_global' } } }).change, null);
});
test('changed replies, invalid dates, mismatched identity and oversized changes cannot execute', () => {
  const plan = build();
  for (const mutate of [p => { p.change.text = 'Substituted'; }, p => { p.change.before.cardId = 'foreign'; },
    p => { p.change.before.createdAt = 'not-date'; }, p => { p.change.modifiedAt = new Date(NaN); },
    p => { p.deliveryId = 'wrong'; }, p => { p.change.before.extra = true; }]) {
    const bad = structuredClone(plan); mutate(bad); assert.throws(() => validateWebhookCommentPlan(bad, context), /plan-invalid/);
  }
  assert.throws(() => validateWebhookCommentPlan(plan, { ...context, data: { ...context.data, comment: 'Different' } }), /plan-invalid/);
  assert.throws(() => build({ comment: { ...comment, text: 'x'.repeat(5 * 1024 * 1024) } }), /plan-invalid/);
});
