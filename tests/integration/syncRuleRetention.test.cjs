'use strict';
// Sync rule plan retention (maintainer decision of 2026-09-30): a finished
// plan is compacted after 90 days, a replay returns as done, and the legacy
// email review treats the compact form as finished work.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const R = require('../../server/lib/syncRuleRetention');
const { ensureRulePlan, planId } = require('../../server/lib/syncRulePlan');
const { listLegacyRuleEmailCommands } = require('../../server/lib/syncRuleEmailLegacy');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
const DAY = 86400000;

test('a finished rule plan is compacted and replays as done; an unfinished one is untouched', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`sync_rule_retention_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const c = { plans: db.collection('plans'), receipts: db.collection('completions') };
  const now = new Date(400 * DAY), effectId = 'e'.repeat(64);
  const seed = async (activityId, completedAt) => {
    const activity = { _id: activityId, boardId: 'board', cardId: 'card', userId: 'actor', activityType: 'createCard' };
    const plan = { version: 1, activityId, activityHash: sha256(canonical(activity)), boardId: 'board', cardId: 'card',
      actorId: 'actor', effectId, actions: [] };
    const row = { _id: planId(effectId, activityId), plan, checksum: sha256(canonical(plan)) };
    await c.plans.insertOne(row);
    if (completedAt) await R.recordRuleCompletion({ receipts: c.receipts, id: row._id, activityHash: plan.activityHash,
      checksum: row.checksum, now: () => completedAt });
    return { activity, row };
  };
  const done = await seed('done', new Date(now - 100 * DAY));
  const open = await seed('open', null);
  assert.equal((await R.createSyncRuleRetention({ ...c, now: () => now }).sweep()).compacted, 1);
  assert.ok(R.isCompactRulePlan(await c.plans.findOne({ _id: done.row._id })));
  assert.deepEqual(await c.plans.findOne({ _id: open.row._id }), open.row);
  assert.deepEqual(await ensureRulePlan({ ...c, activity: done.activity, effectId, assertCurrent: async () => {},
    build: () => assert.fail('never rebuilt') }), { compacted: true, id: done.row._id });
  await assert.rejects(ensureRulePlan({ plans: c.plans, activity: done.activity, effectId, assertCurrent: async () => {},
    build: () => assert.fail() }), /sync-rule-plan-invalid|rule-plan/, 'no receipts adapter (negative)');
  // A command pointing at the compacted plan is not offered for legacy review as rebindable.
  const commands = db.collection('commands'), attempts = db.collection('attempts');
  await commands.insertOne({ _id: 'f'.repeat(64), planId: done.row._id, invocationId: 'a'.repeat(64), boardId: 'board', cardId: 'card',
    checksum: 'c'.repeat(64), mail: { to: 'x@example.org', subject: 'S' } });
  const legacy = await listLegacyRuleEmailCommands({ commands, plans: c.plans, attempts });
  assert.deepEqual(legacy.rows.map(row => row.rebindable), [false]);
});
