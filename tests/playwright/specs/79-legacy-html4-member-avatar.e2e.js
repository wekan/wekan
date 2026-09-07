'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('member avatar has equivalent guarded HTML4 and HTML5 operations', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4avatar${suffix}`;
  const output = `${process.cwd()}/../../.tools/html4-member-avatar`;
  const storageSettings = db.findOne('attachmentStorageSettings', {});
  const uploadsWereBlocked = storageSettings?.limitSettings?.avatarsUploadBlocked === true;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let avatar;
  let modernContext;
  try {
    db.updateOne('attachmentStorageSettings', {}, {
      $set: { 'limitSettings.avatarsUploadBlocked': false },
    });
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(`Avatar-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/account/avatar"] input[type="submit"]').click()]);

    const upload = legacy.locator('form:has(input[name="legacyOperation"][value="upload-member-avatar"])');
    await upload.locator('input[type="file"]').setInputFiles(
      path.resolve(process.cwd(), '../../public/Square44x44Logo.scale-100.png'));
    await Promise.all([legacy.waitForNavigation(), upload.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('avatars', { userId: user._id })).not.toBeNull();
    avatar = db.findOne('avatars', { userId: user._id });
    expect(avatar.type).toBe('image/gif');
    expect(avatar.name).toBe('avatar.gif');
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.avatarUrl)
      .toBe(`/cdn/storage/avatars/${avatar._id}`);
    fs.mkdirSync(output, { recursive: true });
    await legacy.screenshot({ path: `${output}/html4-member-avatar.png`, fullPage: true });

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/account/avatar');
    await waitForMeteor(modern);
    await expect(modern.locator(`.js-delete-avatar[data-avatar-id="${avatar._id}"]`)).toBeVisible();
    await expect(modern.locator('.avatar-list-item.selected .avatar-list-name')).toContainText('avatar.gif');
    await modern.screenshot({ path: `${output}/html5-member-avatar.png`, fullPage: true });

    const select = legacy.locator(
      `form:has(input[name="legacyOperation"][value="select-member-avatar"]):has(input[name="avatarId"][value="${avatar._id}"])`,
    );
    await select.locator('input[name="avatarId"]').evaluate(node => { node.value = 'foreign-avatar'; });
    await Promise.all([legacy.waitForNavigation(), legacy.locator(
      'form:has(input[name="avatarId"][value="foreign-avatar"]) input[type="submit"]',
    ).click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.avatarUrl)
      .toBe(`/cdn/storage/avatars/${avatar._id}`);
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', source: 'memberAvatar', userId: user._id,
    })).not.toBeNull();

    let remove = legacy.locator(
      `form:has(input[name="legacyOperation"][value="request-delete-member-avatar"]):has(input[name="avatarId"][value="${avatar._id}"])`,
    );
    await Promise.all([legacy.waitForNavigation(), remove.locator('input[type="submit"]').click()]);
    remove = legacy.locator(
      `form:has(input[name="legacyOperation"][value="delete-member-avatar"]):has(input[name="avatarId"][value="${avatar._id}"])`,
    );
    await Promise.all([legacy.waitForNavigation(), remove.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('avatars', { _id: avatar._id })).toBeNull();
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.avatarUrl || '')
      .toBe('');
  } finally {
    db.updateOne('attachmentStorageSettings', {}, {
      $set: { 'limitSettings.avatarsUploadBlocked': uploadsWereBlocked },
    });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) {
      db.deleteMany('eventlog', { userId: user._id });
      db.deleteMany('legacyHtml4Sessions', { userId: user._id });
      db.deleteMany('avatars', { userId: user._id });
      db.deleteMany('users', { _id: user._id });
    }
  }
});
