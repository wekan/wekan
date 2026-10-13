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

test('Corsican default storage describes newly uploaded attachments', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, '/admin/attachments/default-save-storage');
  const pane = page.locator('#attachment-default-storage-setting');
  await expect(pane.locator('.description')).toHaveText(strings['default-save-storage-description']);
  await expect(pane.locator('.description')).toContainText('novi appicci caricati');
  await expect(pane.locator('.description')).not.toContainText('allegati');
  await expect(pane.locator('.js-default-save-storage')).toBeVisible();
  await expect(pane.locator('.js-default-save-storage')).not.toContainText('In corsu:');
});

test('Corsican database migration help preserves prerequisites and literal commands', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, '/admin/attachments/database-migration');
  const description = page.getByText(strings['database-migration-description'], { exact: true });
  await expect(description).toBeVisible();
  for (const text of ['fora di l’appicci è di l’avatar', 'in funzione è accessibile', 'WEKAN_FERRETDB_URL', 'WEKAN_MONGODB_URL', 'snap set wekan database=ferretdb']) {
    await expect(description).toContainText(text);
  }
  await expect(description).not.toContainText('tutto tranne');
});

test('Corsican cloud help retains credential alternatives and provider menu labels', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, '/admin/attachments/gcs');
  for (const key of ['gcs-key-filename-description', 'gcs-credentials-description', 'gcs-permissions-note']) {
    const description = page.getByText(strings[key], { exact: true });
    await expect(description).toBeVisible();
    await expect(description).not.toContainText('Facoltativo');
  }
  await expect(page.getByText(strings['gcs-credentials-description'], { exact: true })).toContainText('Lasciate viotu');
  const permissions = page.getByText(strings['gcs-permissions-note'], { exact: true });
  await expect(permissions).toContainText('client_email');
  await expect(permissions).toContainText('Storage Object Admin');
});
