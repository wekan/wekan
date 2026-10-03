'use strict';
// Admin Panel / Attachments / Continuous backup (docs/Backup/Continuous-Backup.md):
// the pane beside Backup, its settings saved through the server's validation,
// the stream's status and restore points, and the pane and its methods kept
// from anyone but a site administrator.
const fs = require('node:fs');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const en = require('../../../imports/i18n/data/en.i18n.json');

test.describe('Admin Panel continuous backup', () => {
  test.use({ storageState: undefined });

  test('a site administrator saves, runs and lists continuous backup, and a bad target is refused', async ({ page, adminUser }) => {
    test.setTimeout(120000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/attachments/continuous-backup');
    await expect(page.locator('.admin-pane-title').first()).toContainText(en['continuous-backup']);
    await expect(page.locator('#attachment-continuous-backup-setting')).toContainText(en['continuous-backup-description']);
    // The menu entry sits directly after Backup.
    const menu = page.locator('.js-attachments-menu');
    await expect(menu.nth(1)).toContainText(en['continuous-backup']);
    await expect(page.locator('.js-cb-target')).toBeVisible();
    const config = await page.evaluate(() => Meteor.callAsync('continuousBackup.getSettings'));
    const target = `${config.defaults.target}-e2e-${db.uniqueSuffix().replace(/[^a-zA-Z0-9]/g, '')}`;
    try {
      // NEGATIVE: a target inside a directory the stream reads is refused,
      // and the reason is shown.
      await page.locator('.js-cb-target').fill(`${config.paths.filesRoot}/attachments/inside`);
      await page.locator('.js-cb-enabled').click();
      await page.locator('.js-cb-save').click();
      await expect(page.locator('.js-cb-message.text-danger')).toContainText('overlaps');
      expect(db.findOne('continuousBackupSettings', { _id: 'settings' })).toBeFalsy();

      await page.locator('.js-cb-target').fill(target);
      // Files only: the database base of a shared test server is not needed here.
      await page.locator('.js-cb-database').click();
      await page.locator('.js-cb-logs').click();
      await page.locator('.js-cb-save').click();
      await expect(page.locator('.js-cb-message.text-success')).toContainText(en['continuous-backup-saved']);
      await expect.poll(() => db.findOne('continuousBackupSettings', { _id: 'settings' })?.enabled).toBe(true);
      const saved = db.findOne('continuousBackupSettings', { _id: 'settings' });
      expect([saved.target, saved.database, saved.attachments, saved.logs]).toEqual([target, false, true, false]);
      await expect(page.locator('.js-cb-state')).toContainText(en['continuous-backup-running'], { timeout: 15000 });
      expect(fs.existsSync(`${target}/stream.json`)).toBe(true);
      await page.locator('.js-cb-points').click();
      await expect(page.locator('.js-cb-point')).toHaveCount(1);
      await page.locator('.js-cb-point').check();
      await expect(page.locator('.js-cb-until')).not.toHaveValue('');
      // Reopening shows what was saved.
      await page.reload();
      await expect(page.locator('.js-cb-target')).toHaveValue(target);
      await expect(page.locator('.js-cb-database')).not.toHaveClass(/is-checked/);
      await expect(page.locator('.js-cb-enabled')).toHaveClass(/is-checked/);
      // Off again.
      await page.locator('.js-cb-enabled').click();
      await page.locator('.js-cb-save').click();
      await expect(page.locator('.js-cb-state')).toContainText(en['continuous-backup-stopped'], { timeout: 15000 });
      expect(errors).toEqual([]);
    } finally {
      await page.evaluate(settings => Meteor.callAsync('continuousBackup.saveSettings', settings).catch(() => {}),
        { enabled: false, target }).catch(() => {});
      db.deleteMany('continuousBackupSettings', {});
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  test('encryption takes a key file, a short key is refused, and an unconfigured upload is reported', async ({ page, adminUser }) => {
    test.setTimeout(120000);
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/attachments/continuous-backup');
    await expect(page.locator('.js-cb-target')).toBeVisible();
    const config = await page.evaluate(() => Meteor.callAsync('continuousBackup.getSettings'));
    const suffix = db.uniqueSuffix().replace(/[^a-zA-Z0-9]/g, '');
    const target = `${config.defaults.target}-e2e-enc-${suffix}`;
    const keyDir = require('node:path').join(require('node:path').resolve(__dirname, '../../..'), '.tools', 'tmp', `e2e-key-${suffix}`);
    fs.mkdirSync(keyDir, { recursive: true });
    const keyFile = `${keyDir}/backup.key`;
    try {
      await page.locator('.js-cb-target').fill(target);
      await page.locator('.js-cb-enabled').click();
      await page.locator('.js-cb-database').click();
      await page.locator('.js-cb-logs').click();
      await page.locator('.js-cb-encrypt').click();
      await page.locator('.js-cb-encryptionKeyFile').fill(keyFile);
      // NEGATIVE: a key too short to be one is refused, and nothing is saved.
      fs.writeFileSync(keyFile, 'short');
      await page.locator('.js-cb-save').click();
      await expect(page.locator('.js-cb-message.text-danger')).toContainText('at least 16 characters');
      expect(db.findOne('continuousBackupSettings', { _id: 'settings' })).toBeFalsy();
      fs.writeFileSync(keyFile, 'an administrator passphrase for e2e');
      await page.locator('.js-cb-upload').selectOption('gcs');
      await page.locator('.js-cb-save').click();
      await expect(page.locator('.js-cb-message.text-success')).toContainText(en['continuous-backup-saved']);
      const saved = db.findOne('continuousBackupSettings', { _id: 'settings' });
      expect([saved.encrypt, saved.encryptionKeyFile, saved.upload]).toEqual([true, keyFile, 'gcs']);
      const stream = JSON.parse(fs.readFileSync(`${target}/stream.json`, 'utf8'));
      expect(stream.encryption.salt).toMatch(/^[a-f0-9]{32}$/);
      expect(JSON.stringify(stream)).not.toContain('passphrase');
      // GCS is not configured on the test server: the stream runs and says so.
      await expect(page.locator('#attachment-continuous-backup-setting')).toContainText('gcs storage is not configured', { timeout: 15000 });
      await page.locator('.js-cb-fetch').click();
      await expect(page.locator('.js-cb-message.text-danger')).toContainText('not configured');
    } finally {
      await page.evaluate(settings => Meteor.callAsync('continuousBackup.saveSettings', settings).catch(() => {}),
        { enabled: false, target }).catch(() => {});
      db.deleteMany('continuousBackupSettings', {});
      fs.rmSync(target, { recursive: true, force: true });
      fs.rmSync(keyDir, { recursive: true, force: true });
    }
  });

  test('ordinary members see no continuous backup and cannot call it', async ({ page, user }) => {
    await loginWithToken(page, user.id, user.token);
    const results = await page.evaluate(async () => {
      const requests = [['continuousBackup.getSettings'], ['continuousBackup.saveSettings', { enabled: true, target: '/tmp/x' }],
        ['continuousBackup.status'], ['continuousBackup.restorePoints'], ['continuousBackup.fetchFromCloud'],
        ['continuousBackup.restore', { generation: 'x', until: 1, what: 'files', mode: 'replace-all' }]];
      const result = [];
      for (const [method, ...args] of requests) {
        try { await Meteor.callAsync(method, ...args); result.push('allowed'); }
        catch (error) { result.push(error.error); }
      }
      return result;
    });
    expect(results).toEqual(Array(6).fill('not-authorized'));
    await navigateInApp(page, '/admin/attachments/continuous-backup');
    await expect(page.locator('#attachment-continuous-backup-setting')).toHaveCount(0);
  });
});
