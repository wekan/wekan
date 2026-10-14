'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const strings = require('../../../imports/i18n/data/co.i18n.json');

for (const language of ['ht', 'co', 'la']) {
const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
test(`Attachment limits preserve transfer directions and unit labels in ${language}`, async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
  await navigateInApp(page, '/admin/attachments/limits');
  const pane = page.locator('#attachment-limits-setting');
  await expect(pane.locator('h3')).toHaveText(strings['attachment-transfer-limits-title']);
  if (language === 'ht') {
    await expect(pane.locator('h3')).toContainText('pyès atache');
    await expect(pane).not.toContainText('pyès jwenn');
  }
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
  await expect(units).not.toContainText(language === 'la' ? 'Latine:' : 'In corsu');
});
}

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


test('Haitian cloud credentials preserve optional authentication choices and permission labels', async ({ page, adminUser }) => {
  const ht = require('../../../imports/i18n/data/ht.i18n.json');
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ht'));
  await navigateInApp(page, '/admin/attachments/gcs');
  for (const key of ['gcs-credentials', 'gcs-credentials-description', 'gcs-permissions-note', 'gcs-key-filename-menu-path']) {
    await expect(page.getByText(ht[key], { exact: true })).toBeVisible();
  }
  const hint = page.getByText(ht['gcs-credentials-description'], { exact: true });
  await expect(hint).toContainText('Kite vid pou itilize fichye kle a');
  await expect(hint).toContainText('enfòmasyon otantifikasyon pa defo');
  await expect(hint).not.toContainText('kalifikasyon');
});

test('Malagasy S3 settings distinguish access and secret keys', async ({ page, adminUser }) => {
  const mg = require('../../../imports/i18n/data/mg.i18n.json');
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'mg'));
  await navigateInApp(page, '/admin/attachments/s3');
  for (const key of ['s3-endpoint', 's3-access-key', 's3-secret-key']) {
    await expect(page.getByText(mg[key], { exact: true })).toBeVisible();
  }
  await expect(page.locator('#s3-secret-key')).toHaveAttribute('type', 'password');
  await expect(page.locator('#s3-access-key')).toHaveAttribute('type', 'text');
});

test('Malagasy cloud credentials distinguish authentication from permissions', async ({ page, adminUser }) => {
  const mg = require('../../../imports/i18n/data/mg.i18n.json');
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'mg'));
  await navigateInApp(page, '/admin/attachments/gcs');
  for (const key of ['gcs-credentials', 'gcs-credentials-description', 'gcs-permissions-note']) {
    await expect(page.getByText(mg[key], { exact: true })).toBeVisible();
  }
  const hint = page.getByText(mg['gcs-credentials-description'], { exact: true });
  await expect(hint).toContainText('Avelao ho banga');
  await expect(hint).toContainText('antsipiriany fanamarinana mahazatra');
  await expect(hint).not.toContainText('fahazoan-dalana');
});

test('Irish S3 settings distinguish access and secret keys', async ({ page, adminUser }) => {
  const mg = require('../../../imports/i18n/data/ga.i18n.json');
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ga'));
  await navigateInApp(page, '/admin/attachments/s3');
  for (const key of ['s3-endpoint', 's3-access-key', 's3-secret-key']) {
    await expect(page.getByText(mg[key], { exact: true })).toBeVisible();
  }
  await expect(page.locator('#s3-secret-key')).toHaveAttribute('type', 'password');
  await expect(page.locator('#s3-access-key')).toHaveAttribute('type', 'text');
});

test('Scottish Gaelic S3 settings distinguish access and secret keys', async ({ page, adminUser }) => {
  const mg = require('../../../imports/i18n/data/gd.i18n.json');
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'gd'));
  await navigateInApp(page, '/admin/attachments/s3');
  for (const key of ['s3-endpoint', 's3-access-key', 's3-secret-key']) {
    await expect(page.getByText(mg[key], { exact: true })).toBeVisible();
  }
  await expect(page.locator('#s3-secret-key')).toHaveAttribute('type', 'password');
  await expect(page.locator('#s3-access-key')).toHaveAttribute('type', 'text');
});
