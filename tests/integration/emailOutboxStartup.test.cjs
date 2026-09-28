'use strict';
// Opt-in two-process test. Stop the app, set WEKAN_EMAIL_STARTUP_TEST_MONGO_URL
// to its disposable test database and WEKAN_EMAIL_STARTUP_READY_FILE under
// .tools/tmp, then run this suite. Once the ready file exists, start the app
// against that database with MAIL_URL=smtp://127.0.0.1:<SMTP port>.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { MongoClient } = require('mongodb');
const { randomUUID } = require('node:crypto');
const { smtpSink } = require('../playwright/helpers/smtpSink');
const { idFor } = require('../../server/lib/emailOutbox');
const uri = process.env.WEKAN_EMAIL_STARTUP_TEST_MONGO_URL;
test('a stopped app resumes a persisted digest on startup without another activity', { skip: !uri, timeout: 180000 }, async t => {
  const appURL = process.env.WEKAN_EMAIL_STARTUP_TEST_APP_URL || 'http://127.0.0.1:4100';
  const readyFile = process.env.WEKAN_EMAIL_STARTUP_READY_FILE;
  assert.ok(readyFile, 'set a task-specific ready file');
  let listening = false;
  try { await fetch(appURL, { signal: AbortSignal.timeout(1000) }); listening = true; } catch (error) { /* app must be stopped */ }
  assert.equal(listening, false, 'stop the app before seeding its startup queue');
  const client = await new MongoClient(uri).connect(), db = client.db();
  const userId = `outbox-startup-${randomUUID()}`, eventId = randomUUID(), _id = idFor(userId, eventId);
  const address = `${userId}@example.test`;
  const sink = await smtpSink(Number(process.env.WEKAN_EMAIL_STARTUP_TEST_SMTP_PORT || 4102));
  t.after(async () => {
    fs.rmSync(readyFile, { force: true });
    await db.collection('notificationEmailJobs').deleteOne({ _id });
    await db.collection('notificationEmailLeases').deleteOne({ _id: userId });
    await db.collection('users').deleteOne({ _id: userId });
    await sink.close(); await client.close();
  });
  await db.collection('users').insertOne({ _id: userId, emails: [{ address }], profile: { language: 'en' } });
  await db.collection('notificationEmailJobs').insertOne({ _id, userId, eventId, state: 'pending', attempts: 0,
    createdAt: new Date(), nextAttemptAt: new Date(), subject: 'Persisted startup subject',
    html: 'Persisted startup body', language: 'en', cardId: null });
  fs.writeFileSync(readyFile, 'queue seeded; start the test app\n');
  const deadline = Date.now() + 150000;
  let receipt;
  while (Date.now() < deadline) {
    receipt = await db.collection('notificationEmailJobs').findOne({ _id });
    if (receipt?.state === 'sent') break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.equal(receipt?.state, 'sent'); assert.equal(Object.hasOwn(receipt, 'html'), false);
  const mail = sink.messages.filter(message => message.recipients.includes(address));
  assert.equal(mail.length, 1); assert.match(mail[0].data, /Persisted startup subject/);
  assert.match(mail[0].data, /Persisted startup body/);
});
