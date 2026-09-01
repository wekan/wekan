#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const {
  generateConnectorToken,
  hashConnectorToken,
  verifyConnectorToken,
  normalizeConnectorType,
  normalizeConnectorTypes,
  connectorTypeIsAllowed,
  normalizeConnectorOrigin,
  normalizeConnectorOrigins,
  connectorOriginIsAllowed,
  normalizeConnectorPayload,
  connectorCaptureDescription,
} = require('../models/lib/connectorCapture');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('connector tokens are stored hashed and compared exactly', () => {
  const token = generateConnectorToken();
  const hash = hashConnectorToken(token);
  assert.match(token, /^[A-Za-z0-9_-]{40,}$/);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, token);
  assert.equal(
    verifyConnectorToken({ profile: { personalInboxConnectorTokenHash: hash } }, token),
    true,
  );
  assert.equal(
    verifyConnectorToken({ profile: { personalInboxConnectorTokenHash: hash } }, `${token}x`),
    false,
  );
  assert.equal(verifyConnectorToken({ profile: {} }, token), false);
});

test('connector type permission is explicit and normalized', () => {
  assert.equal(normalizeConnectorType(' Browser '), 'browser');
  assert.equal(normalizeConnectorType('email'), '');
  assert.deepEqual(
    normalizeConnectorTypes(['browser', 'Browser', 'slack', 'email']),
    ['browser', 'slack'],
  );
  const user = { profile: { personalInboxConnectorTypes: ['browser'] } };
  assert.equal(connectorTypeIsAllowed(user, 'browser'), true);
  assert.equal(connectorTypeIsAllowed(user, 'slack'), false);
});

test('origin allowlists reject wrong or credentialed origins', () => {
  assert.equal(normalizeConnectorOrigin(' https://example.test/path?q=1 '), 'https://example.test');
  assert.equal(normalizeConnectorOrigin('https://name:secret@example.test'), '');
  assert.equal(normalizeConnectorOrigin('file:///tmp/a'), '');
  assert.deepEqual(
    normalizeConnectorOrigins(['https://example.test/a', 'https://example.test/b']),
    ['https://example.test'],
  );
  const user = {
    profile: { personalInboxConnectorOrigins: ['https://allowed.example'] },
  };
  assert.equal(connectorOriginIsAllowed(user, 'https://allowed.example/clip'), true);
  assert.equal(connectorOriginIsAllowed(user, 'https://blocked.example/clip'), false);
  assert.equal(connectorOriginIsAllowed({ profile: {} }, ''), true);
});

test('payloads require user, connector type, title and safe source URL', () => {
  const payload = normalizeConnectorPayload({
    userId: 'u1',
    type: 'browser',
    title: ' Clip this page ',
    description: 'Useful source',
    sourceUrl: 'https://example.test/post',
    origin: 'https://example.test/path',
    externalId: 'tab-123',
  });
  assert.equal(payload.valid, true);
  assert.equal(payload.connector.type, 'browser');
  assert.equal(payload.connector.sourceUrl, 'https://example.test/post');
  assert.equal(payload.connector.origin, 'https://example.test');
  assert.match(connectorCaptureDescription(payload.connector), /Captured from browser connector\./);
  assert.equal(normalizeConnectorPayload({ type: 'browser', title: 'Missing user' }).valid, false);
  assert.equal(normalizeConnectorPayload({ userId: 'u1', type: 'email', title: 'Bad type' }).valid, false);
  assert.equal(normalizeConnectorPayload({ userId: 'u1', type: 'browser', sourceUrl: 'https://x.test' }).valid, false);
  assert.equal(
    normalizeConnectorPayload({
      userId: 'u1',
      type: 'browser',
      title: 'Bad URL',
      sourceUrl: 'javascript:alert(1)',
    }).valid,
    false,
  );
});

test('server route uses connector token, type and origin guards before capture', () => {
  const server = read('server/personalInbox.js');
  const users = read('models/users.js');
  const cards = read('models/cards.js');

  assert.match(server, /WebApp\.handlers\.post\('\/api\/inbox\/connector'/);
  assert.match(server, /verifyConnectorToken\(user, token\)/);
  assert.match(server, /connectorTypeIsAllowed\(user, connector\.type\)/);
  assert.match(server, /connectorOriginIsAllowed\(user, connector\.origin\)/);
  assert.match(server, /normalizeConnectorPayload\(req\.body \|\| \{\}\)/);
  assert.match(server, /captureSourceType: connector\.type/);
  assert.match(server, /'personalInbox\.connectorToken\.rotate'/);
  assert.match(server, /hashConnectorToken\(token\)/);
  assert.doesNotMatch(server, /personalInboxConnectorToken['"]?\s*:/);
  assert.match(users, /profile\.personalInboxConnectorTokenHash/);
  assert.match(users, /profile\.personalInboxConnectorTypes/);
  assert.match(users, /profile\.personalInboxConnectorOrigins/);
  assert.match(cards, /allowedValues: \['quick-capture', 'email', 'browser', 'slack', 'teams'\]/);
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

console.log(`\nconnectorInboxCapture: ${tests.length - failed}/${tests.length} passed`);
if (failed) process.exitCode = 1;
