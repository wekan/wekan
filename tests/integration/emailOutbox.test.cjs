'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { createEmailOutbox, migrateLegacyEmailBuffer } = require('../../server/lib/emailOutbox');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`email_outbox_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const jobs = db.collection('jobs'), leases = db.collection('leases'), sent = [];
  let time = Date.now();
  const f = { db, jobs, leases, sent, advance: ms => { time += ms; }, now: () => new Date(time),
    user: { _id: 'user', emails: [{ address: 'Test@example.test' }] }, send: async () => {} };
  f.options = { jobs, leases, random: () => 0, delayMs: 100, leaseOptions: { heartbeatMs: 0 }, now: f.now,
    getUser: async () => f.user, from: () => 'from@example.test', replyTo: cardId => cardId || '',
    send: async mail => { sent.push(mail); await f.send(); return { accepted: [mail.to] }; } };
  f.queue = createEmailOutbox(f.options);
  f.job = (eventId, extra = {}) => ({ userId: 'user', eventId, subject: 'Subject', html: `<p>${eventId}</p>`, language: 'fi', cardId: 'card', ...extra });
  return f;
}
test('restart recovers persisted metadata and receipts prevent repeated event delivery', { skip: !uri }, async t => {
  const f = await fixture(t);
  const id = await f.queue.enqueue(f.job('event'));
  await f.queue.drain(); assert.equal(f.sent.length, 0, 'respect digest delay');
  f.advance(100);
  const restarted = createEmailOutbox(f.options); await restarted.drain();
  assert.equal(f.sent.length, 1); assert.equal(f.sent[0].language, 'fi');
  assert.equal(f.sent[0].subject, 'Subject'); assert.equal(f.sent[0].replyTo, 'card');
  assert.equal(f.sent[0].to, 'test@example.test');
  const receipt = await f.jobs.findOne({ _id: id });
  assert.equal(receipt.state, 'sent'); assert.equal(Object.hasOwn(receipt, 'html'), false);
  assert.equal(Object.hasOwn(receipt, 'subject'), false);
  await restarted.enqueue(f.job('event', { html: 'A later translation' }));
  f.advance(100); await restarted.drain(); assert.equal(f.sent.length, 1);
});
test('SMTP failure is retried without a new notification and uses bounded backoff', { skip: !uri }, async t => {
  const f = await fixture(t), id = await f.queue.enqueue(f.job('event'));
  f.send = async () => { throw Error('SMTP secret must not be persisted'); };
  f.advance(100); await f.queue.drain();
  let pending = await f.jobs.findOne({ _id: id });
  assert.equal(pending.state, 'pending'); assert.equal(pending.attempts, 1);
  assert.equal(pending.nextAttemptAt - f.now(), 5000);
  assert.doesNotMatch(JSON.stringify(pending), /SMTP secret/);
  await f.queue.drain(); assert.equal(f.sent.length, 1);
  f.advance(5000); await f.queue.drain();
  pending = await f.jobs.findOne({ _id: id }); assert.equal(pending.nextAttemptAt - f.now(), 10000);
  f.send = async () => {}; f.advance(10000); await createEmailOutbox(f.options).drain();
  assert.equal(f.sent.length, 3); assert.equal((await f.jobs.findOne({ _id: id })).state, 'sent');
});
test('two workers reserve the recipient and new or identical-text events survive an in-flight digest', { skip: !uri }, async t => {
  const f = await fixture(t), gate = deferred(), entered = deferred();
  await f.queue.enqueue(f.job('first', { html: 'Identical text' })); f.advance(100);
  f.send = async () => { entered.resolve(); await gate.promise; };
  const sending = f.queue.drain(); await entered.promise;
  await f.queue.enqueue(f.job('second', { html: 'Identical text' })); f.advance(100);
  await createEmailOutbox(f.options).drain(); assert.equal(f.sent.length, 1);
  gate.resolve(); await sending;
  assert.equal(await f.jobs.countDocuments({ state: 'pending' }), 1);
  await createEmailOutbox(f.options).drain(); assert.equal(f.sent.length, 2);
  assert.equal(await f.jobs.countDocuments({ state: 'sent' }), 2);
});
test('missing addresses and disabled users retain jobs; deleted users cancel without sending', { skip: !uri }, async t => {
  const f = await fixture(t); await f.queue.enqueue(f.job('event')); f.advance(100);
  f.user.emails = []; await f.queue.drain(); assert.equal(f.sent.length, 0);
  assert.equal(await f.jobs.countDocuments({ state: 'pending' }), 1);
  f.advance(5000); f.user.emails = [{ address: 'test@example.test' }]; f.user.loginDisabled = true;
  await f.queue.drain(); assert.equal(f.sent.length, 0);
  f.advance(10000); f.user = null; await f.queue.drain();
  assert.equal(await f.jobs.countDocuments({ state: 'cancelled', html: { $exists: false } }), 1);
});
test('lost enqueue acknowledgement is read back; false success never acknowledges unstored work', { skip: !uri }, async t => {
  const f = await fixture(t);
  const lost = createEmailOutbox({ ...f.options, jobs: {
    insertOne: async job => { await f.jobs.insertOne(job); throw Error('lost acknowledgement'); },
    findOne: (...args) => f.jobs.findOne(...args),
  } });
  const id = await lost.enqueue(f.job('event')); assert.ok(await f.jobs.findOne({ _id: id }));
  const fake = createEmailOutbox({ ...f.options, jobs: { insertOne: async () => ({}), findOne: async () => null } });
  await assert.rejects(fake.enqueue(f.job('missing')), /not-stored/);
  await assert.rejects(f.queue.enqueue(f.job('bad', { subject: 'Injected\nheader' })), /invalid-email-job/);
});
test('failed acknowledgement keeps pending work and permits an explicitly at-least-once retry', { skip: !uri }, async t => {
  const f = await fixture(t); await f.queue.enqueue(f.job('event')); f.advance(100);
  const jobs = new Proxy(f.jobs, { get(target, key) {
    if (key === 'updateMany') return async () => { throw Object.assign(Error('database unavailable after SMTP'), { responseCode: 550 }); };
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  await createEmailOutbox({ ...f.options, jobs }).drain();
  assert.equal(await f.jobs.countDocuments({ state: 'pending' }), 1); assert.equal(f.sent.length, 1);
  assert.equal((await f.jobs.findOne({ state: 'pending' })).lastFailure, 'acknowledgement-failed');
  f.advance(5000); await f.queue.drain(); assert.equal(f.sent.length, 2);
});
test('legacy migration resumes after partial insertion without losing or duplicating text', { skip: !uri }, async t => {
  const f = await fixture(t); const users = f.db.collection('users');
  await users.insertOne({ _id: 'user', profile: { emailBuffer: ['first', 'second'] } });
  const user = { ...await users.findOne({ _id: 'user' }), getLanguage: () => 'fi' };
  const clear = (id, texts) => users.updateOne({ _id: id }, { $pullAll: { 'profile.emailBuffer': texts } });
  let count = 0;
  await assert.rejects(migrateLegacyEmailBuffer({ enqueue: async job => {
    if (++count === 2) throw Error('interrupted'); return f.queue.enqueue(job);
  } }, user, clear), /interrupted/);
  assert.equal((await users.findOne({ _id: 'user' })).profile.emailBuffer.length, 2);
  await migrateLegacyEmailBuffer(f.queue, user, clear);
  assert.equal(await f.jobs.countDocuments({}), 2);
  assert.deepEqual((await users.findOne({ _id: 'user' })).profile.emailBuffer, []);
  f.advance(100); await f.queue.drain(); assert.equal(f.sent.length, 1);
  assert.equal(f.sent[0].subject, 'WeKan'); assert.match(f.sent[0].html, /first/); assert.match(f.sent[0].html, /second/);
});
test('expired reservation is recovered but an old sender cannot acknowledge a replacement lease', { skip: !uri }, async t => {
  const f = await fixture(t), gate = deferred(), entered = deferred();
  await f.queue.enqueue(f.job('event')); f.advance(100);
  f.send = async () => { entered.resolve(); await gate.promise; };
  const sending = f.queue.drain(); await entered.promise;
  await f.leases.updateOne({ _id: 'user' }, { $set: { owner: 'replacement' } });
  gate.resolve(); await sending;
  assert.equal(await f.jobs.countDocuments({ state: 'pending' }), 1);
  assert.equal((await f.leases.findOne({ _id: 'user' })).owner, 'replacement');
  f.advance(60001); await createEmailOutbox(f.options).drain();
  assert.equal(await f.jobs.countDocuments({ state: 'sent' }), 1);
});

test('console-only sends, suppressed hooks and rejection results await manual review', { skip: !uri }, async t => {
  const f = await fixture(t); let n = 0;
  for (const result of [undefined, {}, { accepted: [], rejected: ['test@example.test'] }, { accepted: ['other@example.test'] }]) {
    const id = await f.queue.enqueue(f.job(`event-${n++}`)); f.advance(100);
    await createEmailOutbox({ ...f.options, send: async () => result }).drain();
    const job = await f.jobs.findOne({ _id: id });
    assert.equal(job.state, 'failed'); assert.equal(job.lastFailure, 'delivery-unconfirmed');
    assert.ok(job.html); assert.equal(job.nextAttemptAt, undefined);
    f.advance(3600001);
  }
  await f.queue.drain(); assert.equal(f.sent.length, 0, 'uncertain delivery must not repeat automatically');
});
test('large backlogs split into bounded digests while one large event remains deliverable', { skip: !uri }, async t => {
  const f = await fixture(t);
  for (const eventId of ['one', 'two', 'three']) {
    await f.queue.enqueue(f.job(eventId, { html: eventId + 'x'.repeat(3 * 1024 * 1024) }));
    f.advance(1);
  }
  f.advance(100);
  await f.queue.drain(); assert.equal(await f.jobs.countDocuments({ state: 'pending' }), 2);
  await f.queue.drain(); await f.queue.drain(); assert.equal(f.sent.length, 3);
  assert.ok(f.sent.every(mail => Buffer.byteLength(mail.html) < 4 * 1024 * 1024));
  await f.queue.enqueue(f.job('large', { html: 'x'.repeat(5 * 1024 * 1024) }));
  f.advance(100); await f.queue.drain(); assert.equal(f.sent.length, 4);
  await assert.rejects(f.queue.enqueue(f.job('oversized', { html: 'x'.repeat(16 * 1024 * 1024) })), /too-large/);
});
test('revoked scope is cancelled without discarding other authorized jobs in the same digest', { skip: !uri }, async t => {
  const f = await fixture(t);
  await f.queue.enqueue(f.job('revoked', { boardId: 'revoked-board' }));
  await f.queue.enqueue(f.job('allowed', { boardId: 'allowed-board' })); f.advance(100);
  await createEmailOutbox({ ...f.options, canReceive: async (user, job) => job.boardId === 'allowed-board' }).drain();
  assert.equal(f.sent.length, 1); assert.match(f.sent[0].html, /allowed/); assert.doesNotMatch(f.sent[0].html, /revoked/);
  assert.equal(await f.jobs.countDocuments({ state: 'cancelled', html: { $exists: false } }), 1);
});
test('a false-positive acknowledgement write retains the pending job for retry', { skip: !uri }, async t => {
  const f = await fixture(t); await f.queue.enqueue(f.job('event')); f.advance(100);
  const jobs = new Proxy(f.jobs, { get(target, key) {
    if (key === 'updateMany') return async () => ({ matchedCount: 1, modifiedCount: 1 });
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  await createEmailOutbox({ ...f.options, jobs }).drain();
  const pending = await f.jobs.findOne({ state: 'pending' });
  assert.equal(pending.attempts, 1); assert.equal(pending.nextAttemptAt - f.now(), 5000);
});

test('SMTP rejection stops immediately, while temporary failures exhaust a durable twelve-attempt budget', { skip: !uri }, async t => {
  const f = await fixture(t), rejected = await f.queue.enqueue(f.job('rejected'));
  f.send = async () => { throw Object.assign(Error('PRIVATE SMTP detail'), { responseCode: 550 }); };
  f.advance(100); await f.queue.drain();
  const stopped = await f.jobs.findOne({ _id: rejected });
  assert.equal(stopped.state, 'failed'); assert.equal(stopped.lastFailure, 'smtp-rejected');
  assert.equal(stopped.cycleAttempts, 1); assert.ok(stopped.html); assert.equal(stopped.nextAttemptAt, undefined);
  f.advance(3600001); await createEmailOutbox(f.options).drain(); assert.equal(f.sent.length, 1);
  const temporary = await f.queue.enqueue(f.job('temporary')); f.advance(100);
  f.send = async () => { throw Object.assign(Error('PRIVATE temporary detail'), { responseCode: 451 }); };
  for (let attempt = 1; attempt <= 12; attempt++) {
    await createEmailOutbox({ ...f.options, random: () => 1 }).drain();
    const job = await f.jobs.findOne({ _id: temporary });
    assert.equal(job.cycleAttempts, attempt); assert.equal(job.attempts, attempt);
    assert.doesNotMatch(JSON.stringify(job), /PRIVATE/);
    if (attempt < 12) {
      assert.equal(job.state, 'pending'); assert.equal(job.lastFailure, 'smtp-temporary');
      const delay = Math.round(Math.min(2880000, 5000 * 2 ** (attempt - 1)) * 1.25);
      assert.equal(job.nextAttemptAt - f.now(), delay);
      f.advance(delay - 1); await f.queue.drain(); assert.equal(f.sent.length, attempt + 1);
      f.advance(1);
    } else {
      assert.equal(job.state, 'failed'); assert.equal(job.lastFailure, 'retry-limit');
      assert.equal(job.nextAttemptAt, undefined);
    }
  }
  f.advance(3600001); await f.queue.drain(); assert.equal(f.sent.length, 13);
});
test('crash-reserved and legacy exhausted budgets stop before SMTP; reservations require storage proof', { skip: !uri }, async t => {
  const f = await fixture(t);
  for (const extra of [{ cycleAttempts: 12 }, { attempts: 12 }]) {
    const id = await f.queue.enqueue(f.job(JSON.stringify(extra)));
    await f.jobs.updateOne({ _id: id }, { $set: extra, ...(!extra.cycleAttempts ? { $unset: { cycleAttempts: '' } } : {}) });
  }
  f.advance(100); await f.queue.drain();
  assert.equal(f.sent.length, 0); assert.equal(await f.jobs.countDocuments({ state: 'failed', lastFailure: 'retry-limit' }), 2);
  const id = await f.queue.enqueue(f.job('reservation')); f.advance(100);
  const wrap = update => new Proxy(f.jobs, { get(target, key) {
    if (key === 'updateOne') return update;
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  await assert.rejects(createEmailOutbox({ ...f.options, jobs: wrap(async () => ({ modifiedCount: 1 })) }).drainUser('user'), /attempt-not-stored/);
  assert.equal(f.sent.length, 0); assert.equal((await f.jobs.findOne({ _id: id })).cycleAttempts, 0);
  await createEmailOutbox({ ...f.options, jobs: wrap(async (...args) => {
    await f.jobs.updateOne(...args); throw Error('lost reservation acknowledgement');
  }) }).drainUser('user');
  assert.equal(f.sent.length, 1); assert.equal((await f.jobs.findOne({ _id: id })).cycleAttempts, 1);
});

test('four recipient workers progress independently and concurrent scans share the bounded pool', { skip: !uri, timeout: 10000 }, async t => {
  const f = await fixture(t), gate = deferred(), entered = deferred();
  let active = 0, peak = 0, started = 0;
  const delivered = [];
  const queue = createEmailOutbox({ ...f.options,
    getUser: async id => ({ _id: id, emails: [{ address: `${id}@example.test` }] }),
    send: async mail => {
      active++; peak = Math.max(peak, active); started++;
      if (started === 4) entered.resolve();
      await gate.promise;
      delivered.push(mail.userId); active--;
      return { accepted: [mail.to] };
    },
  });
  for (let i = 0; i < 9; i++) await queue.enqueue(f.job(`event-${i}`, { userId: `user-${i}` }));
  f.advance(100);
  const first = queue.drain();
  const second = queue.drain();
  assert.equal(first, second, 'callers await the same pass');
  try {
    await entered.promise;
    assert.equal(started, 4); assert.equal(peak, 4);
  } finally { gate.resolve(); await first; }
  assert.equal(delivered.length, 9); assert.equal(new Set(delivered).size, 9); assert.equal(peak, 4);
  await queue.drain(); assert.equal(delivered.length, 9);
});
test('a slow recipient with over one hundred messages does not hide other recipients', { skip: !uri, timeout: 10000 }, async t => {
  const f = await fixture(t), gate = deferred(), otherDelivered = deferred();
  for (let i = 0; i < 105; i++) await f.queue.enqueue(f.job(`slow-${i}`, { userId: 'slow' }));
  f.advance(1); await f.queue.enqueue(f.job('other', { userId: 'other' })); f.advance(100);
  const queue = createEmailOutbox({ ...f.options, send: async mail => {
    if (mail.userId === 'slow') await gate.promise;
    else otherDelivered.resolve();
    return { accepted: [mail.to] };
  } });
  const pass = queue.drain();
  try {
    await otherDelivered.promise;
    assert.equal(await f.jobs.countDocuments({ userId: 'slow', state: 'sent' }), 0);
  } finally { gate.resolve(); await pass; }
  assert.equal(await f.jobs.countDocuments({ userId: 'other', state: 'sent' }), 1);
  assert.equal(await f.jobs.countDocuments({ userId: 'slow', state: 'pending' }), 5);
});

test('a failed scheduling query releases the shared pass for the next poll', { skip: !uri }, async t => {
  const f = await fixture(t); await f.queue.enqueue(f.job('event')); f.advance(100);
  let fail = true;
  const jobs = new Proxy(f.jobs, { get(target, key) {
    if (key === 'aggregate') return (...args) => {
      if (fail) { fail = false; throw Error('temporary query failure'); }
      return target.aggregate(...args);
    };
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  const queue = createEmailOutbox({ ...f.options, jobs });
  await assert.rejects(queue.drain(), /temporary query failure/);
  assert.equal(f.sent.length, 0);
  await queue.drain(); assert.equal(f.sent.length, 1);
});
