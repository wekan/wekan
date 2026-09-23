'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { waitForMeteor } = require('../helpers/auth');
test.describe('Sandstorm trusted-proxy handshake', () => {
  test.skip(process.env.WEKAN_TEST_SANDSTORM !== '1', 'Requires isolated --sandstorm runner');
  for (const identity of ['alice', null]) test(`proxy identity and permissions: ${identity || 'anonymous'}`, async ({ page, context }) => {
    await context.route('**/.sandstorm-login', route => route.continue({ headers: {
      ...route.request().headers(), 'x-sandstorm-username': encodeURIComponent(identity ? 'Alice Sandstorm' : 'Anonymous'),
      'x-sandstorm-permissions': identity ? 'read,write' : 'read', 'x-sandstorm-session-id': 'fixture-session',
      ...(identity ? { 'x-sandstorm-user-id': 'fixture-sandstorm-alice', 'x-sandstorm-preferred-handle': 'alice' } : {}),
    } }));
    await page.goto('/'); await waitForMeteor(page);
    await expect.poll(() => page.evaluate(() => Meteor.sandstormUser())).toBeTruthy();
    const returned = await page.evaluate(() => ({ profile: Meteor.sandstormUser(), id: Meteor.userId() }));
    expect(returned.profile.id).toBe(identity ? 'fixture-sandstorm-alice' : null);
    expect(returned.profile.permissions).toEqual(identity ? ['read', 'write'] : ['read']);
    if (identity) {
      expect(returned.id).toBeTruthy();
      const user = db.findOne('users', { _id: returned.id });
      expect(user.services.sandstorm.id).toBe('fixture-sandstorm-alice'); expect(user.profile.fullname).toBe('Alice Sandstorm');
      db.cleanup({ userIds: [returned.id] });
    } else expect(returned.id).toBeNull();
  });
  test('unmatched proxy token cannot establish an identity', async ({ request }) => {
    const result = await request.post('/.sandstorm-login', { headers: { 'Content-Type': 'application/x-sandstorm-login-token', 'x-sandstorm-user-id': 'forged-unmatched' }, data: 'not-a-pending-ddp-token' });
    expect(result.status()).toBe(500);
    expect(await result.text()).toBe('Sandstorm login failed');
    expect(db.findOne('users', { 'services.sandstorm.id': 'forged-unmatched' })).toBeNull();
  });
  test('malformed proxy request does not disclose exception details', async ({ request }) => {
    const result = await request.post('/.sandstorm-login', {
      headers: { 'Content-Type': 'text/plain' }, data: 'private-request-marker',
    });
    expect(result.status()).toBe(500);
    expect(await result.text()).toBe('Sandstorm login failed');
  });
});
