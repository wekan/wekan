'use strict';
// P3 (docs/Compliance/README.md): BACKUP_PASSPHRASE, against a live server.
// An Admin Panel backup is written encrypted (server/lib/backupEncryption.js)
// - nothing of the plain archive on disk - and restores ("add missing", so the
// test database is not replaced) from the encrypted file. Skipped when the
// server runs without the passphrase.
const fs = require('node:fs');
const { test, expect } = require('../fixtures');
const { loginWithToken } = require('../helpers/auth');

const call = (page, name, ...args) => page.evaluate(([n, a]) => Meteor.callAsync(n, ...a), [name, args]);

test('an encrypted backup is written, and restores', async ({ page, adminUser }) => {
  test.setTimeout(240_000);
  test.skip(!process.env.WEKAN_TEST_BACKUP_PASSPHRASE, 'the server runs without BACKUP_PASSPHRASE');
  await loginWithToken(page, adminUser.id, adminUser.token);
  const before = (await call(page, 'listBackups')).map(b => b.path);
  await expect.poll(async () => (await call(page, 'backupStatus')).running, { timeout: 60_000 }).toBeFalsy();
  await call(page, 'runBackup', { data: true, attachments: false, avatars: false }, 'filesystem');
  await expect.poll(async () => (await call(page, 'listBackups')).map(b => b.path).filter(p => !before.includes(p)).length,
    { timeout: 180_000, intervals: [2000] }).toBeGreaterThan(0);
  const made = (await call(page, 'listBackups')).map(b => b.path).find(p => !before.includes(p));
  await expect.poll(async () => (await call(page, 'backupStatus')).running, { timeout: 120_000 }).toBeFalsy();
  const head = Buffer.alloc(7);
  const fd = fs.openSync(made, 'r');
  fs.readSync(fd, head, 0, 7, 0);
  fs.closeSync(fd);
  expect(head.toString()).toBe('WKBAK1\n');
  expect(fs.readFileSync(made).includes(Buffer.from('PK\u0003\u0004')), 'no ZIP header in the clear').toBe(false);

  await call(page, 'restoreBackup', made, 'add-missing');
  await expect.poll(async () => (await call(page, 'backupStatus')).running, { timeout: 180_000, intervals: [2000] }).toBeFalsy();
  const status = await call(page, 'backupStatus');
  expect(status.success, status.error).toBe(true);
  expect(fs.readdirSync(require('node:path').dirname(made)).filter(f => f.includes('.decrypted-')), 'the decrypted copy is gone').toEqual([]);
});
