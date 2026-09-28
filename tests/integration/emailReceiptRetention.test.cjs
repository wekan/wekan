'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { createEmailReceiptMaintenance } = require('../../server/lib/emailReceiptRetention');
const { createEmailOutbox, idFor } = require('../../server/lib/emailOutbox');
const { controlEmailOutbox } = require('../../server/lib/emailOutboxControl');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
async function fixture(t, extra = {}) {
  const client = await new MongoClient(uri).connect(), db = client.db(`email_retention_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = { jobs: db.collection('jobs'), commands: db.collection('commands'), controls: db.collection('controls'), leases: db.collection('leases'),
    now: () => new Date('2026-09-28T12:00:00Z'), old: new Date('2026-01-01T00:00:00Z') };
  f.run = createEmailReceiptMaintenance({ ...f, ...extra });
  f.job = (eventId, overrides = {}) => ({ _id: idFor('user', eventId), userId: 'user', eventId, state: 'sent',
    finishedAt: f.old, createdAt: f.old, boardId: 'old-board', html: 'legacy payload', attempts: 2, ...overrides });
  return f;
}
test('aged terminal metadata is replaced in place while live work and recent receipts remain intact', { skip: !uri }, async t => {
  const f = await fixture(t);
  const rows = [f.job('sent'), f.job('cancelled', { state: 'cancelled' }),
    f.job('recent', { finishedAt: f.now() }), f.job('pending', { state: 'pending' }),
    f.job('failed', { state: 'failed' }), f.job('undated', { finishedAt: null })];
  await f.jobs.insertMany(rows);
  await f.controls.insertOne({ _id: 'user', paused: true, generation: 8 });
  const result = await f.run();
  assert.equal(result.jobs.confirmed, 2);
  for (const row of rows.slice(0, 2)) assert.deepEqual(await f.jobs.findOne({ _id: row._id }),
    { _id: row._id, state: row.state, compactReceiptVersion: 1 });
  for (const row of rows.slice(2)) assert.deepEqual(await f.jobs.findOne({ _id: row._id }), row);
  assert.deepEqual(await f.controls.findOne({ _id: 'user' }), { _id: 'user', paused: true, generation: 8 });
  assert.equal((await f.run()).jobs.confirmed, 0);
});
test('old event and command replays remain harmless after compaction, including different-actor rejection', { skip: !uri }, async t => {
  const f = await fixture(t);
  const queue = createEmailOutbox({ ...f, getUser: async () => assert.fail('terminal receipts cannot send'), send: async () => assert.fail('cannot send') });
  const requestId = 'old-cancel-abcdefghijklmnop';
  const control = { ...f, userId: 'user', actorId: 'admin', action: 'cancel', requestId, assertAdmin: async () => {}, now: () => f.old };
  await f.jobs.insertOne(f.job('original', { state: 'pending' }));
  await controlEmailOutbox(control);
  await f.run();
  const command = await f.commands.findOne({ _id: requestId });
  assert.deepEqual(Object.keys(command).sort(), ['_id', 'compactReceiptVersion', 'identityHash', 'status']);
  const input = eventId => ({ userId: 'user', eventId, subject: 'new subject', html: 'new body', language: 'en' });
  assert.equal(await queue.enqueue(input('original')), idFor('user', 'original'));
  const fresh = await queue.enqueue(input('fresh'));
  assert.deepEqual(await controlEmailOutbox({ ...control, now: f.now }), { status: 'completed' });
  assert.equal((await f.jobs.findOne({ _id: fresh })).state, 'pending');
  assert.equal((await f.controls.findOne({ _id: 'user' })).generation, 1);
  await assert.rejects(controlEmailOutbox({ ...control, actorId: 'other-admin' }), /identity-mismatch/);
  await assert.rejects(controlEmailOutbox({ ...control, assertAdmin: async () => { throw new Error('denied'); } }), /denied/);
});
test('bounded keyset batches advance past invalid identities and use the ID tie-breaker', { skip: !uri }, async t => {
  const f = await fixture(t, { limit: 2 });
  await f.jobs.insertMany([f.job('bad-a', { _id: '00-invalid' }), f.job('bad-b', { _id: '01-invalid' }), f.job('good')]);
  const first = await f.run();
  assert.equal(first.jobs.visited, 2); assert.equal(first.jobs.skipped, 2);
  const second = await f.run(); assert.equal(second.jobs.confirmed, 1);
  assert.equal(await f.jobs.countDocuments({ compactReceiptVersion: 1 }), 1);
  assert.equal(await f.jobs.countDocuments({ html: 'legacy payload' }), 2);
});
test('concurrent enqueue and a lost replacement acknowledgement cannot reopen an old event', { skip: !uri }, async t => {
  const f = await fixture(t), row = f.job('event'); await f.jobs.insertOne(row);
  const queue = createEmailOutbox({ ...f });
  const jobs = { find: (...args) => f.jobs.find(...args), findOne: (...args) => f.jobs.findOne(...args),
    replaceOne: async (...args) => {
      await f.jobs.replaceOne(...args);
      await queue.enqueue({ userId: 'user', eventId: 'event', subject: 'later', html: 'later body', language: 'en' });
      throw new Error('lost acknowledgement');
    } };
  const run = createEmailReceiptMaintenance({ ...f, jobs });
  assert.equal((await run()).jobs.confirmed, 1);
  assert.deepEqual(await f.jobs.findOne({ _id: row._id }), { _id: row._id, state: 'sent', compactReceiptVersion: 1 });
});
test('a row that stops being terminal before replacement is retained for recovery', { skip: !uri }, async t => {
  const f = await fixture(t), row = f.job('event'); await f.jobs.insertOne(row);
  const jobs = { find: (...args) => f.jobs.find(...args), findOne: (...args) => f.jobs.findOne(...args),
    replaceOne: async (...args) => { await f.jobs.updateOne({ _id: row._id }, { $set: { state: 'failed' } }); return f.jobs.replaceOne(...args); } };
  assert.equal((await createEmailReceiptMaintenance({ ...f, jobs })()).jobs.confirmed, 0);
  assert.equal((await f.jobs.findOne({ _id: row._id })).html, 'legacy payload');
});
test('failed job storage does not block command retention, and concurrent sweeps share one pass', { skip: !uri }, async t => {
  const f = await fixture(t), row = f.job('failure');
  await f.jobs.insertOne(row);
  const command = { _id: 'superseded-abcdefghijklmnop', userId: 'user', actorId: 'admin', action: 'pause', status: 'superseded', finishedAt: f.old };
  const pending = { ...command, _id: 'pending-command-abcdefghijklmnop', status: 'pending' };
  await f.commands.insertMany([command, pending]);
  let calls = 0;
  const jobs = { find: (...args) => f.jobs.find(...args), findOne: (...args) => f.jobs.findOne(...args),
    replaceOne: async () => { calls++; throw new Error('storage unavailable'); } };
  const run = createEmailReceiptMaintenance({ ...f, jobs });
  const first = run(), second = run();
  assert.equal(first, second);
  await assert.rejects(first, /email-receipt-maintenance-failed/);
  assert.equal(calls, 1);
  assert.deepEqual(await f.jobs.findOne({ _id: row._id }), row);
  assert.equal((await f.commands.findOne({ _id: command._id })).compactReceiptVersion, 1);
  assert.deepEqual(await f.commands.findOne({ _id: pending._id }), pending);
  assert.equal((await f.run()).jobs.confirmed, 1);
});
