'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('Profile email', () => {
  test('#2445 account without emails can save its first address', async ({ page, user, user2 }) => {
    const address = `sandstorm-${user.id}@wekan-test.invalid`;
    db.updateOne('users', { _id: user.id }, { $unset: { emails: '' } });
    db.updateOne(
      'accountSettings',
      { _id: 'accounts-allowEmailChange' },
      { $set: { booleanValue: true } },
    );

    try {
      await loginWithToken(page, user.id, user.token);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.locator('.js-open-header-member-menu').click();
      await page.locator('.js-pop-over .js-edit-profile').click();

      const popup = page.locator('.js-pop-over');
      const email = popup.locator('.js-profile-email');
      await expect(email).toBeEditable();
      await expect(email).toHaveValue('');
      await email.fill(address);
      await popup.locator('input[type="submit"]').click();

      await expect.poll(() =>
        db.findOne('users', { _id: user.id })?.emails?.[0]?.address,
      ).toBe(address);
      expect(db.findOne('users', { _id: user.id }).emails[0].verified).toBe(false);

      const crossUserError = await page.evaluate(async targetId => {
        try {
          await Meteor.callAsync(
            'setEmail',
            'forbidden-cross-user@wekan-test.invalid',
            targetId,
          );
          return null;
        } catch (error) {
          return error.error;
        }
      }, user2.id);
      expect(crossUserError).toBe('not-authorized');

      db.updateOne(
        'accountSettings',
        { _id: 'accounts-allowEmailChange' },
        { $set: { booleanValue: false } },
      );
      const disabledError = await page.evaluate(async userId => {
        try {
          await Meteor.callAsync(
            'setEmail',
            'forbidden-disabled@wekan-test.invalid',
            userId,
          );
          return null;
        } catch (error) {
          return error.error;
        }
      }, user.id);
      expect(disabledError).toBe('not-authorized');
    } finally {
      db.updateOne(
        'accountSettings',
        { _id: 'accounts-allowEmailChange' },
        { $set: { booleanValue: false } },
      );
    }
  });
});
