'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('Default storage and limits match at the same Attachments URLs', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4attach${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const original = db.findOne('attachmentStorageSettings', {}) || null;
  const originalFilesystemRead = original?.storageConfig?.filesystem?.read !== false;
  const originalGridfsRead = original?.storageConfig?.gridfs?.read !== false;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    db.updateOne('users', { _id: user._id }, { $set: { isAdmin: true,
      loginDisabled: false, 'profile.language': 'en' } });

    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/attachments/backup"] input[type="submit"]').click()]);
    await expect(legacy.locator('form:has(input[name="legacyOperation"][value="run-backup"])'))
      .toBeVisible();
    await expect(legacy.locator('form:has(input[name="legacyOperation"][value="save-backup-schedule"])'))
      .toBeVisible();
    let form = legacy.locator('form:has(input[name="legacyOperation"][value="list-backups"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await legacy.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html4-backup.png`, fullPage: true });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/attachments/default-save-storage"] input[type="submit"]').click()]);
    await expect(legacy.locator('h1')).toContainText('Default');
    form = legacy.locator('form:has(input[name="legacyOperation"][value="set-default-attachment-storage"])');
    await form.locator('select[name="storageName"]').selectOption('gridfs');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('attachmentStorageSettings', {})?.defaultStorage)
      .toBe('gridfs');

    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/attachments/limits"] input[type="submit"]').first().click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="save-attachment-transfer-limits"])');
    await form.locator('select[name="attachmentsUploadMaxBytesMode"]').selectOption('max-size');
    await form.locator('input[name="attachmentsUploadMaxBytesValue"]').fill('3');
    await form.locator('select[name="attachmentsUploadMaxBytesUnit"]').selectOption('mb');
    await form.locator('select[name="attachmentsDownloadMaxBytesMode"]').selectOption('blocked');
    await form.locator('input[name="avatarsUploadBlocked"]').check();
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('attachmentStorageSettings', {})?.limitSettings)
      .toMatchObject({ attachmentsUploadMaxBytes: 3 * 1024 * 1024,
        attachmentsUploadBlocked: false, attachmentsDownloadMaxBytes: 0,
        attachmentsDownloadBlocked: true, avatarsUploadBlocked: true });

    fs.mkdirSync(`${process.cwd()}/../../.tools/html4-admin-attachments-core`, { recursive: true });
    await legacy.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html4-limits.png`, fullPage: true });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/attachments/move"] input[type="submit"]').first().click()]);
    await expect(legacy.locator('form:has(input[name="legacyOperation"][value="start-attachment-move"])'))
      .toBeVisible();
    await expect(legacy.locator('form:has(input[name="legacyOperation"][value="repair-attachment-locations"]) input[type="submit"]'))
      .toBeVisible();
    await legacy.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html4-move.png`, fullPage: true });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/attachments/filesystem"] input[type="submit"]').first().click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="set-local-storage-read"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('attachmentStorageSettings', {})
      ?.storageConfig?.filesystem?.read).toBe(!originalFilesystemRead);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="calculate-local-storage-stats"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('body')).toContainText(/writable path/i);
    await legacy.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html4-filesystem.png`, fullPage: true });

    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/attachments/gridfs"] input[type="submit"]').first().click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="set-local-storage-read"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('attachmentStorageSettings', {})
      ?.storageConfig?.gridfs?.read).toBe(!originalGridfsRead);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="calculate-local-storage-stats"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('form:has(input[name="legacyOperation"][value="compact-gridfs"]) input[type="submit"]'))
      .toBeVisible();
    await legacy.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html4-gridfs.png`, fullPage: true });

    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/attachments/s3"] input[type="submit"]').first().click()]);
    form = legacy.locator('fieldset:has(button[value="save-cloud-storage"])').locator('..');
    await form.locator('input[name="enabled"]').uncheck();
    await form.locator('input[name="read"]').check();
    await form.locator('input[name="region"]').fill('html4-region');
    await form.locator('input[name="bucket"]').fill(`html4-s3-${suffix}`);
    await Promise.all([legacy.waitForNavigation(), form.locator('button[value="save-cloud-storage"]').click()]);
    await expect.poll(() => db.findOne('attachmentStorageSettings', {})
      ?.storageConfig?.s3?.bucket).toBe(`html4-s3-${suffix}`);
    await expect(legacy.locator('button[value="test-cloud-storage"]')).toBeVisible();
    await legacy.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html4-s3.png`, fullPage: true });

    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/attachments/azure"] input[type="submit"]').first().click()]);
    form = legacy.locator('fieldset:has(button[value="save-cloud-storage"])').locator('..');
    await form.locator('input[name="enabled"]').uncheck();
    await form.locator('input[name="read"]').check();
    await form.locator('input[name="accountName"]').fill(`html4azure${suffix}`);
    await form.locator('input[name="bucket"]').fill(`html4-azure-${suffix}`);
    await Promise.all([legacy.waitForNavigation(), form.locator('button[value="save-cloud-storage"]').click()]);
    await expect.poll(() => db.findOne('attachmentStorageSettings', {})
      ?.storageConfig?.azure?.bucket).toBe(`html4-azure-${suffix}`);
    await legacy.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html4-azure.png`, fullPage: true });

    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/attachments/gcs"] input[type="submit"]').first().click()]);
    form = legacy.locator('fieldset:has(button[value="save-cloud-storage"])').locator('..');
    await form.locator('input[name="enabled"]').uncheck();
    await form.locator('input[name="read"]').check();
    await form.locator('input[name="projectId"]').fill(`html4-project-${suffix}`);
    await form.locator('input[name="bucket"]').fill(`html4-gcs-${suffix}`);
    await Promise.all([legacy.waitForNavigation(), form.locator('button[value="save-cloud-storage"]').click()]);
    await expect.poll(() => db.findOne('attachmentStorageSettings', {})
      ?.storageConfig?.gcs?.bucket).toBe(`html4-gcs-${suffix}`);
    await legacy.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html4-gcs.png`, fullPage: true });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/attachments/database-migration"] input[type="submit"]').first().click()]);
    await expect(legacy.locator('form:has(input[name="direction"][value="toFerretDB"]) input[type="submit"]'))
      .toBeVisible();
    await expect(legacy.locator('form:has(input[name="direction"][value="toMongoDB"]) input[type="submit"]'))
      .toBeVisible();
    await legacy.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html4-database-migration.png`, fullPage: true });

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/admin/attachments/backup');
    await waitForMeteor(modern);
    await expect(modern.locator('.js-run-backup')).toBeVisible();
    await expect(modern.locator('.js-save-backup-schedule')).toBeVisible();
    await expect(modern.locator('.js-list-backups')).toBeVisible();
    await modern.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html5-backup.png`, fullPage: true });
    await navigateInApp(modern, '/admin/attachments/limits');
    await waitForMeteor(modern);
    await expect(modern.locator('#attachment-limits-setting')).toBeVisible();
    await expect(modern.locator('.js-avatars-upload-blocked')).toHaveClass(/is-checked/);
    await expect(modern.locator('select.js-attachment-limit-mode[data-field="attachmentsDownloadMaxBytes"]'))
      .toHaveValue('blocked');
    await modern.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html5-limits.png`, fullPage: true });
    await navigateInApp(modern, '/admin/attachments/move');
    await expect(modern.locator('.move-storage-form')).toBeVisible();
    await modern.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html5-move.png`, fullPage: true });
    await navigateInApp(modern, '/admin/attachments/filesystem');
    await expect(modern.locator('#filesystem-read')).toHaveClass(
      originalFilesystemRead ? /^(?!.*is-checked).*$/ : /is-checked/,
    );
    await modern.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html5-filesystem.png`, fullPage: true });
    await navigateInApp(modern, '/admin/attachments/gridfs');
    await expect(modern.locator('#gridfs-read')).toHaveClass(
      originalGridfsRead ? /^(?!.*is-checked).*$/ : /is-checked/,
    );
    await expect(modern.locator('.js-compact-mongodb-gridfs')).toBeVisible();
    await modern.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html5-gridfs.png`, fullPage: true });
    await navigateInApp(modern, '/admin/attachments/s3');
    await expect(modern.locator('#s3-bucket')).toHaveValue(`html4-s3-${suffix}`);
    await modern.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html5-s3.png`, fullPage: true });
    await navigateInApp(modern, '/admin/attachments/azure');
    await expect(modern.locator('#azure-bucket')).toHaveValue(`html4-azure-${suffix}`);
    await modern.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html5-azure.png`, fullPage: true });
    await navigateInApp(modern, '/admin/attachments/gcs');
    await expect(modern.locator('#gcs-bucket')).toHaveValue(`html4-gcs-${suffix}`);
    await modern.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html5-gcs.png`, fullPage: true });
    await navigateInApp(modern, '/admin/attachments/database-migration');
    await expect(modern.locator('.js-migrate-to-ferretdb')).toBeVisible();
    await expect(modern.locator('.js-migrate-to-mongodb')).toBeVisible();
    await modern.screenshot({ path: `${process.cwd()}/../../.tools/html4-admin-attachments-core/html5-database-migration.png`, fullPage: true });

    db.updateOne('users', { _id: user._id }, { $set: { isAdmin: false } });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/attachments/limits"] input[type="submit"]').first().click()]);
    await expect(legacy.locator('body')).toContainText(/not authorized/i);
    await expect(legacy.locator('input[name="attachmentsUploadMaxBytesValue"]')).toHaveCount(0);
  } finally {
    if (original) {
      const { _id, ...fields } = original;
      db.updateOne('attachmentStorageSettings', { _id }, { $set: fields });
    }
    if (user) db.deleteOne('users', { _id: user._id });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
  }
});
