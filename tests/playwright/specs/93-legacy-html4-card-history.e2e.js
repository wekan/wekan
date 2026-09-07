'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('Legacy HTML4 card History searches and restores at the same route as HTML5', async ({
  browser, baseURL,
}) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4history${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const oldTitle = `History old ${suffix}`;
  const middleTitle = `History middle ${suffix}`;
  const newTitle = `History new ${suffix}`;
  const context = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const page = await context.newPage();
  let user;
  let board;
  let otherBoard;
  let modernContext;
  try {
    await page.goto(`${baseURL}/sign-up`);
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([page.waitForNavigation(), page.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    board = db.seedBoard({ ownerId: user._id, title: `History ${suffix}`,
      listCount: 1, cardTitlesPerList: [[oldTitle]] });
    otherBoard = db.seedBoard({ ownerId: user._id, title: `Other ${suffix}`,
      listCount: 1, cardTitlesPerList: [[`Other card ${suffix}`]] });
    const card = db.findOne('cards', { boardId: board.boardId, title: oldTitle });
    const otherCard = db.findOne('cards', { boardId: otherBoard.boardId });
    const open = action => Promise.all([
      page.waitForNavigation(),
      page.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
    ]);
    if (await page.locator('form[action="/allboards"] input[type="submit"]').count()) {
      await open('/allboards');
    }
    const boardPath = `/b/${board.boardId}/${board.slug}`;
    const cardPath = `${boardPath}/${card._id}`;
    await open(boardPath);
    await open(cardPath);

    let titleForm = page.locator(
      'form:has(input[name="legacyOperation"][value="edit-card-title"])',
    );
    await titleForm.locator('input[name="cardTitle"]').fill(middleTitle);
    await Promise.all([page.waitForNavigation(), titleForm.locator('input[type="submit"]').click()]);
    titleForm = page.locator(
      'form:has(input[name="legacyOperation"][value="edit-card-title"])',
    );
    await titleForm.locator('input[name="cardTitle"]').fill(newTitle);
    await Promise.all([page.waitForNavigation(), titleForm.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('cards', { _id: card._id }).title).toBe(newTitle);

    const historyOpen = page.locator(
      'form:has(input[name="legacyOperation"][value="show-card-history"])',
    ).first();
    await Promise.all([page.waitForNavigation(), historyOpen.locator('input[type="submit"]').click()]);
    const historyTable = page.locator('.legacy-history-table');
    await expect(historyTable).toBeVisible();
    await expect(historyTable.locator('table')).toBeVisible();
    await expect(historyTable).toContainText(newTitle);

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.goto(`${baseURL}${cardPath}`);
    await modern.locator('.js-open-card-details-menu').click();
    await modern.locator('.js-card-history').click();
    await expect(modern.locator('.history-table')).toBeVisible();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-card-history.png`, fullPage: true,
      });
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-card-history.png`, fullPage: true,
      });
    }

    const restoreForm = page.locator(
      'form:has(button[name="legacyOperation"][value="restore-card-history"])',
    );
    await restoreForm.locator(`tr:has-text("${middleTitle}") input[name="historyRowId"]`).check();
    await Promise.all([page.waitForNavigation(), restoreForm.locator(
      'button[name="legacyOperation"][value="restore-card-history"]',
    ).click()]);
    await expect.poll(() => db.findOne('cards', { _id: card._id }).title).toBe(middleTitle);

    const forgedId = db.uid('history');
    db.insertOne('changeHistory', {
      _id: forgedId, boardId: otherBoard.boardId, swimlaneId: otherBoard.swimlaneId,
      listId: otherBoard.listIds[0], cardId: otherCard._id,
      entityType: 'card', entityId: otherCard._id, group: 'title', changeType: 'edited',
      previousContent: { field: 'title', value: otherCard.title },
      newContent: { field: 'title', value: `Forged ${suffix}` },
      userId: user._id, createdAt: new Date(), undone: false,
    });
    const forgedRestore = page.locator(
      'form:has(button[name="legacyOperation"][value="restore-card-history"])',
    );
    const originalValue = await forgedRestore.locator('input[name="historyRowId"]').first()
      .getAttribute('value');
    await forgedRestore.locator('input[name="historyRowId"]').first().evaluate(
      (input, value) => { input.value = value; }, forgedId,
    );
    await forgedRestore.locator('input[name="historyRowId"]').first().check();
    await Promise.all([page.waitForNavigation(), forgedRestore.locator(
      'button[name="legacyOperation"][value="restore-card-history"]',
    ).click()]);
    expect(db.findOne('cards', { _id: otherCard._id }).title).toBe(otherCard.title);
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', userId: user._id,
      source: 'canary:legacy-html4.history-cross-scope', action: 'detected',
    })).not.toBeNull();
    expect(originalValue).toBeTruthy();
  } finally {
    if (modernContext) await modernContext.close();
    await context.close();
    const boardIds = [board?.boardId, otherBoard?.boardId].filter(Boolean);
    if (boardIds.length) db.deleteMany('changeHistory', { boardId: { $in: boardIds } });
    db.cleanup({ boardIds, userIds: [user?._id].filter(Boolean) });
  }
});
