'use strict';

// #6898: a file WeKan deletes itself must not be reported by the daily
// file-integrity scan as "missing" forever. Deleting an uploaded avatar from
// the avatar popup goes through Avatars.onAfterRemove, which now forgets that
// file's baseline - and only that file's: an unrelated baseline stays, so a
// file that vanishes some other way is still reported.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
// 1x1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

test('deleting an avatar forgets its integrity baseline and no other', async ({ page, user }) => {
  const unrelated = `/e2e-not-a-real-file-${db.uid('baseline')}`;
  db.insertOne('fileIntegrity', { _id: unrelated, path: unrelated, size: 1, at: new Date() });
  try {
    await loginWithToken(page, user.id, user.token);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.locator('.js-open-header-member-menu').click();
    await page.locator('.js-pop-over .js-change-avatar').click();
    await page.locator('.js-pop-over .js-upload-avatar-input')
      .setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG });

    await expect.poll(() => db.find('avatars', { userId: user.id }).length, { timeout: 30_000 }).toBe(1);
    const avatar = db.find('avatars', { userId: user.id })[0];
    const filePath = avatar.versions?.original?.path;
    test.skip(!filePath, 'avatar storage keeps no local path in this configuration');

    // What the scan would have recorded on its first sight of the file.
    db.deleteOne('fileIntegrity', { _id: filePath });
    db.insertOne('fileIntegrity', { _id: filePath, path: filePath, size: PNG.length, at: new Date() });

    const item = page.locator('.js-pop-over .avatar-list-item').filter({ has: page.locator('.js-delete-avatar') });
    await expect(item).toHaveCount(1);
    await item.locator('.js-delete-avatar').click();
    await page.locator('.js-pop-over button.js-confirm').click();

    await expect.poll(() => db.countDocuments('avatars', { userId: user.id }), { timeout: 15_000 }).toBe(0);
    await expect.poll(() => db.countDocuments('fileIntegrity', { _id: filePath }), { timeout: 15_000 }).toBe(0);
    // negative: a baseline for a file WeKan did not delete is kept, so the scan
    // still reports a file that disappears out of band.
    expect(db.countDocuments('fileIntegrity', { _id: unrelated })).toBe(1);
  } finally {
    db.deleteOne('fileIntegrity', { _id: unrelated });
    db.deleteMany('avatars', { userId: user.id });
  }
});
