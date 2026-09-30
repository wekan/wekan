'use strict';
// Rule archive retention (maintainer decision of 2026-09-30): a finished
// archive command is compacted after 90 days and its effects removed; an
// unfinished or changed one is untouched.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const R = require('../../server/lib/syncRuleArchiveRetention');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
const DAY = 86400000;
const h = c => c.repeat(64);

test('finished commands are compacted with their effects removed; nothing else is touched', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`rule_archive_retention_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const c = { commands: db.collection('commands'), effects: db.collection('effects'), completions: db.collection('completions') };
  const receipts = db.collection('receipts');
  const now = new Date(400 * DAY);
  const seed = async (ch, completedAt) => {
    const command = { _id: h(ch), version: 1, invocationId: h('9'), planId: 'plan', planHash: h('8'), actorId: 'a', boardId: 'b',
      cardId: 'c', archived: true, createdAt: new Date(1), cards: [{ _id: 'c', title: 'Secret title' }], checksum: h('7') };
    await c.commands.insertOne(command);
    await c.effects.insertOne({ _id: command._id, rows: [{ history: 'secret history' }] });
    await receipts.insertOne({ _id: command._id, kind: 'rule-archive', commandId: command._id, checksum: command.checksum, version: 1 });
    if (completedAt) await R.recordArchiveCompletion({ completions: c.completions, command, now: () => completedAt });
    return command;
  };
  const old = await seed('a', new Date(now - 100 * DAY));
  const recent = await seed('b', new Date(now - 10 * DAY));
  const open = await seed('c', null);
  assert.equal((await R.createSyncRuleArchiveRetention({ ...c, now: () => now }).sweep()).compacted, 1);
  const compact = await c.commands.findOne({ _id: old._id });
  assert.ok(R.isCompactArchiveCommand(compact));
  assert.ok(!JSON.stringify(compact).includes('Secret'));
  assert.equal(await c.effects.countDocuments({ _id: old._id }), 0);
  for (const kept of [recent, open]) {
    assert.deepEqual(await c.commands.findOne({ _id: kept._id }), kept);
    assert.equal(await c.effects.countDocuments({ _id: kept._id }), 1);
  }
  assert.equal(await R.readCompactedArchive({ row: compact, completions: c.completions, receipts }), old.invocationId);
  await receipts.deleteOne({ _id: old._id });
  await assert.rejects(R.readCompactedArchive({ row: compact, completions: c.completions, receipts }), /command-invalid/,
    'no final receipt, no completed invocation (negative)');
  await assert.rejects(R.recordArchiveCompletion({ completions: c.completions, command: { ...old, checksum: h('6') } }), /completion-conflict/);
});
