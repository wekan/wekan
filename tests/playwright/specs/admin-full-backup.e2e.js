'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');
const fs = require('node:fs');
const path = require('node:path');
const { ADMIN_PAGES, ADMIN_PANE_TITLES } = require('../../../models/lib/adminUrls');
const { inspectInstanceBackup } = require('../../../server/lib/fullBackup');

const en = require('../../../imports/i18n/data/en.i18n.json');

const filesRoot = process.env.WEKAN_BACKUP_TEST_FILES_ROOT;
test.describe('Admin Panel implemented features', () => {
  test.use({ storageState: undefined });
  test('a saved schedule runs a full backup and restores readable files', async ({ page, adminUser }) => {
    test.skip(!filesRoot, 'Requires an isolated server with WEKAN_BACKUP_TEST_FILES_ROOT');
    test.setTimeout(180000);
    const suffix = db.uniqueSuffix().replace(/[^a-zA-Z0-9]/g, '').slice(-20);
    const board = db.seedBoard({ ownerId: adminUser.id, cardTitlesPerList: [['Backup card']] });
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Backup card' });
    const ids = [];
    for (const coll of ['attachments', 'avatars']) {
      const id = coll.slice(0, 2) + suffix; ids.push([coll, id]);
      const file = path.join(filesRoot, coll, id + '.txt');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `backup bytes for ${coll}`);
      const info = { path: file, size: fs.statSync(file).size, type: 'text/plain',
        extension: 'txt', storage: 'fs' };
      db.insertOne(coll, { _id: id, name: id + '.txt', userId: adminUser.id,
        ...info, _storagePath: path.dirname(file), versions: { original: info },
        meta: { boardId: board.boardId, cardId } });
    }
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/attachments/backup');
    await expect(page.locator('.js-save-backup-schedule')).toBeVisible();
    // Confirm an unselected option survives reopening before enabling a full job.
    await page.locator('.js-backup-avatars').click();
    await page.locator('.js-save-backup-schedule').click();
    await expect.poll(() => db.findOne('backupSettings', { _id: 'schedule' })?.avatars).toBe(false);
    await page.reload(); await waitForMeteor(page);
    await expect(page.locator('.js-backup-avatars')).not.toHaveClass(/is-checked/);
    await page.locator('.js-backup-avatars').click();
    // The real timer must run: do not call runBackup or its internal callback.
    const runtime = await page.evaluate(() => Meteor.callAsync('backupStatus'));
    expect(runtime.schedulerRunning).toBe(true);
    const due = new Date(new Date(runtime.serverTime).getTime() + 65000);
    const hhmm = new Intl.DateTimeFormat('en-GB', { timeZone: runtime.timezone,
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(due);
    await page.locator('.js-backup-frequency').selectOption('daily');
    await page.locator('.js-backup-time').fill(hhmm);
    await page.locator('.js-save-backup-schedule').click();
    await expect.poll(() => db.findOne('backupSettings', { _id: 'schedule' })?.enabled).toBe(true);
    const timing = await page.evaluate(() => Meteor.callAsync('backupStatus'));
    const delay = new Date(timing.nextRunAt).getTime() - new Date(timing.serverTime).getTime();
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBeLessThan(70000);
    const backups = () => page.evaluate(() => Meteor.callAsync('listBackups'));
    await expect.poll(async () => (await backups()).length, { timeout: 100000, intervals: [1000] }).toBeGreaterThan(0);
    const [backup] = await backups();
    const inspected = await inspectInstanceBackup(backup.path);
    expect(inspected.manifest.collections.some(c => c.name === 'users')).toBe(true);
    expect(inspected.manifest.collections.some(c => c.name === 'attachments')).toBe(true);
    expect(inspected.manifest.collections.some(c => c.name === 'avatars')).toBe(true);
    for (const [coll, id] of ids) {
      const doc = db.findOne(coll, { _id: id });
      fs.unlinkSync(doc.path);
      db.deleteMany(coll, { _id: id });
    }
    await page.locator('.js-list-backups').click();
    await page.locator('.js-backup-select').first().check();
    await page.locator('.js-restore-mode').selectOption('replace-all');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('.js-restore-backup').click();
    await expect.poll(async () => page.evaluate(() => Meteor.callAsync('backupStatus')), {
      timeout: 30000,
    }).toMatchObject({ phase: 'completed', success: true, running: false });
    // Meteor-Files authenticates downloads with the active DDP session id.
    const mtok = await page.evaluate(() => Meteor.connection._lastSessionId);
    expect(mtok).toBeTruthy();
    for (const [coll, id] of ids) {
      const doc = db.findOne(coll, { _id: id });
      expect(fs.readFileSync(doc.path, 'utf8')).toBe(`backup bytes for ${coll}`);
      const url = `/cdn/storage/${coll}/${id}/original/${id}.txt`;
      const response = await page.request.get(url, { headers: { 'x-mtok': mtok } });
      expect(response.status(), url).toBe(200);
      expect(await response.text()).toBe(`backup bytes for ${coll}`);
    }
    await page.locator('.js-backup-frequency').selectOption('off');
    await page.locator('.js-save-backup-schedule').click();
    await expect.poll(() => db.findOne('backupSettings', { _id: 'schedule' })?.enabled).toBe(false);
    for (const [coll, id] of ids) db.deleteMany(coll, { _id: id });
    db.cleanup({ boardIds: [board.boardId] });
  });

  test('all Admin Panel pane routes render without client exceptions', async ({ page, adminUser }) => {
    test.setTimeout(180000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await loginWithToken(page, adminUser.id, adminUser.token);
    for (const [tab, config] of Object.entries(ADMIN_PAGES)) {
      for (const slug of Object.keys(config.panes)) {
        await test.step(`${tab}/${slug}`, async () => {
          await navigateInApp(page, `${config.base}/${slug}`);
          await expect(page).toHaveURL(new RegExp(`${config.base}/${slug}$`));
          const title = ADMIN_PANE_TITLES[tab][slug];
          await expect(page.locator('.admin-pane-title').first()).toContainText(title.title || en[title.titleKey]);
          await expect(page.locator('.main-body').first()).toBeVisible();
          await expect(page.locator('body')).not.toContainText('Internal server error');
          expect(errors, `${tab}/${slug}`).toEqual([]);
        });
      }
    }
  });

  test('ordinary members cannot run, restore or schedule instance backups', async ({ page, user }) => {
    await loginWithToken(page, user.id, user.token);
    const errors = await page.evaluate(async () => {
      const full = { attachments: true, avatars: true, data: true };
      const requests = [['runBackup', full, 'filesystem', null],
        ['saveBackupSchedule', { ...full, enabled: true, frequency: 'daily', time: '04:00',
          dayOfWeek: 'Monday', dayOfMonth: 1, storage: 'filesystem' }],
        ['restoreBackup', '/not-a-backup.zip', 'replace-all'], ['listBackups']];
      const result = [];
      for (const [method, ...args] of requests) {
        try { await Meteor.callAsync(method, ...args); result.push('allowed'); }
        catch (error) { result.push(error.error); }
      }
      return result;
    });
    expect(errors).toEqual(Array(4).fill('not-authorized'));
  });
});
