'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Latin storage settings explain repair and the default destination', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/admin/attachments/move');
  const repair = page.locator('.move-repair-section');
  await expect(repair.locator('h4')).toHaveText('Corrige locos fasciculorum');
  await expect(repair.locator('.description')).toContainText('verum locum indicet');
  await expect(repair).not.toContainText('Latine:');
  await expect(repair.locator('button')).toHaveText('Corrige locos fasciculorum');
  await navigateInApp(page, '/admin/attachments/default-save-storage');
  await expect(page.locator('#attachment-default-storage-setting .description')).toHaveText('Elige repositorium in quo adiuncta nuper immissa serventur.');
  await expect(page.locator('.js-default-save-storage')).toBeVisible();
});

test('Latin maintenance pane retains the compact operation warnings', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/admin/attachments/gridfs');
  const panel = page.locator('.compact-block');
  await expect(panel.locator('h4')).toHaveText('MongoDB Compact');
  await expect(panel).toContainText('tantum postquam translationes fasciculorum in massa perfectae sunt');
  await expect(panel.locator('.text-muted')).toContainText('secundaria primum sponte comprimuntur, deinde primarium');
  await expect(panel.locator('.text-muted')).toContainText('solum primarium comprimitur');
  await expect(panel).not.toContainText('Latine:');
  await expect(panel.locator('button')).toHaveText('Exsequere MongoDB Compact');
});

test('Latin Azure settings explain the optional connection string', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/admin/attachments/azure');
  const field = page.locator('.form-group').filter({ has: page.locator('#azure-connection-string') });
  await expect(field.locator('.cloud-input-label-tr')).toHaveText('Series connexionis');
  await expect(field).toContainText('Ad libitum: utere integra serie connexionis loco nominis et clavis rationis.');
  await expect(field.locator('.cloud-input-label-tr')).not.toContainText('Latine:');
  await expect(field.locator('input')).toHaveAttribute('type', 'password');
  await expect(field.locator('.cloud-input-path').last()).toContainText('ratio tua → Security + networking → Access keys → key1 → Connection string → Show.');
});

test('Latin database migration pane preserves prerequisites and connection instructions', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/admin/attachments/database-migration');
  const description = page.locator('.description').filter({ hasText: 'Migra data textualia' });
  await expect(description).toContainText('currere et adiri posse debet');
  await expect(description).toContainText('mongodb://127.0.0.1:27018');
  await expect(description).toContainText('WEKAN_FERRETDB_URL / WEKAN_MONGODB_URL');
  await expect(description).toContainText('snap set wekan database=ferretdb vel =mongodb');
  await expect(description).not.toContainText('Latine:');
});

test('Latin backup settings distinguish schedule frequencies', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/admin/attachments/backup');
  const frequency = page.locator('.js-backup-frequency');
  await expect(frequency.locator('option[value="daily"]')).toHaveText('Cotidie');
  await expect(frequency.locator('option[value="weekly"]')).toHaveText('Quaque hebdomade');
  await expect(frequency.locator('option[value="monthly"]')).toHaveText('Quoque mense');
  await expect(frequency.locator('option[value="off"]')).toHaveText('Inactiva');
  await expect(page.locator('.js-backup-time')).toHaveAttribute('type', 'time');
});

test('Latin S3 settings distinguish access keys from secret keys', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/admin/attachments/s3');
  const access = page.locator('.form-group').filter({ has: page.locator('#s3-access-key') });
  const secret = page.locator('.form-group').filter({ has: page.locator('#s3-secret-key') });
  await expect(access.locator('.cloud-input-label-tr')).toHaveText('Clavis accessus S3');
  await expect(secret.locator('.cloud-input-label-tr')).toHaveText('Clavis secreta S3');
  await expect(secret.locator('input')).toHaveAttribute('type', 'password');
  const endpoint = page.locator('.form-group').filter({ has: page.locator('#s3-endpoint') });
  await expect(endpoint).toContainText('URL puncti accessus S3 (exempli gratia s3.amazonaws.com vel minio.example.com)');
  await expect(endpoint.locator('.cloud-input-label-tr')).not.toContainText('Latine:');
});

test('Latin filesystem settings label the writable base path', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/admin/attachments/filesystem');
  const field = page.locator('.form-group').filter({ has: page.locator('#filesystem-path') });
  await expect(field.locator('label')).toHaveText('Iter in quo scribere licet');
  await expect(field).toContainText('Iter fundamentale repositorii fasciculorum');
  await expect(field).not.toContainText('Latine:');
  await expect(field.locator('input')).toHaveAttribute('readonly', '');
});
