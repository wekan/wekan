'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('Legacy HTML4 and HTML5 share guarded audited permanent card delete', async ({
  browser, baseURL,
}) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4carddelete${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const context = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const page = await context.newPage();
  let user;
  let board;
  let outsider;
  let outsiderUser;
  let modernContext;
  try {
    await page.goto(`${baseURL}/sign-up`);
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([page.waitForNavigation(), page.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    board = db.seedBoard({ ownerId: user._id, title: `Delete ${suffix}`, listCount: 1,
      cardTitlesPerList: [[`Delete me ${suffix}`, `Protected ${suffix}`, `Link ${suffix}`]] });
    outsiderUser = db.seedUser({ username: `deleteoutsider${suffix}` });
    outsider = db.seedBoard({ ownerId: outsiderUser.id, title: `Private ${suffix}`,
      listCount: 1, cardTitlesPerList: [[`Private card ${suffix}`]] });
    const removable = db.findOne('cards', { boardId: board.boardId, title: `Delete me ${suffix}` });
    const protectedCard = db.findOne('cards', {
      boardId: board.boardId, title: `Protected ${suffix}`,
    });
    const link = db.findOne('cards', { boardId: board.boardId, title: `Link ${suffix}` });
    db.updateOne('cards', { _id: link._id }, { $set: {
      type: 'cardType-linkedCard', linkedId: protectedCard._id,
    } });
    const open = action => Promise.all([
      page.waitForNavigation(),
      page.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
    ]);
    if (await page.locator('form[action="/allboards"] input[type="submit"]').count()) {
      await open('/allboards');
    }
    const boardPath = `/b/${board.boardId}/${board.slug}`;
    const removablePath = `${boardPath}/${removable._id}`;
    await open(boardPath);
    await open(removablePath);
    const requestDelete = page.locator(
      'form:has(input[name="legacyOperation"][value="confirm-permanently-delete-card"])',
    );
    await expect(requestDelete).toBeVisible();

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.goto(`${baseURL}${removablePath}`);
    await modern.locator('.js-open-card-details-menu').click();
    await modern.locator('.js-more').click();
    await expect(modern.locator('[data-popup="cardMorePopup"]')).toBeVisible();
    await expect(modern.locator('.js-delete')).toBeVisible();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-card-delete.png`, fullPage: true,
      });
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-card-delete.png`, fullPage: true,
      });
    }

    await Promise.all([page.waitForNavigation(), requestDelete.locator('input[type="submit"]').click()]);
    const confirmDelete = page.locator(
      'form:has(input[name="legacyOperation"][value="permanently-delete-card"])',
    );
    await expect(confirmDelete).toBeVisible();
    await Promise.all([page.waitForNavigation(), confirmDelete.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('cards', { _id: removable._id })).toBeNull();
    await expect.poll(() => db.findOne('recoveryEvents', {
      type: 'card-permanently-deleted', userId: user._id, done: true, deletedData: true,
    })).not.toBeNull();

    await open('/allboards');
    await open(boardPath);
    const protectedPath = `${boardPath}/${protectedCard._id}`;
    await open(protectedPath);
    let protectedRequest = page.locator(
      'form:has(input[name="legacyOperation"][value="confirm-permanently-delete-card"])',
    );
    await Promise.all([
      page.waitForNavigation(), protectedRequest.locator('input[type="submit"]').click(),
    ]);
    let protectedConfirm = page.locator(
      'form:has(input[name="legacyOperation"][value="permanently-delete-card"])',
    );
    await Promise.all([
      page.waitForNavigation(), protectedConfirm.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: protectedCard._id })).not.toBeNull();
    await expect.poll(() => db.findOne('recoveryEvents', {
      type: 'card-permanently-deleted', userId: user._id, done: false,
    })).not.toBeNull();

    protectedRequest = page.locator(
      'form:has(input[name="legacyOperation"][value="confirm-permanently-delete-card"])',
    );
    await Promise.all([
      page.waitForNavigation(), protectedRequest.locator('input[type="submit"]').click(),
    ]);
    protectedConfirm = page.locator(
      'form:has(input[name="legacyOperation"][value="permanently-delete-card"])',
    );
    await protectedConfirm.locator('input[name="boardId"]').evaluate(
      (input, value) => { input.value = value; }, outsider.boardId,
    );
    await Promise.all([
      page.waitForNavigation(), protectedConfirm.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: protectedCard._id })).not.toBeNull();
    expect(db.countDocuments('cards', { boardId: outsider.boardId })).toBe(1);
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', userId: user._id, action: 'detected',
      source: 'canary:board.write-without-capability',
    })).not.toBeNull();
  } finally {
    if (modernContext) await modernContext.close();
    await context.close();
    const boardIds = [board?.boardId, outsider?.boardId].filter(Boolean);
    if (user?._id) db.deleteMany('recoveryEvents', { userId: user._id });
    db.cleanup({ boardIds, userIds: [user?._id, outsiderUser?.id].filter(Boolean) });
  }
});
