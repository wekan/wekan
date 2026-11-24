'use strict';
// ATTACHMENTS_PASSPHRASE (server/lib/attachmentEncryption.js), against a live
// server: an attachment on the disk is encrypted by Admin Panel / Attachments /
// Encrypt and still downloads through the same address - whole, and as a byte
// range - and decrypts back to the same bytes. Skipped without the passphrase.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const call = (page, name, ...args) => page.evaluate(([n, a]) => Meteor.callAsync(n, ...a), [name, args]);
const idle = page => expect.poll(async () => (await call(page, 'attachmentEncryptionStatus')).progress.running,
  { timeout: 60_000, intervals: [500] }).toBe(false);

test('encrypted on the disk, the same address downloads it, whole and in part', async ({ page, adminUser, board }) => {
  test.skip(!process.env.WEKAN_TEST_ATTACHMENTS_PASSPHRASE, 'the server runs without ATTACHMENTS_PASSPHRASE');
  const filesPath = process.env.WEKAN_FILES_PATH;
  test.skip(!filesPath, 'needs the server\'s files directory (WEKAN_FILES_PATH)');
  const id = `enc${Date.now()}`;
  const stored = path.join(filesPath, 'attachments', `${id}.bin`);
  const bytes = crypto.randomBytes(70001);
  fs.mkdirSync(path.dirname(stored), { recursive: true });
  fs.writeFileSync(stored, bytes);
  db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public' } });
  db.insertOne('attachments', {
    _id: id, name: `${id}.bin`, size: bytes.length, type: 'application/octet-stream',
    meta: { boardId: board.boardId, cardId: db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' }) },
    versions: { original: { path: stored, name: `${id}.bin`, size: bytes.length, type: 'application/octet-stream', extension: 'bin', storage: 'fs' } },
  });
  const url = `/cdn/storage/attachments/${id}/original/${id}.bin`;
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    expect(await call(page, 'attachmentEncryptionAvailable')).toBe(true);
    const before = await page.request.get(url);
    expect(before.status()).toBe(200);
    expect(Buffer.from(await before.body()).equals(bytes)).toBe(true);

    await call(page, 'encryptAllAttachments');
    await idle(page);
    expect(fs.readFileSync(stored).subarray(0, 7).toString()).toBe('WKATT1\n');
    expect(fs.readFileSync(stored).includes(bytes.subarray(1000, 1064))).toBe(false);

    const after = await page.request.get(url);
    expect(after.status()).toBe(200);
    expect(Buffer.from(await after.body()).equals(bytes), 'the same address, the same bytes').toBe(true);
    const part = await page.request.get(url, { headers: { Range: 'bytes=17-4112' } });
    expect([200, 206]).toContain(part.status());
    if (part.status() === 206) expect(Buffer.from(await part.body()).equals(bytes.subarray(17, 4113))).toBe(true);
    const status = await call(page, 'attachmentEncryptionStatus');
    expect(status.counts.encrypted).toBeGreaterThanOrEqual(1);

    await call(page, 'decryptAllAttachments');
    await idle(page);
    expect(fs.readFileSync(stored).equals(bytes), 'decrypted back to the same file').toBe(true);
  } finally {
    fs.rmSync(stored, { force: true });
    db.deleteOne('attachments', { _id: id });
  }
});

test('the pane is in the Attachments menu only while the passphrase is set', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  const available = await call(page, 'attachmentEncryptionAvailable');
  await page.goto('/admin/attachments/backup', { waitUntil: 'load' });
  const entry = page.locator('.js-attachments-menu[data-id="encrypt"], .js-attachments-menu:has-text("Encrypt")');
  if (available) await expect(entry.first()).toBeVisible({ timeout: 20_000 });
  else await expect(entry).toHaveCount(0);
});
