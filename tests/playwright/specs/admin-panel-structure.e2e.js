'use strict';
// 2026-11-19: the Admin Panel restructure. Old addresses redirect to the pane
// that now holds their settings, each new Settings pane shows its own groups,
// and Appearance no longer shows the feature switches.
const { test, expect } = require('../fixtures');
const { loginWithToken, waitForMeteor, navigateInApp } = require('../helpers/auth');

test('old addresses land on the pane that now holds the settings', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  for (const [from, to, marker] of [
    ['/admin/settings/visibility', '/admin/settings/appearance', '#global-date-format'],
    ['/admin/problems/security', '/admin/settings/security', '.js-toggle-render-links-as-plain-text'],
    ['/admin/problems/delete', '/admin/settings/delete', '.js-toggle-enable-permanent-delete'],
    ['/admin/problems/notifications', '/admin/settings/activities', '.js-toggle-disable-activities'],
  ]) {
    await navigateInApp(page, from);
    await waitForMeteor(page);
    await expect(page).toHaveURL(new RegExp(`${to}$`));
    await expect(page.locator(marker).first()).toBeVisible();
  }
});

test('each Settings pane shows its own groups, and Appearance has no feature switches', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/settings/features');
  await waitForMeteor(page);
  await expect(page.locator('.js-feature-row').first()).toBeVisible();
  await expect(page.locator('.js-feature-profile-add')).toHaveCount(0);
  await navigateInApp(page, '/admin/settings/feature-profiles');
  await expect(page.locator('.js-feature-profile-add')).toBeVisible();
  await expect(page.locator('.js-feature-row')).toHaveCount(0);
  // Negative: Appearance is how WeKan looks - no feature switches there.
  await navigateInApp(page, '/admin/settings/appearance');
  await expect(page.locator('#global-date-format')).toBeVisible();
  await expect(page.locator('.js-feature-row')).toHaveCount(0);
  await expect(page.locator('.js-feature-profile-add')).toHaveCount(0);
  // And Problems no longer lists the settings that moved.
  await navigateInApp(page, '/admin/problems/summary');
  await waitForMeteor(page);
  await expect(page.locator('.js-left-menu-item[data-id="features-security"]')).toHaveCount(0);
});
