'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const path = require('node:path');
const { createEmailSendSlots } = require('../../server/lib/emailSendSlots');
const { smtpCancellationSignal } = require('../../server/lib/smtpCancellation');
const { createEmailOutbox } = require('../../server/lib/emailOutbox');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`email_slots_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  return { db, slots: db.collection('slots') };
}
const poll = async check => { for (let i = 0; i < 200; i++) { if (await check()) return; await new Promise(r => setTimeout(r, 10)); } assert.fail('condition did not become true'); };
test('independent outbox workers share capacity without consuming attempts for blocked recipients', { skip: !uri, timeout: 10000 }, async t => {
  const f = await fixture(t), release = deferred();
  let active = 0, maximum = 0, entered = 0;
  const options = { jobs: f.db.collection('jobs'), leases: f.db.collection('leases'), delayMs: 1,
    getUser: async id => ({ _id: id, emails: [{ address: `${id}@example.test` }] }),
    from: () => 'sender@example.test', replyTo: () => '',
    send: async mail => { active++; entered++; maximum = Math.max(maximum, active); await release.promise; active--; return { accepted: [mail.to] }; } };
  const make = () => createEmailOutbox({ ...options, withDeliverySlot: createEmailSendSlots(f.slots, { limit: 2 }) });
  const first = make(), second = make();
  for (let i = 0; i < 4; i++) await first.enqueue({ userId: `u${i}`, eventId: 'event', subject: 'subject', html: 'body', language: 'en' });
  await new Promise(r => setTimeout(r, 5));
  const draining = first.drain();
  try {
    await poll(() => entered === 2);
    await second.drain();
    assert.equal(maximum, 2);
    assert.equal(await f.slots.countDocuments({}), 2);
    assert.equal(await options.jobs.countDocuments({ cycleAttempts: 0, attempts: 0, state: 'pending' }), 2);
  } finally { release.resolve(); await draining; }
  await second.drain();
  assert.equal(await options.jobs.countDocuments({ state: 'sent' }), 4);
  assert.equal(await f.slots.countDocuments({}), 0);
});
test('lost ownership aborts in-flight work and cannot delete the replacement reservation', { skip: !uri, timeout: 5000 }, async t => {
  const f = await fixture(t), started = deferred();
  const run = createEmailSendSlots(f.slots, { limit: 1, leaseMs: 200, heartbeatMs: 30 });
  const result = run(() => new Promise((resolve, reject) => {
    const signal = smtpCancellationSignal();
    signal.addEventListener('abort', () => reject(signal.reason), { once: true }); started.resolve();
  }));
  const rejected = assert.rejects(result, { code: 'sync-lease-lost' });
  await started.promise;
  await f.slots.updateOne({ _id: 'slot-0' }, { $set: { owner: 'replacement', expiresAt: new Date(Date.now() + 10000) } });
  await rejected;
  assert.equal((await f.slots.findOne({ _id: 'slot-0' })).owner, 'replacement');
});
test('a hung database renewal cannot extend local send authority', { skip: !uri, timeout: 5000 }, async t => {
  const f = await fixture(t), renewal = deferred(), aborted = deferred();
  let checks = 0;
  const storage = { updateOne: (...args) => {
    if (args[0].owner && ++checks > 1) return renewal.promise;
    return f.slots.updateOne(...args);
  }, deleteOne: (...args) => f.slots.deleteOne(...args) };
  const run = createEmailSendSlots(storage, { limit: 1, leaseMs: 100, heartbeatMs: 20 });
  const rejected = assert.rejects(run(() => new Promise((resolve, reject) => {
    const signal = smtpCancellationSignal();
    signal.addEventListener('abort', () => { aborted.resolve(); reject(signal.reason); }, { once: true });
  })), { code: 'sync-lease-lost' });
  await aborted.promise;
  assert.ok(checks > 1, 'database renewal was pending at expiry');
  renewal.reject(new Error('database unavailable'));
  await rejected;
});
test('separate Node processes exclude each other and reclaim a crashed owner after expiry', { skip: !uri, timeout: 15000 }, async t => {
  const f = await fixture(t), workers = [];
  t.after(async () => {
    for (const child of workers) if (child.exitCode === null && child.signalCode === null) {
      const ended = once(child, 'exit'); child.kill('SIGKILL'); await ended;
    }
  });
  const start = () => {
    const child = fork(path.join(__dirname, '../helpers/email-slot-worker.cjs'), [f.db.databaseName],
      { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
    workers.push(child); return child;
  };
  const first = start(); assert.deepEqual((await once(first, 'message'))[0], { state: 'held' });
  const second = start(); assert.deepEqual((await once(second, 'message'))[0], { state: 'error', code: 'email-capacity-busy' });
  const died = once(first, 'exit'); first.kill('SIGKILL'); await died;
  await poll(async () => (await f.slots.findOne({ _id: 'slot-0' })).expiresAt <= new Date());
  const replacement = start(); assert.deepEqual((await once(replacement, 'message'))[0], { state: 'held' });
  replacement.send('release'); assert.deepEqual((await once(replacement, 'message'))[0], { state: 'released' });
  assert.equal(await f.slots.countDocuments({}), 0);
});
test('losing a shared slot closes the real native SMTP socket before its send deadline',
  { skip: !uri || process.env.WEKAN_SMTP_TEST !== '1', timeout: 6000 }, async t => {
    const f = await fixture(t), net = require('node:net');
    const nodemailer = require(process.env.WEKAN_NODEMAILER_PATH || path.resolve(
      '.meteor/local/build/programs/server/npm/node_modules/meteor/email/node_modules/nodemailer'));
    require('../../server/lib/nativeSmtpDeadline').installNativeSmtpDeadline(nodemailer,
      { timeoutMs: 2000, timeouts: { greetingTimeout: 2000, socketTimeout: 2000 } });
    const connected = deferred(), disconnected = deferred(), sockets = new Set();
    const server = net.createServer(socket => {
      sockets.add(socket); socket.on('error', () => {});
      const timer = setInterval(() => socket.write('220-still waiting\r\n'), 5);
      socket.on('close', () => { clearInterval(timer); sockets.delete(socket); disconnected.resolve(); });
      connected.resolve();
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(async () => { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); });
    const run = createEmailSendSlots(f.slots, { limit: 1, leaseMs: 300, heartbeatMs: 40 });
    const mailer = nodemailer.createTransport(`smtp://127.0.0.1:${server.address().port}/?wekanTotalTimeout=2000`);
    const rejected = assert.rejects(run(() => mailer.sendMail({ from: 'sender@example.test',
      to: 'recipient@example.test', text: 'test' })), { code: 'sync-lease-lost' });
    await connected.promise;
    await f.slots.updateOne({ _id: 'slot-0' }, { $set: { owner: 'replacement', expiresAt: new Date(Date.now() + 10000) } });
    await rejected; await disconnected.promise;
  });
