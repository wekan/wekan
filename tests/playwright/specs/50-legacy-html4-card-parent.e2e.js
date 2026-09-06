'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('HTML4 and HTML5 expose the same parent-card state at the same URL', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4parent${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false });
  const legacy = await legacyContext.newPage();
  let user;
  let board;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([
      legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    expect(user?._id).toBeTruthy();
    board = db.seedBoard({
      ownerId: user._id,
      title: `Parent parity ${suffix}`,
      cardTitlesPerList: [['Parent target', 'Child card']],
    });
    const parent = db.findOne('cards', { boardId: board.boardId, title: 'Parent target' });
    const child = db.findOne('cards', { boardId: board.boardId, title: 'Child card' });
    const cardUrl = `${baseURL}/b/${board.boardId}/${board.slug}/${child._id}`;
    const openLegacy = async action => {
      await Promise.all([
        legacy.waitForNavigation(),
        legacy.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
      ]);
    };

    await openLegacy('/allboards');
    await openLegacy(`/b/${board.boardId}/${board.slug}`);
    await openLegacy(`/b/${board.boardId}/${board.slug}/${child._id}`);
    const parentForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="set-card-parent"])',
    );
    await parentForm.locator('select[name="parentCardId"]').selectOption(parent._id);
    await Promise.all([
      legacy.waitForNavigation(), parentForm.locator('input[type="submit"]').click(),
    ]);
    expect(db.getCard(child._id).parentId).toBe(parent._id);
    await expect(parentForm.locator('select[name="parentCardId"]')).toHaveValue(parent._id);
    await expect(legacy.locator('tbody')).toContainText(
      `${db.getBoard(board.boardId).title} / ${parent.title}`,
    );

    modernContext = await browser.newContext();
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.goto(cardUrl);
    await expect(modern.locator('.card-details-title')).toContainText(child.title);
    await modern.locator('.js-open-card-details-menu:visible').first().click();
    await modern.locator('.pop-over:visible .js-more').click();
    const modernParentPopup = modern.locator('.pop-over:visible');
    await expect(modernParentPopup).toContainText("Change card's parent");
    await expect(modernParentPopup.locator('.js-field-parent-card')).toHaveValue(parent._id);

    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await parentForm.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-card-parent.png`,
      });
      await modernParentPopup.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-card-parent.png`,
      });
    }
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (board?.boardId || user?._id) {
      db.cleanup({
        boardIds: board?.boardId ? [board.boardId] : [],
        userIds: user?._id ? [user._id] : [],
      });
    }
  }
});
