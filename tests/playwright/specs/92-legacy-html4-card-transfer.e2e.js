'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('Legacy HTML4 exports and imports one card at the same route as HTML5', async ({
  browser, baseURL,
}) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4cardtransfer${suffix}`;
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
    board = db.seedBoard({ ownerId: user._id, title: `Card transfer ${suffix}`,
      listCount: 1, cardTitlesPerList: [[`Transfer card ${suffix}`]] });
    outsiderUser = db.seedUser({ username: `outsider${suffix}` });
    outsider = db.seedBoard({ ownerId: outsiderUser.id, title: `Private ${suffix}`,
      listCount: 1, cardTitlesPerList: [['Foreign card']] });
    const card = db.findOne('cards', { boardId: board.boardId, title: `Transfer card ${suffix}` });
    const foreignCard = db.findOne('cards', { boardId: outsider.boardId, title: 'Foreign card' });
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

    const exportForm = page.locator(
      'form:has(input[name="legacyOperation"][value="export-card"])',
    );
    const importForm = page.locator(
      'form:has(input[name="legacyOperation"][value="import-card-file"])',
    );
    await expect(exportForm).toBeVisible();
    await expect(importForm).toBeVisible();
    await expect(exportForm.locator('select[name="exportFormat"]')).toBeVisible();
    await expect(importForm.locator('input[type="file"][name="importFile"]')).toBeVisible();

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.goto(`${baseURL}${cardPath}`);
    await modern.locator('.js-open-card-details-menu').click();
    await expect(modern.locator('.js-export-card')).toBeVisible();
    await expect(modern.locator('.js-import-card')).toBeVisible();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-card-transfer.png`, fullPage: true,
      });
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-card-transfer.png`, fullPage: true,
      });
    }

    await exportForm.locator('select[name="exportFormat"]').selectOption('json');
    const [download] = await Promise.all([
      page.waitForEvent('download'), exportForm.locator('input[type="submit"]').click(),
    ]);
    const chunks = [];
    const stream = await download.createReadStream();
    for await (const chunk of stream) chunks.push(chunk);
    const exported = Buffer.concat(chunks);
    const document = JSON.parse(exported.toString('utf8'));
    expect(document.cards).toHaveLength(1);
    expect(document.cards[0].title).toBe(`Transfer card ${suffix}`);

    await importForm.locator('input[type="file"][name="importFile"]').setInputFiles({
      name: 'wekan-card.json', mimeType: 'application/json', buffer: exported,
    });
    await Promise.all([page.waitForNavigation(), importForm.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.countDocuments('cards', {
      boardId: board.boardId, title: `Transfer card ${suffix}`,
    })).toBe(2);

    const forgedImport = page.locator(
      'form:has(input[name="legacyOperation"][value="import-card-file"])',
    );
    await forgedImport.locator('input[name="boardId"]').evaluate(
      (input, value) => { input.value = value; }, outsider.boardId,
    );
    await forgedImport.locator('input[name="cardId"]').evaluate(
      (input, value) => { input.value = value; }, foreignCard._id,
    );
    await forgedImport.locator('input[type="file"][name="importFile"]').setInputFiles({
      name: 'wekan-card.json', mimeType: 'application/json', buffer: exported,
    });
    await Promise.all([
      page.waitForNavigation(), forgedImport.locator('input[type="submit"]').click(),
    ]);
    expect(db.countDocuments('cards', { boardId: outsider.boardId })).toBe(1);
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', userId: user._id, bleed: 'ImportBleed', action: 'blocked',
      source: 'legacyHtml4:card-import',
    })).not.toBeNull();
  } finally {
    if (modernContext) await modernContext.close();
    await context.close();
    db.cleanup({
      boardIds: [board?.boardId, outsider?.boardId].filter(Boolean),
      userIds: [user?._id, outsiderUser?.id].filter(Boolean),
    });
  }
});
