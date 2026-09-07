'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('Legacy HTML4 renders and controls an owned persisted Trello API job', async ({
  browser, baseURL,
}) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4trellojob${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const context = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const page = await context.newPage();
  let user;
  let board;
  let modernContext;
  const jobId = `trellojob${suffix}`;
  try {
    await page.goto(`${baseURL}/sign-up`);
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([page.waitForNavigation(), page.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    board = db.seedBoard({ ownerId: user._id, title: `Trello API result ${suffix}`, listCount: 0 });
    db.updateOne('users', { _id: user._id }, { $set: { 'profile.trelloApiSaved': true } });
    db.insertOne('trello_import_jobs', {
      _id: jobId, userId: user._id, status: 'paused', boardIds: ['a'.repeat(24)],
      currentIndex: 1, total: 1, results: [{ trelloBoardId: 'a'.repeat(24),
        boardId: board.boardId, title: `Trello API result ${suffix}`,
        attachmentsImported: 2, success: true }],
      errorLog: ['Credentials needed to resume'], createdBoardIds: [board.boardId],
      cancelRequested: false, deleteOnCancel: false, lastError: 'Credentials needed to resume',
      createdAt: new Date(), updatedAt: new Date(),
    });

    const open = action => Promise.all([
      page.waitForNavigation(),
      page.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
    ]);
    if (await page.locator('form[action="/allboards"] input[type="submit"]').count()) {
      await open('/allboards');
    }
    await open('/import');
    await open('/import/trello');
    await expect(page.locator('legend').filter({ hasText: 'API key and token' })).toBeVisible();
    await expect(page.locator('input[type="password"][name="trelloApiToken"]')).toBeVisible();
    await expect(page.locator('tbody')).toContainText('are saved');
    await expect(page.locator('tbody')).toContainText(`Trello API result ${suffix}`);
    await expect(page.locator('tbody')).toContainText('1 / 1');
    await expect(page.locator('tbody')).toContainText('Credentials needed to resume');

    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-trello-api-job.png`, fullPage: true,
      });
    }

    // The destructive transition cannot be reached by submitting the
    // confirmation form without its initially unchecked confirmation control.
    await Promise.all([
      page.waitForNavigation(),
      page.locator('form:has(input[value="trello-request-cancel-delete"]) input[type="submit"]')
        .click(),
    ]);
    let confirm = page.locator('form:has(input[value="trello-confirm-cancel-delete"])');
    await Promise.all([page.waitForNavigation(), confirm.locator('input[type="submit"]').click()]);
    expect(db.findOne('boards', { _id: board.boardId })?._id).toBe(board.boardId);
    expect(db.findOne('trello_import_jobs', { _id: jobId })?.status).toBe('paused');
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', userId: user._id, bleed: 'ImportBleed',
      source: 'legacyHtml4:trello-api-import', action: 'blocked',
    })).not.toBeNull();

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.evaluate(() => {
      window.history.pushState({}, '', '/import/trello');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(modern.getByRole('heading', { name: 'Import from:' })).toBeVisible();
    await expect(modern.locator('.trello-api-import')).toContainText(`Trello API result ${suffix}`);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-trello-api-job.png`, fullPage: true,
      });
    }

    await Promise.all([
      page.waitForNavigation(),
      page.locator('form:has(input[value="trello-request-cancel-delete"]) input[type="submit"]')
        .click(),
    ]);
    confirm = page.locator('form:has(input[value="trello-confirm-cancel-delete"])');
    await expect(confirm.locator('legend')).toBeVisible();
    await confirm.locator('input[name="confirmed"]').check();
    await Promise.all([page.waitForNavigation(), confirm.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('boards', { _id: board.boardId })).toBeNull();
    expect(db.findOne('trello_import_jobs', { _id: jobId })?.status).toBe('cancelled');

    const clear = page.locator('form:has(input[value="trello-clear-job"])');
    await Promise.all([page.waitForNavigation(), clear.locator('input[type="submit"]').click()]);
    expect(db.findOne('trello_import_jobs', { _id: jobId })).toBeNull();
  } finally {
    if (modernContext) await modernContext.close();
    await context.close();
    db.cleanup({ boardIds: board ? [board.boardId] : [], userIds: user ? [user._id] : [] });
    db.deleteMany('trello_import_jobs', { _id: jobId });
  }
});
