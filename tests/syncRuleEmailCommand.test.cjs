'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const { ensureRuleEmailCommand: ensure } = require('../server/lib/syncRuleEmailCommand');
async function fixture() {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', actionType: 'sendEmail' }) });
  f.mail = { to: 'outside@example.org', from: 'wekan@example.org', subject: 'Captured subject', text: 'Captured body' };
  f.prepare = async () => f.mail;
  f.rows = new Map();
  f.commands = { findOne: async ({ _id }) => structuredClone(f.rows.get(_id)),
    insertOne: async row => { if (f.rows.has(row._id)) throw new Error('duplicate'); f.rows.set(row._id, structuredClone(row)); } };
  return f;
}
test('first prepared recipient and content survive changed live settings and returned-object mutation', async () => {
  const f = await fixture(), first = await ensure(f), expected = structuredClone(first);
  f.mail.to = 'changed@example.org'; first.mail.text = 'changed';
  assert.deepEqual(await ensure({ ...f, prepare: () => assert.fail('must not render again') }), expected);
  assert.equal(f.rows.size, 1);
});
test('the full saved plan, activity and invocation position bind a command', async () => {
  const f = await fixture(); await ensure(f);
  for (const index of [-1, 1, 0.5]) await assert.rejects(ensure({ ...f, index }), /command-invalid/);
  const changed = structuredClone(f.plan); changed.actions[0].action.emailTo = 'different';
  await assert.rejects(ensure({ ...f, plan: changed }), /command-invalid/);
  await assert.rejects(ensure({ ...f, activity: { ...f.activity, userId: 'other' } }), /plan-invalid/);
  changed.actions[0].action.actionType = 'archive';
  await assert.rejects(ensure({ ...f, plan: changed }), /command-invalid/);
});
test('malformed or oversized transport fields cannot be stored as commands', async () => {
  for (const patch of [{ to: '' }, { from: 'sender\nBcc: secret' }, { subject: 'line\rbreak' },
    { replyTo: 42 }, { text: {} }, { html: 'x'.repeat(1024 * 1024) }, { attachments: [] }, { bcc: 'hidden@example.org' }]) {
    const f = await fixture();
    await assert.rejects(ensure({ ...f, prepare: async () => ({ ...f.mail, ...patch }) }), /command-invalid/);
    assert.equal(f.rows.size, 0);
  }
});
test('uncertain insertion is read back, false acknowledgement and corruption are refused', async () => {
  const f = await fixture(), insert = f.commands.insertOne;
  f.commands.insertOne = async () => ({ acknowledged: true });
  await assert.rejects(ensure(f), /command-unconfirmed/);
  f.commands.insertOne = async row => { await insert(row); throw new Error('lost reply'); };
  const saved = await ensure(f);
  f.rows.get(saved._id).mail.to = 'tampered@example.org';
  await assert.rejects(ensure(f), /command-invalid/);
});
test('preparation loses ownership before storage and cannot mutate the captured identity', async () => {
  const f = await fixture(); let current = true;
  f.assertCurrent = async () => { if (!current) throw new Error('lease lost'); };
  f.prepare = async ({ invocation, activity }) => {
    invocation.id = 'changed'; activity.cardId = 'other'; current = false; return f.mail;
  };
  await assert.rejects(ensure(f), /lease lost/); assert.equal(f.rows.size, 0);
  current = true; f.prepare = async ({ invocation, activity }) => {
    invocation.id = 'changed'; activity.cardId = 'other'; return f.mail;
  };
  assert.equal((await ensure(f)).cardId, 'card');
});
test('attachment bytes are immutable command content and cannot become file or URL references', async () => {
  const f = await fixture();
  const attachment = { filename: 'report.bin', contentType: 'application/octet-stream', encoding: 'base64', content: 'AP8=' };
  f.mail.attachments = [attachment];
  const first = await ensure(f), expected = structuredClone(first);
  attachment.content = 'YQ=='; first.mail.attachments[0].filename = 'changed';
  assert.deepEqual(await ensure({ ...f, prepare: () => assert.fail('must reuse saved bytes') }), expected);
  f.rows.get(expected._id).mail.attachments[0].content = 'Yg==';
  await assert.rejects(ensure(f), /command-invalid/);
  for (const patch of [{ path: '/private/file' }, { href: 'https://example.org/file' }, { encoding: 'utf8' }, { content: '%' }]) {
    const invalid = await fixture();
    invalid.mail.attachments = [{ ...attachment, ...patch }];
    await assert.rejects(ensure(invalid), /command-invalid/); assert.equal(invalid.rows.size, 0);
  }
});

test('version two binds immutable source evidence to the mail checksum and never recaptures it', async () => {
  const f = await fixture();
  const sourceBinding = { version: 1, cards: [['card', 'board', 'cardType-linkedCard', 'source'],
    ['source', 'foreign', null, null]], linkedBoardId: null };
  f.prepare = async () => ({ mail: f.mail, sourceBinding });
  const saved = await ensure(f), expected = structuredClone(saved);
  assert.equal(saved.version, 2);
  sourceBinding.cards[1][1] = 'changed'; saved.sourceBinding.cards[0][2] = 'changed';
  assert.deepEqual(await ensure({ ...f, prepare: () => assert.fail('must not recapture') }), expected);
  f.rows.get(saved._id).sourceBinding.cards[1][1] = 'tampered';
  await assert.rejects(ensure(f), /command-invalid/);
  f.rows.clear(); sourceBinding.cards[0][0] = 'wrong-root';
  await assert.rejects(ensure(f), /command-invalid/); assert.equal(f.rows.size, 0);
});
