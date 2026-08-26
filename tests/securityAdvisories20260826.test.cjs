'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const {
  RESERVED_SERVICE_DATA_FIELDS,
  mergeWhitelistedClaims,
} = require('../packages/wekan-oidc/serviceDataClaims');

test('OIDC allows whitelisted non-identity metadata', () => {
  const serviceData = { id: 'trusted-user', email: 'trusted@example.com' };
  mergeWhitelistedClaims(serviceData, {
    department: 'engineering', locale: 'fi', ignored: 'no',
  }, ['department', 'locale']);
  assert.deepEqual(serviceData, {
    id: 'trusted-user',
    email: 'trusted@example.com',
    department: 'engineering',
    locale: 'fi',
  });
});

test('OIDC rejects every service-owned and prototype field (negative)', () => {
  const serviceData = {
    id: 'trusted-user',
    username: 'trusted',
    email: 'trusted@example.com',
    accessToken: 'trusted-token',
  };
  const claims = Object.fromEntries(
    [...RESERVED_SERVICE_DATA_FIELDS].map(key => [key, `attacker-${key}`]));
  mergeWhitelistedClaims(serviceData, claims, Object.keys(claims));
  assert.equal(serviceData.id, 'trusted-user');
  assert.equal(serviceData.username, 'trusted');
  assert.equal(serviceData.email, 'trusted@example.com');
  assert.equal(serviceData.accessToken, 'trusted-token');
  assert.equal(Object.getPrototypeOf(serviceData), Object.prototype);
  for (const key of RESERVED_SERVICE_DATA_FIELDS) {
    assert.notEqual(serviceData[key], `attacker-${key}`, key);
  }
});

test('no OIDC path bulk-assigns token claims into serviceData (negative)', () => {
  const oidcFiles = fs.readdirSync(path.join(root, 'packages', 'wekan-oidc'))
    .filter(file => file.endsWith('.js'));
  for (const file of oidcFiles) {
    assert.ok(!/Object\.assign\(\s*serviceData\s*,/.test(
      read(path.join('packages', 'wekan-oidc', file))), file);
  }
});

const publication = read('server/publications/users.js');
test('authentication metadata requires a logged-in subscriber', () => {
  const start = publication.indexOf(
    "Meteor.publish('user-authenticationMethod'");
  const end = publication.indexOf("Meteor.publish('user-search'", start);
  const body = publication.slice(start, end);
  assert.match(body, /if \(!this\.userId\)/);
  assert.ok(body.indexOf('if (!this.userId)') <
    body.indexOf('ReactiveCache.getUsers'));
  assert.match(body, /return this\.ready\(\)/);
  assert.match(body, /key: 'authn\.authentication-method'/);
});

test('every sensitive user publication has an authentication guard (negative)', () => {
  for (const name of ['user-miniprofile', 'user-authenticationMethod', 'user-search']) {
    const start = publication.indexOf(`Meteor.publish('${name}'`);
    const end = publication.indexOf('Meteor.publish(', start + 20);
    const body = publication.slice(start, end < 0 ? undefined : end);
    assert.match(body, /if \(!this\.userId\)/, name);
  }
});

const { recordAuthRateLimitDenial } =
  require('../server/lib/authRateLimitDecision');

test('account recovery records only refused requests', () => {
  const events = [];
  assert.equal(recordAuthRateLimitDenial(
    { allowed: true }, { name: 'forgotPassword' }, event => events.push(event)),
  false);
  assert.equal(events.length, 0);
  assert.equal(recordAuthRateLimitDenial(
    { allowed: false },
    { name: 'forgotPassword', clientAddress: '192.0.2.1' },
    event => events.push(event)), true);
  assert.deepEqual(events[0], {
    key: 'brute.account-recovery',
    action: 'blocked',
    source: 'forgotPassword',
    ip: '192.0.2.1',
    detail: 'account recovery DDP rate limit exceeded',
  });
});

test('security logging failure cannot break a rate-limit denial (negative)', () => {
  assert.doesNotThrow(() => recordAuthRateLimitDenial(
    { allowed: false }, { name: 'resetPassword' }, () => {
      throw new Error('logger unavailable');
    }));
});

test('all account-recovery DDP methods have address-scoped limits', () => {
  const users = read('server/models/users.js');
  for (const [name, attempts] of [
    ['forgotPassword', 5], ['resetPassword', 5], ['verifyEmail', 10],
  ]) {
    assert.match(users, new RegExp(`\\['${name}', ${attempts}\\]`));
  }
  assert.match(users, /clientAddress\(\) \{ return true; \}/);
  assert.match(users, /accountRecoveryRateLimitCallback/);
});

test('no account-recovery method is registered without the shared callback (negative)', () => {
  const users = read('server/models/users.js');
  for (const name of ['forgotPassword', 'resetPassword', 'verifyEmail']) {
    assert.equal((users.match(new RegExp(name, 'g')) || []).length, 1,
      `${name} must occur only in the callback-protected rule table`);
  }
  assert.match(users,
    /DDPRateLimiter\.addRule\([\s\S]*?accountRecoveryRateLimitCallback,[\s\S]*?\);/);
});

console.log(`\nsecurityAdvisories20260826: ${passed} tests passed`);
