'use strict';

// #6837 (decided 2026-11-18): feature profiles. A profile hides the features it
// names from the users, teams and organizations it is assigned to, and tells
// the user so in the member menu; a user with no profile sees everything.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, waitForMeteor, navigateInApp } = require('../helpers/auth');

const setting = () => db.findOne('settings', {}, { _id: 1, featureProfiles: 1 });
const restore = saved => db.updateOne('settings', { _id: saved._id }, { $set: { featureProfiles: saved.featureProfiles || [] } });
const openViewMenu = page => page.evaluate(() => Popup.open('boardChangeView')({
  currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} }));
const profile = extra => ({ _id: 'e2eProfile', name: 'Starter', hidden: ['views-gantt'], teamIds: [], orgIds: [], ...extra });

test.describe('Feature profiles', () => {
  test('a user\'s profile hides its features and says so; nobody else is affected', async ({ boardPage: page, user }) => {
    const saved = setting();
    try {
      db.updateOne('settings', { _id: saved._id }, { $set: { featureProfiles: [profile()] } });
      // Negative first: no profile assigned, everything is there and nothing is said.
      await openViewMenu(page);
      await expect(page.locator('.js-pop-over .js-open-gantt-view')).toBeVisible();
      await page.evaluate(() => Popup.close());
      await page.locator('.js-open-header-member-menu').first().click();
      await expect(page.locator('.feature-profile-notice')).toHaveCount(0);
      await page.evaluate(() => Popup.close());

      db.updateOne('users', { _id: user.id }, { $set: { featureProfileId: 'e2eProfile' } });
      await openViewMenu(page);
      await expect(page.locator('.js-pop-over .js-open-table-view')).toBeVisible();
      await expect(page.locator('.js-pop-over .js-open-gantt-view')).toHaveCount(0);
      await page.evaluate(() => Popup.close());
      await page.locator('.js-open-header-member-menu').first().click();
      await expect(page.locator('.feature-profile-notice')).toContainText('Starter');
    } finally {
      db.updateOne('users', { _id: user.id }, { $unset: { featureProfileId: '' } });
      restore(saved);
    }
  });

  test('a profile assigned to a team applies to its members', async ({ boardPage: page, user }) => {
    const saved = setting();
    const original = db.findOne('users', { _id: user.id }, { teams: 1 }).teams || [];
    try {
      db.updateOne('settings', { _id: saved._id }, { $set: { featureProfiles: [profile({ teamIds: ['e2eTeam'] })] } });
      db.updateOne('users', { _id: user.id }, { $set: { teams: [{ teamId: 'e2eTeam', teamDisplayName: 'E2E Team' }] } });
      await openViewMenu(page);
      await expect(page.locator('.js-pop-over .js-open-gantt-view')).toHaveCount(0);
    } finally {
      db.updateOne('users', { _id: user.id }, { $set: { teams: original } });
      restore(saved);
    }
  });

  test('the site admin creates a profile and assigns it from Visibility', async ({ page, adminUser, user }) => {
    const saved = setting();
    try {
      db.updateOne('settings', { _id: saved._id }, { $set: { featureProfiles: [] } });
      await loginWithToken(page, adminUser.id, adminUser.token);
      await navigateInApp(page, '/admin/settings/visibility');
      await waitForMeteor(page);
      await page.locator('button.js-feature-profile-add').click();
      const row = page.locator('.js-feature-profile').first();
      await row.locator('.js-feature-profile-name').fill('Newcomers');
      await row.locator('.js-feature-profile-hide[data-feature="views-map"]').click();
      await row.locator('.js-feature-profile-users').fill(user.username);
      await page.locator('button.js-feature-profiles-save').click();
      await expect(page.locator('.js-feature-profiles-status')).not.toBeEmpty();
      await expect.poll(() => (setting().featureProfiles || []).map(p => [p.name, p.hidden])).toEqual([['Newcomers', ['views-map']]]);
      const id = setting().featureProfiles[0]._id;
      expect(db.findOne('users', { _id: user.id }, { featureProfileId: 1 }).featureProfileId).toBe(id);
      // Negative: an unknown username is reported, not silently dropped.
      await page.locator('.js-feature-profile-users').first().fill(`${user.username}, nobody-${Date.now()}`);
      await page.locator('button.js-feature-profiles-save').click();
      await expect(page.locator('.js-feature-profiles-status')).toContainText('nobody-');
    } finally {
      db.updateOne('users', { _id: user.id }, { $unset: { featureProfileId: '' } });
      restore(saved);
    }
  });
});
