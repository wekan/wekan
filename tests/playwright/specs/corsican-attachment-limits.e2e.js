'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const strings = require('../../../imports/i18n/data/co.i18n.json');

test('Corsican attachment limits preserve transfer directions and unit labels', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, '/admin/attachments/limits');
  const pane = page.locator('#attachment-limits-setting');
  await expect(pane.locator('h3')).toHaveText(strings['attachment-transfer-limits-title']);
  await expect(pane.locator('.description')).toHaveText(strings['attachment-transfer-limits-description']);
  for (const key of ['attachment-upload-limit-label', 'attachment-download-limit-label', 'api-upload-limit-label', 'api-download-limit-label']) {
    await expect(pane.getByText(strings[key], { exact: true })).toBeVisible();
  }
  const modes = pane.locator('.js-attachment-limit-mode[data-field="attachmentsUploadMaxBytes"]');
  await modes.selectOption('max-size');
  const units = pane.locator('.js-attachment-limit-unit[data-field="attachmentsUploadMaxBytes"]');
  await expect(units).toBeVisible();
  for (const [value, label] of [['gb', 'GB'], ['mb', 'MB'], ['bytes', 'Bytes']]) {
    await expect(units.locator(`option[value="${value}"]`)).toHaveText(label);
  }
  await expect(units).not.toContainText('In corsu');
});
