const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createHmac } = require('node:crypto');
const { nextcloudIdentity, nextcloudUserId, nextcloudAdmin, matchesNextcloudUser } = require('../server/lib/nextcloudIdentity');
const env = { NEXTCLOUD_EXAPP: 'true', NEXTCLOUD_URL: 'https://cloud.example', WEKAN_NEXTCLOUD_PROXY_KEY: 'test-secret' };
function signed(identity) {
  const payload = Buffer.from(JSON.stringify(identity)).toString('base64url');
  return { 'x-wekan-nextcloud-user': payload,
    'x-wekan-nextcloud-signature': createHmac('sha256', env.WEKAN_NEXTCLOUD_PROXY_KEY).update(payload).digest('hex') };
}
const alice = { issuer: env.NEXTCLOUD_URL, userId: 'alice' };
test('Nextcloud login trusts only signed gateway identity in opt-in deployments', () => {
  assert.deepEqual(nextcloudIdentity(signed(alice), env), alice);
  assert.equal(nextcloudIdentity(signed(alice), { ...env, NEXTCLOUD_EXAPP: 'false' }), null);
  assert.equal(nextcloudIdentity({ ...signed(alice), 'x-wekan-nextcloud-signature': '0'.repeat(64) }, env), null);
  assert.equal(nextcloudIdentity(signed({ ...alice, issuer: 'https://other.example' }), env), null);
  assert.equal(nextcloudIdentity(signed({ ...alice, userId: '' }), env), null);
  assert.equal(nextcloudIdentity({}, env), null);
});
test('accounts are isolated by issuer and exact user ID, never linked by display name', () => {
  const user = { _id: nextcloudUserId(alice), services: { nextcloud: { id: alice.userId, issuer: alice.issuer } } };
  assert.ok(matchesNextcloudUser(user, alice));
  assert.ok(!matchesNextcloudUser(user, { ...alice, userId: 'bob' }));
  assert.ok(!matchesNextcloudUser({ _id: user._id, username: 'alice' }, alice));
  assert.notEqual(nextcloudUserId(alice), nextcloudUserId({ ...alice, issuer: 'https://other.example' }));
});
test('no implicit first-user admin; only configured exact Nextcloud IDs qualify', () => {
  assert.equal(nextcloudAdmin('alice', env), false);
  assert.equal(nextcloudAdmin('alice', { ...env, NEXTCLOUD_ADMIN_USERS: '["alice"]' }), true);
  assert.equal(nextcloudAdmin('Alice', { ...env, NEXTCLOUD_ADMIN_USERS: '["alice"]' }), false);
  assert.equal(nextcloudAdmin('alice', { ...env, NEXTCLOUD_ADMIN_USERS: 'invalid' }), false);
});
test('production imports and container capability ship the opt-in integration', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
  assert.ok(read('server/imports.js').includes("import '/server/nextcloud'"));
  assert.ok(read('client/imports.js').includes("import '/client/nextcloud'"));
  assert.ok(read('Dockerfile').includes('COPY releases/nextcloud/capability.json /build/nextcloud-exapp-capability.json'));
  assert.ok(read('server/models/users.js').includes("user.isAdmin = require('/server/lib/nextcloudIdentity').nextcloudAdmin"));
});
