'use strict';
// Rule email retention (maintainer decision of 2026-09-30): a finished command
// is compacted after 90 days to a permanent minimal id, in place, and only once
// its rule invocation has a receipt, so no replay can need the mail again.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const R = require('../../server/lib/syncRuleEmailRetention');
const { ruleEmailRecoveryDetail } = require('../../server/lib/syncRuleEmailResolution');
const { listLegacyRuleEmailCommands } = require('../../server/lib/syncRuleEmailLegacy');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
const DAY = 86400000;
const h = c => c.repeat(64);

test('old finished commands with a receipt are compacted in place; nothing else is touched', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`rule_retention_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const c = { attempts: db.collection('attempts'), commands: db.collection('commands'), outcomes: db.collection('outcomes'),
    receipts: db.collection('receipts'), plans: db.collection('plans'), resolutions: db.collection('resolutions') };
  const now = new Date(200 * DAY), old = new Date(now - 100 * DAY), recent = new Date(now - 10 * DAY);
  const inv = id => h({ a: 'b', 1: '4', 2: '5', 3: '6' }[id[0]]);
  const seed = async (id, { state = 'sent', finishedAt = old, receipt = true, mail = true } = {}) => {
    await c.attempts.insertOne({ _id: id, version: 1, commandHash: h('c'), invocationId: inv(id),
      attemptId: '12345678-1234-1234-1234-123456789abc', state, startedAt: new Date(finishedAt - 1000),
      ...(state === 'sending' ? {} : { finishedAt }) });
    await c.commands.insertOne({ _id: id, version: 1, kind: 'rule-email', invocationId: inv(id),
      planId: 'plan', effectId: h('e'), checksum: h('c'), boardId: 'b', cardId: 'c',
      ...(mail ? { mail: { to: 'secret@example.org', from: 'w@example.org', subject: 'S', text: 'secret body' } } : {}) });
    await c.outcomes.insertOne({ _id: id, attemptId: 'x', accepted: ['secret@example.org'] });
    if (receipt) await c.receipts.insertOne({ _id: inv(id), version: 1, kind: 'action', planId: 'plan' });
  };
  await seed(h('a'));                                      // old, sent, receipt: compact
  await seed(h('1'), { receipt: false });                  // old, no receipt yet: wait
  await seed(h('2'), { finishedAt: recent });              // too recent: keep
  await seed(h('3'), { state: 'sending', finishedAt: old }); // unconfirmed: never
  const retention = R.createSyncRuleEmailRetention({ ...c, now: () => now });
  const first = await retention.sweep();
  assert.equal(first.compacted, 1);
  const compact = await c.commands.findOne({ _id: h('a') });
  assert.deepEqual(compact, { _id: h('a'), checksum: h('c'), invocationId: h('b'), planId: 'plan', effectId: h('e'), compactReceiptVersion: 1 });
  assert.ok(!JSON.stringify(compact).includes('secret'), 'the mail and addresses are gone');
  assert.equal(await c.outcomes.findOne({ _id: h('a') }), null, 'the recipient outcome row is removed');
  assert.ok(await c.attempts.findOne({ _id: h('a') }), 'the attempt (the receipt a retry reads) stays');
  for (const id of [h('1'), h('2'), h('3')]) {
    assert.ok((await c.commands.findOne({ _id: id })).mail, `${id[0]} keeps its mail`);
    assert.ok(await c.outcomes.findOne({ _id: id }));
  }
  // Idempotent: a second pass changes nothing more.
  const retention2 = R.createSyncRuleEmailRetention({ ...c, now: () => now });
  assert.equal((await retention2.sweep()).compacted, 0);
  // Readers accept the compact form.
  const detail = await ruleEmailRecoveryDetail({ ...c, commandId: h('a'), MailComposer: class { compile() { throw new Error('mail read'); } }, now: () => now });
  assert.deepEqual([detail.status, detail.recipients, detail.compacted, detail.resolvable], ['sent', [], true, false]);
  const legacy = await listLegacyRuleEmailCommands(c);
  assert.ok(!legacy.rows.some(row => row.commandId === h('a')), 'a compacted command is not a legacy one to review');
});

test('a changed or malformed command is never compacted (negative)', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`rule_retention_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const c = { attempts: db.collection('attempts'), commands: db.collection('commands'), outcomes: db.collection('outcomes'),
    receipts: db.collection('receipts') };
  const now = new Date(200 * DAY), old = new Date(now - 100 * DAY);
  await c.attempts.insertOne({ _id: h('a'), version: 1, commandHash: h('c'), invocationId: h('b'), attemptId: 'x',
    state: 'dropped', startedAt: old, finishedAt: old });
  // The command's checksum no longer matches the attempt: it is not the command that finished.
  await c.commands.insertOne({ _id: h('a'), invocationId: h('b'), planId: 'plan', effectId: h('e'), checksum: h('9'), mail: { to: 'x' } });
  await c.receipts.insertOne({ _id: h('b'), version: 1, kind: 'action', planId: 'plan' });
  const result = await R.createSyncRuleEmailRetention({ ...c, now: () => now }).sweep();
  assert.deepEqual([result.compacted, result.skipped], [0, 1]);
  assert.ok((await c.commands.findOne({ _id: h('a') })).mail);
  assert.throws(() => R.syncReceiptPolicy({ SYNC_RECEIPT_METADATA_DAYS: '0' }), /from 1 to 3650/);
  assert.deepEqual(R.syncReceiptPolicy({}), { days: 90, intervalMs: 3600000 }, 'the decided 90 days is the default');
});
