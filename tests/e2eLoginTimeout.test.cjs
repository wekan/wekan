'use strict';

// The legacy Puppeteer regression used to wait forever when a fresh second
// page never received its Meteor.loginWithToken callback. Keep every layer of
// that path bounded and diagnostic.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, 'e2e/list-regressions.js'), 'utf8');

assert.match(source, /Meteor\.status\(\)\.connected/,
  'token login waits for a connected DDP session, not merely the Meteor global');
assert.match(source, /DDP_CONNECT_TIMEOUT_MS/,
  'the DDP connection wait has a named timeout');
assert.match(source, /login callback timed out after \$\{timeoutMs\}ms/,
  'the login callback Promise always has a timeout exit');
assert.match(source, /state=\$\{JSON\.stringify\(loginResult\)\}/,
  'a login failure reports connection and account state');
assert.match(source, /Login did not settle on \$\{TEST_USER_ID\}/,
  'a callback cannot pass before reactive user state settles');
assert.match(source, /withTimeout\([\s\S]{0,100}runTest\(\)[\s\S]{0,100}SUITE_TIMEOUT_MS/,
  'the entire E2E suite has a final hard deadline');

console.log('e2eLoginTimeout: DDP connection, token callback, identity and suite waits are bounded');
