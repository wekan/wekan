'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const { ensureRuleEmailCommand } = require('../server/lib/syncRuleEmailCommand');
const { dispatchRuleEmail: dispatch } = require('../server/lib/syncRuleEmailDispatch');
async function fixture() {
  const f = { activity: { _id: 'a', boardId: 'b', cardId: 'c', userId: 'u' }, effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f, selectRules: async () => [{ _id: 'r', boardId: 'b', actionId: 'a', triggerId: 't' }], readAction: async () => ({ _id: 'a', actionType: 'sendEmail' }) });
  let command;
  f.command = await ensureRuleEmailCommand({ ...f, commands: { findOne: async () => command, insertOne: async row => { command = row; } },
    prepare: async () => ({ to: 'external@example.org', from: 'sender@example.org', subject: 'S', text: 'T' }) });
  f.rows = new Map(); f.calls = 0;
  f.attempts = { findOne: async ({ _id }) => structuredClone(f.rows.get(_id)),
    insertOne: async row => { if (f.rows.has(row._id)) throw new Error('duplicate'); f.rows.set(row._id, structuredClone(row)); },
    replaceOne: async (before, after) => { assert.deepEqual(f.rows.get(before._id), before); f.rows.set(before._id, structuredClone(after)); } };
  f.MailComposer = class { compile() { return { getEnvelope: () => ({ to: ['external@example.org'] }) }; } };
  f.send = async () => { f.calls++; return { accepted: ['external@example.org'] }; };
  return f;
}
test('accepted mail has a durable receipt and replay never resends', async () => {
  const f = await fixture(); assert.equal(await dispatch(f), f.command.invocationId);
  assert.equal(await dispatch(f), f.command.invocationId); assert.equal(f.calls, 1);
});
test('transport failures and false acceptance retain uncertain attempts without resend', async () => {
  for (const response of [undefined, { accepted: [] }, { accepted: ['other@example.org'] }, new Error('SMTP secret')]) {
    const f = await fixture(); f.send = async () => { f.calls++; if (response instanceof Error) throw response; return response; };
    await assert.rejects(dispatch(f)); await assert.rejects(dispatch(f), /delivery-uncertain/);
    assert.equal(f.calls, 1); assert.equal(f.rows.get(f.command._id).state, 'sending');
    assert.doesNotMatch(JSON.stringify([...f.rows.values()]), /SMTP secret/);
  }
});
test('lost database replies reconcile by exact readback before and after sending', async () => {
  const f = await fixture(), insert = f.attempts.insertOne, replace = f.attempts.replaceOne;
  f.attempts.insertOne = async row => { await insert(row); throw new Error('lost insert'); };
  f.attempts.replaceOne = async (...args) => { await replace(...args); throw new Error('lost replace'); };
  assert.equal(await dispatch(f), f.command.invocationId); assert.equal(f.calls, 1);
});
test('false storage acknowledgement cannot cause a send or a completed receipt', async () => {
  const f = await fixture(); f.attempts.insertOne = async () => {};
  await assert.rejects(dispatch(f), /attempt-unconfirmed/); assert.equal(f.calls, 0);
  const g = await fixture(); g.attempts.replaceOne = async () => {};
  await assert.rejects(dispatch(g), /completion-unconfirmed/);
  await assert.rejects(dispatch(g), /delivery-uncertain/); assert.equal(g.calls, 1);
});
test('ownership loss after SMTP leaves uncertainty and changed content fails before transport', async () => {
  const f = await fixture(); let current = true;
  f.assertCurrent = async () => { if (!current) throw new Error('lease lost'); };
  f.send = async () => { current = false; return { accepted: ['external@example.org'] }; };
  await assert.rejects(dispatch(f), /lease lost/); assert.equal(f.rows.get(f.command._id).state, 'sending');
  const g = await fixture(); g.command.mail.to = 'changed@example.org';
  await assert.rejects(dispatch(g), /command-invalid/); assert.equal(g.calls, 0);
});
test('concurrent attempts send once and malformed stored evidence never authorizes a send', async () => {
  const f = await fixture(); const results = await Promise.allSettled([dispatch(f), dispatch(f)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1); assert.equal(f.calls, 1);
  f.rows.get(f.command._id).commandHash = 'changed';
  await assert.rejects(dispatch(f), /attempt-invalid/); assert.equal(f.calls, 1);
});
