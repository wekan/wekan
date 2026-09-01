#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const {
  MAX_EMAIL_ATTACHMENTS,
  MAX_EMAIL_ATTACHMENT_BYTES,
  normalizeEmailAddress,
  normalizeAllowedSenders,
  senderIsAllowed,
  generateEmailInboxToken,
  hashEmailInboxToken,
  verifyEmailInboxToken,
  normalizeEmailAttachment,
  normalizeEmailAttachments,
  normalizeEmailInboxPayload,
  emailCaptureDescription,
} = require('../models/lib/emailInboxCapture');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('email addresses and sender allowlists are normalized', () => {
  assert.equal(normalizeEmailAddress(' User@Example.COM '), 'user@example.com');
  assert.equal(normalizeEmailAddress('not an address'), '');
  assert.deepEqual(
    normalizeAllowedSenders([' One@Example.COM ', 'one@example.com', 'bad']),
    ['one@example.com'],
  );
  const user = {
    emails: [{ address: 'owner@example.com' }],
    profile: {},
  };
  assert.equal(senderIsAllowed(user, 'owner@example.com'), true);
  assert.equal(senderIsAllowed(user, 'other@example.com'), false);
  assert.equal(
    senderIsAllowed({
      ...user,
      profile: { personalInboxEmailAllowedSenders: ['alias@example.com'] },
    }, 'owner@example.com'),
    false,
  );
});

test('tokens are generated once, stored hashed and compared exactly', () => {
  const token = generateEmailInboxToken();
  const hash = hashEmailInboxToken(token);
  assert.match(token, /^[A-Za-z0-9_-]{40,}$/);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, token);
  assert.equal(
    verifyEmailInboxToken({ profile: { personalInboxEmailTokenHash: hash } }, token),
    true,
  );
  assert.equal(
    verifyEmailInboxToken({ profile: { personalInboxEmailTokenHash: hash } }, `${token}x`),
    false,
  );
  assert.equal(verifyEmailInboxToken({ profile: {} }, token), false);
});

test('attachment metadata rejects dangerous names, mime types and sizes', () => {
  assert.deepEqual(
    normalizeEmailAttachment({
      name: 'requirements.pdf',
      contentType: 'application/pdf',
      size: 42,
    }),
    { name: 'requirements.pdf', contentType: 'application/pdf', size: 42 },
  );
  for (const unsafe of [
    { name: '../secret.txt', contentType: 'text/plain', size: 1 },
    { name: 'script.js', contentType: 'text/plain', size: 1 },
    { name: 'page.txt', contentType: 'text/html', size: 1 },
    { name: 'huge.txt', contentType: 'text/plain', size: MAX_EMAIL_ATTACHMENT_BYTES + 1 },
    { name: '', contentType: 'text/plain', size: 1 },
  ]) {
    assert.equal(normalizeEmailAttachment(unsafe), null, unsafe.name);
  }
  assert.equal(
    normalizeEmailAttachments(new Array(MAX_EMAIL_ATTACHMENTS + 1).fill({
      name: 'a.txt',
      contentType: 'text/plain',
      size: 1,
    })).valid,
    false,
  );
});

test('payloads require a sender and preserve safe email provenance', () => {
  const payload = normalizeEmailInboxPayload({
    userId: 'u1',
    from: ' Sender@Example.COM ',
    subject: ' Email capture ',
    text: 'Body',
    messageId: '<m1@example.com>',
    attachments: [{ name: 'note.txt', contentType: 'text/plain', size: 4 }],
  });
  assert.equal(payload.valid, true);
  assert.equal(payload.email.sender, 'sender@example.com');
  assert.equal(payload.email.title, 'Email capture');
  assert.equal(payload.email.attachments.length, 1);
  const description = emailCaptureDescription(payload.email);
  assert.match(description, /Captured from email sender: sender@example\.com/);
  assert.match(description, /Message-Id: <m1@example\.com>/);
  assert.match(description, /note\.txt \(text\/plain, 4 bytes\)/);
  assert.equal(normalizeEmailInboxPayload({ subject: 'No sender' }).valid, false);
});

test('server route is token/sender guarded and creates an email inbox card', () => {
  const server = read('server/personalInbox.js');
  const users = read('models/users.js');
  const cards = read('models/cards.js');
  const permissions = read('server/permissions/cards.js');

  assert.match(server, /WebApp\.handlers\.post\('\/api\/inbox\/email'/);
  assert.match(server, /verifyEmailInboxToken\(user, token\)/);
  assert.match(server, /senderIsAllowed\(user, email\.sender\)/);
  assert.match(server, /normalizeEmailInboxPayload\(req\.body \|\| \{\}\)/);
  assert.match(server, /captureSourceType: 'email'/);
  assert.match(server, /captureEmailAttachments: email\.attachments/);
  assert.match(server, /'personalInbox\.emailToken\.rotate'/);
  assert.match(server, /hashEmailInboxToken\(token\)/);
  assert.doesNotMatch(server, /personalInboxEmailToken['"]?\s*:/);
  assert.match(users, /profile\.personalInboxEmailTokenHash/);
  assert.match(users, /profile\.personalInboxEmailAllowedSenders/);
  assert.match(cards, /captureEmailFrom:/);
  assert.match(cards, /captureEmailMessageId:/);
  assert.match(cards, /captureEmailAttachments:/);
  assert.match(permissions, /captureEmailFrom/);
  assert.match(permissions, /captureEmailAttachments/);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  not ok - ${name}`);
    console.error(error.stack || error);
  }
}

console.log(`\nemailInboxCapture: ${tests.length - failed}/${tests.length} passed`);
if (failed) process.exitCode = 1;
