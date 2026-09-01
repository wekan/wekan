'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { waitForMeteor } = require('../helpers/auth');

test.describe('Email verification', () => {
  test('#1426 an anonymous verification link verifies and signs in the user', async ({
    page,
    user,
  }) => {
    const token = `verify-${user.id}`;
    db.updateOne('users', { _id: user.id }, {
      $set: {
        'emails.0.verified': false,
        'services.email.verificationTokens': [{
          token,
          address: user.email,
          when: new Date(),
        }],
      },
    });

    await page.goto(`/verify-email/${token}`, { waitUntil: 'commit' });

    await expect.poll(() => {
      const stored = db.findOne('users', { _id: user.id });
      return stored.emails[0].verified;
    }, { timeout: 15_000 }).toBe(true);
    await expect.poll(
      () => page.evaluate(() => Meteor.userId()),
      { timeout: 15_000 },
    ).toBe(user.id);
    expect(db.findOne('users', { _id: user.id })
      .services.email.verificationTokens || []).toHaveLength(0);
  });

  test('#1426 an invalid token does not verify an email', async ({ page, user }) => {
    db.updateOne('users', { _id: user.id }, {
      $set: { 'emails.0.verified': false },
    });

    await page.goto('/verify-email/not-a-real-token', { waitUntil: 'commit' });
    // Firefox can commit the document before the application bundle exposes
    // Meteor. Wait for the same readiness condition as the auth helpers before
    // inspecting the anonymous session.
    await waitForMeteor(page);

    expect(db.findOne('users', { _id: user.id }).emails[0].verified).toBe(false);
    expect(await page.evaluate(() => Meteor.userId())).toBeNull();
  });
});
