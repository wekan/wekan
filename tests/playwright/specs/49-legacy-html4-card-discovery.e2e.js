'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('cookieless HTML4 card discovery pages show only the signed-in user data', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4discover${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  let user;
  let board;
  let outsider;
  let outsiderBoard;
  try {
    await page.goto(`${baseURL}/sign-up`);
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([
      page.waitForNavigation(),
      page.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    expect(user && user._id).toBeTruthy();

    board = db.seedBoard({
      ownerId: user._id,
      cardTitlesPerList: [['HTML4 Mine'], ['HTML4 Due'], ['HTML4 Searchable']],
    });
    outsider = db.seedUser();
    outsiderBoard = db.seedBoard({
      ownerId: outsider.id,
      cardTitlesPerList: [['HTML4 Searchable Secret']],
    });
    const cards = db.find('cards', { boardId: board.boardId });
    const due = cards.find(card => card.title === 'HTML4 Due');
    db.updateOne('cards', { _id: due._id }, {
      $set: {
        dueAt: new Date('2030-01-02T12:00:00Z'),
        startAt: new Date('2029-12-31T12:00:00Z'),
        members: [user._id],
        description: 'Semantic HTML4 card description',
      },
    });
    db.updateOne('users', { _id: user._id }, {
      $set: { 'profile.starredPages': [{ url: '/shortcuts', title: 'Saved shortcuts' }] },
    });

    if (await page.locator('form[action="/allboards"] input[type="submit"]').count()) {
      await Promise.all([
        page.waitForNavigation(),
        page.locator('form[action="/allboards"] input[type="submit"]').first().click(),
      ]);
    }

    const open = async action => {
      await Promise.all([
        page.waitForNavigation(),
        page.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
      ]);
    };
    await open('/my-cards');
    await expect(page.locator('h1')).toHaveText('My Cards');
    await expect(page.locator('tbody')).toContainText('HTML4 Due');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Searchable Secret');

    await Promise.all([
      page.waitForNavigation(),
      page.locator(`form[action$="/${due._id}"] input[type="submit"]`).click(),
    ]);
    await expect(page.locator('h1')).toHaveText('HTML4 Due');
    await expect(page.locator('tbody')).toContainText('Semantic HTML4 card description');
    await expect(page.locator('tbody')).toContainText('2030-01-02T12:00:00.000Z');
    await expect(page.locator('tbody')).toContainText(username);

    const modernContext = await browser.newContext();
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.goto(`${baseURL}/b/${board.boardId}/${board.slug}/${due._id}`);
    await expect(modern.locator('.card-details-title')).toContainText('HTML4 Due');
    await expect(modern.locator('.card-details')).toContainText('Semantic HTML4 card description');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-card-details.png`, fullPage: true,
      });
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-card-details.png`, fullPage: true,
      });
    }
    await modernContext.close();

    await open('/due-cards');
    await expect(page.locator('h1')).toHaveText('Due Cards');
    await expect(page.locator('tbody')).toContainText('HTML4 Due');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Searchable');

    await open('/bookmarks');
    await expect(page.locator('tbody')).toContainText('Saved shortcuts');

    await open('/global-search');
    await page.locator('input[name="q"]').fill('Searchable');
    await Promise.all([page.waitForNavigation(), page.locator('#legacy-search-query').press('Enter')]);
    await expect(page.locator('tbody')).toContainText('HTML4 Searchable');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Due');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Searchable Secret');
  } finally {
    if (outsiderBoard) db.cleanup({ boardIds: [outsiderBoard.boardId] });
    if (outsider) db.cleanup({ userIds: [outsider.id] });
    if (board) db.cleanup({ boardIds: [board.boardId] });
    if (user) db.cleanup({ userIds: [user._id] });
    await context.close();
  }
});
