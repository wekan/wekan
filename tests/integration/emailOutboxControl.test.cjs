'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { randomUUID } = require('node:crypto');
const { createEmailOutbox } = require('../../server/lib/emailOutbox');
const { controlEmailOutbox } = require('../../server/lib/emailOutboxControl');
const { emailOutboxReport } = require('../../server/lib/emailOutboxReport');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`email_controls_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const jobs = db.collection('jobs'), controls = db.collection('controls'), commands = db.collection('commands'), leases = db.collection('leases');
  let time = Date.now(); const sent = [];
  const f = { jobs, controls, commands, leases, users: db.collection('users'), now: () => new Date(time), advance: ms => { time += ms; }, sent };
  f.args = { jobs, controls, commands, leases, now: f.now, leaseOptions: { heartbeatMs: 0 }, actorId: 'admin', assertAdmin: async () => {} };
  f.queue = createEmailOutbox({ ...f.args, delayMs: 0, getUser: async userId => ({ _id: userId, emails: [{ address: 'test@example.test' }] }),
    from: () => 'from@example.test', replyTo: () => '', send: async mail => { sent.push(mail); return { accepted: [mail.to] }; } });
  f.enqueue = (eventId, userId = 'user') => f.queue.enqueue({ userId, eventId, subject: 'Private subject', html: 'Private body', language: 'en' });
  f.control = (action, extra = {}) => controlEmailOutbox({ ...f.args, userId: 'user', action, requestId: randomUUID(), ...extra });
  return f;
}
test('pause holds existing and newly admitted jobs; resume wakes the queue and keeps audit counts', { skip: !uri }, async t => {
  const f = await fixture(t); await f.enqueue('first'); await f.control('pause');
  f.advance(100); await f.enqueue('second'); await f.queue.drain(); assert.equal(f.sent.length, 0);
  assert.equal(await f.jobs.countDocuments({ state: 'pending' }), 2);
  const held = await emailOutboxReport(f, { search: 'user', page: 1 });
  assert.equal(held.rows[0].paused, true); assert.equal(held.rows[0].queued, 2);
  await f.control('resume'); await f.queue.drain(); assert.equal(f.sent.length, 1);
  const control = await f.controls.findOne({ _id: 'user' });
  assert.equal(control.pauseCount, 1); assert.equal(control.resumeCount, 1); assert.equal(control.changedBy, 'admin');
});
test('cancel retains event receipts, preserves newer mail, and replaying the request cannot cancel again', { skip: !uri }, async t => {
  const f = await fixture(t); const id = await f.enqueue('old'); const requestId = randomUUID();
  await f.control('cancel', { requestId });
  const cancelled = await f.jobs.findOne({ _id: id }); assert.equal(cancelled.state, 'cancelled'); assert.equal(cancelled.html, undefined);
  f.advance(1); await f.enqueue('new'); await f.control('cancel', { requestId });
  await f.queue.drain(); assert.equal(f.sent.length, 1);
  await f.enqueue('old'); await f.queue.drain(); assert.equal(f.sent.length, 1);
  assert.equal((await f.controls.findOne({ _id: 'user' })).cancelCount, 1);
});
test('cancellation watermark covers an enqueue that began before cancel but committed afterward', { skip: !uri }, async t => {
  const f = await fixture(t); const id = await f.enqueue('late'); const delayed = await f.jobs.findOne({ _id: id });
  await f.jobs.deleteOne({ _id: id }); await f.control('cancel'); await f.jobs.insertOne(delayed);
  f.advance(100); await f.queue.drain(); assert.equal(f.sent.length, 0);
  assert.equal((await f.jobs.findOne({ _id: id })).state, 'cancelled');
});
test('an interrupted older command is superseded rather than undoing a newer operation', { skip: !uri }, async t => {
  const f = await fixture(t); await f.enqueue('event'); const requestId = randomUUID();
  const commands = new Proxy(f.commands, { get(target, key) {
    if (key === 'updateOne') return async () => { throw Error('reply interrupted'); };
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  await assert.rejects(f.control('pause', { requestId, commands }), /interrupted/);
  assert.equal((await f.controls.findOne({ _id: 'user' })).paused, true);
  await f.control('resume');
  assert.equal((await f.control('pause', { requestId })).status, 'superseded');
  assert.equal((await f.controls.findOne({ _id: 'user' })).paused, false);
  await f.queue.drain(); assert.equal(f.sent.length, 1);
});
test('live sends exclude controls, and administrator revocation prevents a new control', { skip: !uri }, async t => {
  const f = await fixture(t);
  await f.leases.insertOne({ _id: 'user', owner: 'sender', expiresAt: new Date(+f.now() + 60000) });
  await assert.rejects(f.control('pause'), error => error.code === 'sync-busy');
  assert.equal(await f.controls.countDocuments({}), 0);
  await f.leases.deleteOne({ _id: 'user' });
  await assert.rejects(f.control('pause', { assertAdmin: async () => { throw Error('revoked'); } }), /revoked/);
  assert.equal(await f.controls.countDocuments({}), 0);
});
test('report merges paused recipients and pending summaries with literal search and clamped pages', { skip: !uri }, async t => {
  const f = await fixture(t);
  for (let i = 0; i < 13; i++) {
    const userId = `match.*-${String(i).padStart(2, '0')}`;
    await f.enqueue('first', userId); await f.enqueue('second', userId);
    await f.users.insertOne({ _id: userId, username: `User ${i}`, emails: [{ address: 'SECRET@example.test' }] });
  }
  await f.controls.insertMany([{ _id: 'match.*-00', paused: true }, { _id: 'match.*-empty', paused: true }]);
  await f.enqueue('unrelated', 'matchXX');
  const first = await emailOutboxReport(f, { search: 'match.*', page: 1 });
  assert.equal(first.total, 14); assert.equal(first.rows.length, 10); assert.equal(first.rows[0].queued, 2); assert.equal(first.rows[0].paused, true);
  const last = await emailOutboxReport(f, { search: 'match.*', page: 999 });
  assert.equal(last.page, 2); assert.equal(last.rows.length, 4); assert.equal(last.rows.at(-1).queued, 0);
  assert.doesNotMatch(JSON.stringify(first), /Private|SECRET|example.test|html|subject|eventId/);
  await assert.rejects(emailOutboxReport(f, { search: 'x'.repeat(101), page: 1 }), /invalid-email-report/);
});
test('lost and false write acknowledgements require saved control state, and request identities cannot change', { skip: !uri }, async t => {
  const f = await fixture(t); const requestId = randomUUID();
  const controls = new Proxy(f.controls, { get(target, key) {
    if (key === 'updateOne') return async (...args) => { await target.updateOne(...args); throw Error('lost reply'); };
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  assert.equal((await f.control('pause', { requestId, controls })).status, 'completed');
  await assert.rejects(f.control('resume', { requestId }), /identity-mismatch/);
  await assert.rejects(f.control('pause', { requestId, actorId: 'other-admin' }), /identity-mismatch/);
  const phantom = new Proxy(f.controls, { get(target, key) {
    if (key === 'updateOne') return async () => ({ matchedCount: 1 });
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  await assert.rejects(f.control('resume', { controls: phantom }), /generation-mismatch/);
  assert.equal((await f.controls.findOne({ _id: 'user' })).paused, true);
});
test('incomplete cancellation reports failure, while the durable cutoff still prevents old delivery', { skip: !uri }, async t => {
  const f = await fixture(t); await f.enqueue('old'); const requestId = randomUUID();
  const jobs = new Proxy(f.jobs, { get(target, key) {
    if (key === 'updateMany') return async () => ({ matchedCount: 1, modifiedCount: 1 });
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  await assert.rejects(f.control('cancel', { requestId, jobs }), /cancel-incomplete/);
  assert.equal((await f.commands.findOne({ _id: requestId })).status, 'pending');
  const queue = createEmailOutbox({ ...f.args, jobs, delayMs: 0,
    getUser: async () => { throw Error('cancelled mail must not be loaded for sending'); },
    send: async () => { throw Error('cancelled mail must not be sent'); } });
  await queue.drain(); assert.equal(await f.jobs.countDocuments({ state: 'pending' }), 1);
  assert.equal((await f.control('cancel', { requestId })).status, 'completed');
  assert.equal(await f.jobs.countDocuments({ state: 'pending' }), 0);
});
test('invalid control actions and short identifiers are rejected before any storage changes', { skip: !uri }, async t => {
  const f = await fixture(t);
  for (const args of [{ action: 'delete-everything' }, { requestId: 'short' }, { userId: '' }]) {
    await assert.rejects(f.control('pause', args), /invalid-email-control/);
  }
  assert.equal(await f.commands.countDocuments({}), 0); assert.equal(await f.controls.countDocuments({}), 0);
});
test('a request interrupted before changing the control cannot reuse a generation claimed by another request', { skip: !uri }, async t => {
  const f = await fixture(t), requestId = randomUUID();
  const controls = new Proxy(f.controls, { get(target, key) {
    if (key === 'updateOne') return async () => { throw Error('write not started'); };
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  await assert.rejects(f.control('pause', { requestId, controls }), /write not started/);
  await f.control('resume');
  assert.equal((await f.control('pause', { requestId })).status, 'superseded');
  assert.equal((await f.controls.findOne({ _id: 'user' })).paused, false);
});

test('failed rows report safe reasons, retry preserves pause and lifetime counts, cancel scrubs payloads', { skip: !uri }, async t => {
  const f = await fixture(t), id = await f.enqueue('stopped');
  await f.jobs.updateOne({ _id: id }, { $set: { state: 'failed', attempts: 12, cycleAttempts: 12,
    failedAt: f.now(), lastFailure: 'retry-limit' }, $unset: { nextAttemptAt: '' } });
  const report = await emailOutboxReport(f);
  assert.equal(report.total, 1); assert.equal(report.rows[0].queued, 1);
  assert.equal(report.rows[0].failed, 1); assert.equal(report.rows[0].retrying, 0);
  assert.equal(report.rows[0].nextAttemptAt, null);
  assert.deepEqual(report.rows[0].failures, [{ reason: 'retry-limit', count: 1 }]);
  assert.doesNotMatch(JSON.stringify(report), /Private|html|subject/);
  await f.control('resume'); await f.queue.drain(); assert.equal(f.sent.length, 0);
  await f.control('pause'); await f.control('retry'); await f.queue.drain();
  let job = await f.jobs.findOne({ _id: id });
  assert.equal(job.state, 'pending'); assert.equal(job.cycleAttempts, 0); assert.equal(job.attempts, 12);
  assert.equal(job.lastFailure, undefined); assert.equal(job.failedAt, undefined); assert.equal(f.sent.length, 0);
  await f.control('resume'); await f.queue.drain(); assert.equal(f.sent.length, 1);
  const cancelled = await f.enqueue('cancel-failed');
  await f.jobs.updateOne({ _id: cancelled }, { $set: { state: 'failed', failedAt: f.now(), lastFailure: 'smtp-rejected' } });
  await f.control('cancel'); job = await f.jobs.findOne({ _id: cancelled });
  assert.equal(job.state, 'cancelled'); assert.equal(job.html, undefined); assert.equal(job.failedAt, undefined);
});
test('replaying an interrupted retry cannot reset a newly exhausted cycle again', { skip: !uri }, async t => {
  const f = await fixture(t), id = await f.enqueue('stopped'), requestId = randomUUID();
  await f.jobs.updateOne({ _id: id }, { $set: { state: 'failed', cycleAttempts: 12 } });
  const commands = new Proxy(f.commands, { get(target, key) {
    if (key === 'updateOne') return async () => { throw Error('receipt interrupted'); };
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  await assert.rejects(f.control('retry', { requestId, commands }), /interrupted/);
  assert.equal((await f.jobs.findOne({ _id: id })).cycleAttempts, 0);
  await f.jobs.updateOne({ _id: id }, { $set: { state: 'failed', cycleAttempts: 12 } });
  await f.control('retry', { requestId });
  const job = await f.jobs.findOne({ _id: id });
  assert.equal(job.state, 'failed'); assert.equal(job.cycleAttempts, 12);
  await f.control('retry'); assert.equal((await f.jobs.findOne({ _id: id })).cycleAttempts, 0);
});

test('retry requires durable state and tolerates a lost update acknowledgement', { skip: !uri }, async t => {
  const f = await fixture(t), id = await f.enqueue('stopped');
  await f.jobs.updateOne({ _id: id }, { $set: { state: 'failed', cycleAttempts: 12, lastFailure: 'PRIVATE UNKNOWN REASON' } });
  assert.deepEqual((await emailOutboxReport(f)).rows[0].failures, []);
  const proxy = update => new Proxy(f.jobs, { get(target, key) {
    if (key === 'updateMany') return update;
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  const requestId = randomUUID();
  await assert.rejects(f.control('retry', { requestId, jobs: proxy(async () => ({ modifiedCount: 1 })) }), /retry-incomplete/);
  assert.equal((await f.jobs.findOne({ _id: id })).state, 'failed');
  await f.control('retry', { requestId, jobs: proxy(async (...args) => {
    await f.jobs.updateMany(...args); throw Error('lost acknowledgement');
  }) });
  assert.equal((await f.jobs.findOne({ _id: id })).state, 'pending');
  assert.equal((await f.commands.findOne({ _id: requestId })).status, 'completed');
});
