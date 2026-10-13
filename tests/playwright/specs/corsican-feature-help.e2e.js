'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const strings = require('../../../imports/i18n/data/co.i18n.json');

test('Corsican performance help explains automatic loading and environment overrides', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, '/admin/problems/performance');
  const description = page.getByText(strings['cards-loading-description'], { exact: true });
  await expect(description).toBeVisible();
  await expect(description).toContainText('Ùn ci hè nunda da cunfigurà');
  await expect(description).toContainText('CARDS_LOADING_LAZY_THRESHOLD');
  await expect(description).not.toContainText('Come ogni tavula');
});

test('Corsican security help preserves source identity removal and literal markup examples', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, '/admin/problems/security');
  for (const key of ['anonymize-import-users-description', 'anonymize-export-users-description', 'render-links-as-plain-text-description', 'always-show-code-as-text-description']) {
    const description = page.getByText(strings[key], { exact: true });
    await expect(description).toBeVisible();
    await expect(description).not.toContainText('Se abilitato');
  }
  await expect(page.getByText(strings['always-show-code-as-text-description'], { exact: true })).toContainText('<!-- -->');
  await expect(page.getByText(strings['anonymize-import-users-description'], { exact: true })).toContainText('@username');
});
