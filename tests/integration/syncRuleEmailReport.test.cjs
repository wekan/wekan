'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { randomUUID } = require('node:crypto');
const { syncRuleEmailReport: report } = require('../../server/lib/syncRuleEmailReport');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('MongoDB report paginates metadata deterministically, clamps pages and searches literally', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`rule_report_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const attempts = db.collection('attempts');
  await attempts.insertMany(Array.from({ length: 23 }, (_, i) => ({ _id: i.toString(16).padStart(64, '0'), version: 1,
    commandHash: 'a'.repeat(64), invocationId: 'b'.repeat(64), attemptId: randomUUID(), startedAt: new Date(1000),
    state: i < 12 ? 'sending' : 'sent', ...(i < 12 ? {} : { finishedAt: new Date(2000) }), mail: 'private@example.org' })));
  const first = await report(attempts, { search: '', page: 0, status: 'all' });
  const last = await report(attempts, { search: '', page: 999, status: 'all' });
  assert.equal(first.total, 23); assert.equal(first.rows.length, 10);
  assert.equal(last.page, 2); assert.equal(last.rows.length, 3);
  assert.equal(first.rows[0].commandId, '0'.repeat(64));
  assert.doesNotMatch(JSON.stringify(first), /private@example/);
  assert.equal((await report(attempts, { search: '', page: 0, status: 'unconfirmed' })).total, 12);
  assert.equal((await report(attempts, { search: '', page: 0, status: 'sent' })).total, 11);
  assert.equal((await report(attempts, { search: '.*', page: 0, status: 'all' })).total, 0);
  assert.equal((await report(attempts, { search: first.rows[0].attemptId, page: 0, status: 'all' })).total, 1);
});
