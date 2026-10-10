'use strict';
// #3695 / #5171: grouping and scheduling through the durable queues - the
// e-mail outbox, the webhook queue and the tray entry - against a real
// MongoDB (WEKAN_SYNC_TEST_MONGO_URL). Restarts are simulated by building a
// new queue over the same collections.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { createEmailOutbox } = require('../../server/lib/emailOutbox');
const { createWebhookOutbox, MAX_ATTEMPTS } = require('../../server/lib/webhookOutbox');
const { createTrayDelivery } = require('../../server/lib/trayDelivery');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;

async function database(t, name) {
  const client = await new MongoClient(uri).connect();
  const db = client.db(`${name}_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  return db;
}

async function emailFixture(t) {
  const db = await database(t, 'delivery_email');
  const jobs = db.collection('jobs'), sent = [];
  let time = Date.parse('2026-10-10T10:00:00Z');
  const f = { jobs, sent, advance: ms => { time += ms; }, now: () => new Date(time) };
  f.options = { jobs, leases: db.collection('leases'), random: () => 0, delayMs: 100, leaseOptions: { heartbeatMs: 0 },
    now: f.now, getUser: async () => ({ _id: 'user', emails: [{ address: 'u@example.test' }] }),
    from: () => 'from@example.test', replyTo: () => '',
    send: async mail => { sent.push(mail); return { accepted: [mail.to] }; } };
  f.queue = createEmailOutbox(f.options);
  f.job = (eventId, extra = {}) => ({ userId: 'user', eventId, subject: `S ${eventId}`, html: `<p>${eventId}</p>`,
    language: 'en', cardId: null, boardId: 'b', ...extra });
  return f;
}

test('e-mail: one message per group, with the plain-text alternative when every item has one', { skip: !uri }, async t => {
  const f = await emailFixture(t);
  // One millisecond apart: the outbox sends in creation order.
  await f.queue.enqueue(f.job('a1', { groupKey: 'board:a', text: 'A1' })); f.advance(1);
  await f.queue.enqueue(f.job('b1', { groupKey: 'board:b', text: 'B1' })); f.advance(1);
  await f.queue.enqueue(f.job('a2', { groupKey: 'board:a', text: 'A2' })); f.advance(1);
  await f.queue.enqueue(f.job('legacy'));
  f.advance(100);
  await f.queue.drain();
  assert.equal(f.sent.length, 1);
  assert.equal(f.sent[0].html, '<p>a1</p><br/>\n\n<p>a2</p>');
  assert.equal(f.sent[0].text, 'A1\n\nA2');
  await f.queue.drain(); await f.queue.drain();
  assert.equal(f.sent.length, 3);
  assert.equal(f.sent[1].html, '<p>b1</p>');
  assert.equal(f.sent[2].html, '<p>legacy</p>');
  assert.equal(Object.hasOwn(f.sent[2], 'text'), false, 'a classic job sends html only, as before');
  assert.equal(await f.jobs.countDocuments({ state: 'sent', text: { $exists: false }, html: { $exists: false } }), 4,
    'payloads, plain text included, are removed after sending');
});

test('e-mail: the built-in jobs are still combined per recipient, unchanged', { skip: !uri }, async t => {
  const f = await emailFixture(t);
  await f.queue.enqueue(f.job('1')); f.advance(1); await f.queue.enqueue(f.job('2'));
  f.advance(100); await f.queue.drain();
  assert.equal(f.sent.length, 1); assert.equal(f.sent[0].html, '<p>1</p><br/>\n\n<p>2</p>');
});

test('e-mail: a scheduled job waits for its time, survives a restart and is sent once', { skip: !uri }, async t => {
  const f = await emailFixture(t);
  const deliverAt = f.now().getTime() + 3600000;
  await f.queue.enqueue(f.job('digest1', { deliverAt, groupKey: 'all' }));
  f.advance(60000);
  await f.queue.enqueue(f.job('digest2', { deliverAt, groupKey: 'all' }));
  f.advance(1000); await f.queue.drain();
  assert.equal(f.sent.length, 0, 'not before the scheduled time');
  f.advance(3600000);
  const restarted = createEmailOutbox(f.options);
  await restarted.drain(); await restarted.drain();
  assert.equal(f.sent.length, 1);
  assert.equal(f.sent[0].html, '<p>digest1</p><br/>\n\n<p>digest2</p>');
  // The same event enqueued again (a replayed plan) is not sent twice.
  await restarted.enqueue(f.job('digest1', { deliverAt, groupKey: 'all' }));
  f.advance(3600000); await restarted.drain();
  assert.equal(f.sent.length, 1);
});

test('negative: e-mail jobs with invalid delivery fields are refused', { skip: !uri }, async t => {
  const f = await emailFixture(t);
  for (const extra of [{ text: 5 }, { groupKey: '' }, { groupKey: 'x'.repeat(301) }, { deliverAt: 'tomorrow' }, { deliverAt: Infinity }]) {
    await assert.rejects(f.queue.enqueue(f.job('bad', extra)), /invalid-email-job/, JSON.stringify(extra));
  }
});

async function webhookFixture(t) {
  const db = await database(t, 'delivery_webhook');
  const jobs = db.collection('jobs'), posts = [];
  let time = Date.parse('2026-10-10T10:00:00Z');
  const f = { jobs, posts, advance: ms => { time += ms; }, now: () => new Date(time), status: 200,
    integration: { _id: 'hook', enabled: true, type: 'outgoing-webhooks', url: 'https://hook.example/x', token: 'tok' } };
  f.options = { jobs, leases: db.collection('leases'), now: f.now, leaseOptions: { heartbeatMs: 0 },
    getIntegration: async () => f.integration,
    post: async (url, request) => { posts.push({ url, ...request, body: JSON.parse(request.body) }); return { status: f.status }; } };
  f.queue = createWebhookOutbox(f.options);
  return f;
}

test('webhooks: a group is one POST to the webhook as it is now; a group of one is the plain body', { skip: !uri }, async t => {
  const f = await webhookFixture(t);
  const at = f.now().getTime() + 30000;
  for (const id of ['e1', 'e2']) {
    await f.queue.enqueue({ integrationId: 'hook', eventId: id, groupKey: 'board:b', deliverAt: at, body: { text: id, description: 'act-x' } });
    f.advance(1);
  }
  await f.queue.enqueue({ integrationId: 'hook', eventId: 'e3', groupKey: 'board:c', deliverAt: at, body: { text: 'e3' } });
  // The same event again is stored once.
  await f.queue.enqueue({ integrationId: 'hook', eventId: 'e1', groupKey: 'board:b', deliverAt: at, body: { text: 'changed' } });
  await f.queue.drain(); assert.equal(f.posts.length, 0, 'not before the window ends');
  f.advance(30000);
  f.integration = { ...f.integration, url: 'https://hook.example/new', token: 'new-token' };
  await createWebhookOutbox(f.options).drain();
  await f.queue.drain();
  assert.equal(f.posts.length, 2);
  assert.equal(f.posts[0].url, 'https://hook.example/new');
  assert.equal(f.posts[0].headers['X-Wekan-Token'], 'new-token');
  assert.deepEqual(f.posts[0].body, { text: 'e1\n\ne2', description: 'act-batch', count: 2,
    items: [{ text: 'e1', description: 'act-x' }, { text: 'e2', description: 'act-x' }] });
  assert.deepEqual(f.posts[1].body, { text: 'e3' });
  assert.equal(await f.jobs.countDocuments({ state: 'sent', body: { $exists: false } }), 3);
});

test('webhooks: a failed POST keeps the jobs and retries with backoff, then gives up', { skip: !uri }, async t => {
  const f = await webhookFixture(t);
  await f.queue.enqueue({ integrationId: 'hook', eventId: 'e1', groupKey: 'all', deliverAt: f.now().getTime(), body: { text: 'x' } });
  f.status = 500;
  await f.queue.drain();
  let job = await f.jobs.findOne({});
  assert.equal(job.state, 'pending'); assert.equal(job.attempts, 1);
  assert.equal(job.nextAttemptAt - f.now(), 30000);
  await f.queue.drain(); assert.equal(f.posts.length, 1, 'not again before the backoff');
  for (let i = 1; i < MAX_ATTEMPTS; i += 1) { f.advance(3600000); await f.queue.drain(); }
  job = await f.jobs.findOne({});
  assert.equal(job.state, 'failed'); assert.equal(Object.hasOwn(job, 'body'), false);
});

test('negative: a deleted, disabled or two-way webhook cancels its queued jobs without a request', { skip: !uri }, async t => {
  for (const integration of [null, { enabled: false }, { type: 'bidirectional-webhooks' }]) {
    const f = await webhookFixture(t);
    f.integration = integration && { ...f.integration, ...integration };
    await f.queue.enqueue({ integrationId: 'hook', eventId: 'e', groupKey: 'all', deliverAt: f.now().getTime(), body: { text: 'x' } });
    await f.queue.drain();
    assert.equal(f.posts.length, 0);
    assert.equal((await f.jobs.findOne({})).state, 'cancelled');
  }
  const f = await webhookFixture(t);
  for (const bad of [{ eventId: '' }, { groupKey: 5 }, { body: [] }, { deliverAt: NaN }]) {
    await assert.rejects(f.queue.enqueue({ integrationId: 'hook', eventId: 'e', groupKey: 'all', deliverAt: 0, body: {}, ...bad }), /invalid-webhook-job/);
  }
});

test('tray: a scheduled entry carries its showAt; an unscheduled entry is unchanged', { skip: !uri }, async t => {
  const db = await database(t, 'delivery_tray');
  const users = db.collection('users');
  await users.insertOne({ _id: 'u', profile: { notifications: [] } });
  const tray = createTrayDelivery({ users, receipts: db.collection('receipts') });
  await tray.deliver('u', 'a1', { showAt: 1791000000000 });
  await tray.deliver('u', 'a2');
  const { profile } = await users.findOne({ _id: 'u' });
  assert.deepEqual(profile.notifications, [{ activity: 'a1', read: null, showAt: 1791000000000 }, { activity: 'a2', read: null }]);
  await assert.rejects(tray.deliver('u', 'a3', { showAt: 'later' }), /show-at-invalid/);
});
