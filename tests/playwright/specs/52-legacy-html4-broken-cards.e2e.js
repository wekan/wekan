'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('HTML4 and HTML5 show the same user-scoped broken cards', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4broken${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false });
  const legacy = await legacyContext.newPage();
  let user;
  let board;
  let outsider;
  let outsiderBoard;
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
    board = db.seedBoard({
      ownerId: user._id, title: `Broken context ${suffix}`,
      cardTitlesPerList: [[`Visible broken ${suffix}`, `Healthy card ${suffix}`]],
    });
    const broken = db.findOne('cards', {
      boardId: board.boardId, title: `Visible broken ${suffix}`,
    });
    db.updateOne('cards', { _id: broken._id }, { $set: { listId: '' } });
    outsider = db.seedUser();
    outsiderBoard = db.seedBoard({
      ownerId: outsider.id, title: `Private broken context ${suffix}`,
      cardTitlesPerList: [[`Private broken ${suffix}`]],
    });
    db.updateOne('cards', { boardId: outsiderBoard.boardId }, { $set: { listId: '' } });

    const openLegacy = async action => Promise.all([
      legacy.waitForNavigation(),
      legacy.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
    ]);
    await openLegacy('/allboards');
    await openLegacy('/broken-cards');
    await expect(legacy.locator('tbody')).toContainText(`Visible broken ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText('(Unknown)');
    await expect(legacy.locator('tbody')).not.toContainText(`Healthy card ${suffix}`);
    await expect(legacy.locator('tbody')).not.toContainText(`Private broken ${suffix}`);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-broken-cards.png`, fullPage: true,
      });
    }

    modernContext = await browser.newContext();
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/broken-cards');
    const results = modern.locator('.global-search-results-list .result-card-wrapper');
    await expect(results).toHaveCount(1);
    await expect(results).toContainText(`Visible broken ${suffix}`);
    await expect(modern.locator('.global-search-results-list')).not.toContainText(
      `Private broken ${suffix}`,
    );
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-broken-cards.png`, fullPage: true,
      });
    }
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    db.cleanup({
      boardIds: [board?.boardId, outsiderBoard?.boardId].filter(Boolean),
      userIds: [user?._id, outsider?.id].filter(Boolean),
    });
  }
});
