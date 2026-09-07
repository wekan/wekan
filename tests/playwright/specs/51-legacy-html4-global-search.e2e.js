'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('HTML4 and HTML5 share advanced global search and paging', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4search${suffix}`;
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
    const titles = Array.from({ length: 26 }, (_, index) =>
      `Needle result ${String(index + 1).padStart(2, '0')}`);
    board = db.seedBoard({
      ownerId: user._id, title: `Advanced Search ${suffix}`,
      cardTitlesPerList: [titles],
    });
    outsider = db.seedUser();
    outsiderBoard = db.seedBoard({
      ownerId: outsider.id, title: `Advanced Search ${suffix}`,
      cardTitlesPerList: [['Needle secret result']],
    });
    const openLegacy = async action => Promise.all([
      legacy.waitForNavigation(),
      legacy.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
    ]);
    await openLegacy('/allboards');
    await openLegacy('/global-search');
    const query = `board:"Advanced Search ${suffix}" title:"Needle" limit:10`;
    await legacy.locator('#legacy-search-query').fill(query);
    await Promise.all([
      legacy.waitForNavigation(), legacy.locator('#legacy-search-query').press('Enter'),
    ]);
    const legacyResults = legacy.locator(`form[action^="/b/${board.boardId}/"]`);
    await expect(legacyResults).toHaveCount(10);
    await expect(legacy.locator('tbody')).toContainText('26 (1 / 3)');
    await expect(legacy.locator('tbody')).not.toContainText('Needle secret result');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-global-search.png`,
        fullPage: true,
      });
    }
    const next = legacy.locator(
      'form[action="/global-search"]:has(input[name="page"][value="2"]) input[type="submit"]',
    );
    await Promise.all([legacy.waitForNavigation(), next.click()]);
    await expect(legacy.locator('tbody')).toContainText('26 (2 / 3)');
    await expect(legacy.locator(`form[action^="/b/${board.boardId}/"]`)).toHaveCount(10);

    modernContext = await browser.newContext();
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, `/global-search?q=${encodeURIComponent(query)}`);
    const modernResults = modern.locator('.global-search-results-list .result-card-wrapper');
    await expect(modernResults).toHaveCount(10);
    await expect(modern.locator('.global-search-results-list')).not.toContainText(
      'Needle secret result',
    );
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-global-search.png`,
        fullPage: true,
      });
    }
    await modern.locator('.js-next-page').click();
    await expect(modernResults).toHaveCount(10);
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    db.cleanup({
      boardIds: [board?.boardId, outsiderBoard?.boardId].filter(Boolean),
      userIds: [user?._id, outsider?.id].filter(Boolean),
    });
  }
});
