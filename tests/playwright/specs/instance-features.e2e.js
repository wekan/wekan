'use strict';

// #6736: Admin Panel / Settings / Visibility / Features hides a disabled
// feature from everyone's Board View menu, lets a pilot user keep seeing it,
// and is saved by the site admin from the Visibility pane.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, waitForMeteor, navigateInApp } = require('../helpers/auth');

const setting = () => db.findOne('settings', {}, { _id: 1, featureStates: 1, featureApprovalRequired: 1,
  featureKnownKeys: 1, featurePreviewAdmins: 1 });
const restore = saved => db.updateOne('settings', { _id: saved._id }, { $set: {
  featureStates: saved.featureStates || {}, featureApprovalRequired: saved.featureApprovalRequired === true,
  featureKnownKeys: saved.featureKnownKeys || [], featurePreviewAdmins: saved.featurePreviewAdmins === true } });
const openViewMenu = page => page.evaluate(() => Popup.open('boardChangeView')({
  currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} }));

test.describe('Instance features', () => {
  test('a disabled feature is gone from the Board View menu, and a pilot user still sees it', async ({ boardPage: page, user }) => {
    const saved = setting();
    try {
      db.updateOne('settings', { _id: saved._id }, { $set: { featureStates: { 'views-gantt': false } } });
      await openViewMenu(page);
      const popup = page.locator('.js-pop-over');
      await expect(popup.locator('.js-open-table-view')).toBeVisible();
      await expect(popup.locator('.js-open-gantt-view')).toHaveCount(0);
      await expect(popup.locator('.js-open-gantt-frappe-view')).toHaveCount(0);
      await page.evaluate(() => Popup.close());

      // Negative: the same user as a pilot sees the feature again.
      db.updateOne('users', { _id: user.id }, { $set: { featurePreview: true } });
      await openViewMenu(page);
      await expect(page.locator('.js-pop-over .js-open-gantt-view')).toBeVisible();
    } finally {
      db.updateOne('users', { _id: user.id }, { $unset: { featurePreview: '' } });
      restore(saved);
    }
  });

  test('the site admin saves the features from Visibility', async ({ page, adminUser }) => {
    const saved = setting();
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);
      await navigateInApp(page, '/admin/settings/visibility');
      await waitForMeteor(page);
      const row = page.locator('.js-feature-row[data-feature="views-map"]');
      await expect(row).toBeVisible();
      await expect(page.locator('.js-feature-row')).toHaveCount(8);
      await row.locator('a.js-toggle-feature').click();
      await page.locator('#feature-approval-required').click();
      await page.locator('button.js-visibility-features-save').click();
      await expect(page.locator('.js-visibility-features-status')).not.toBeEmpty();
      await expect.poll(() => setting().featureStates?.['views-map']).toBe(false);
      expect(setting().featureApprovalRequired).toBe(!saved.featureApprovalRequired);
    } finally {
      restore(saved);
    }
  });

  test('an ordinary member does not see the Features group', async ({ loggedInPage: page }) => {
    await navigateInApp(page, '/admin/settings/visibility');
    await waitForMeteor(page);
    await expect(page.locator('.js-feature-row')).toHaveCount(0);
  });
});
