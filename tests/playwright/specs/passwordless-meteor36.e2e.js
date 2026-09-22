'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { waitForMeteor } = require('../helpers/auth');

test('closed registration rejects a new passwordless account before sending a code', async ({ page }) => {
  const setting = db.findOne('settings', {});
  const before = {
    disableRegistration: setting.disableRegistration,
    passwordlessEnabled: setting.passwordlessEnabled,
  };
  const email = `passwordless-${db.uid('closed')}@example.invalid`;
  try {
    db.updateOne('settings', { _id: setting._id },
      { $set: { disableRegistration: true, passwordlessEnabled: true } });
    await page.goto('/sign-in');
    await waitForMeteor(page);
    await expect.poll(() => page.evaluate(async () =>
      (await window.Meteor.callAsync('getAuthenticationsEnabled')).passwordless)).toBe(true);
    const result = await page.evaluate(async address => {
      try {
        await window.Meteor.callAsync('requestLoginTokenForUser', {
          selector: { email: address }, userData: { email: address, passwordless: true },
          options: { userCreationDisabled: false },
        });
        return { code: 'accepted' };
      } catch (error) { return { code: error.error, reason: error.reason }; }
    }, email);
    expect(result.code).toBe(403);
    expect(result.reason).toMatch(/check your credentials/i);
    expect(db.findOne('users', { 'emails.address': email })).toBeNull();
  } finally {
    db.updateOne('settings', { _id: setting._id }, { $set: before });
  }
});
