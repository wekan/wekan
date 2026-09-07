'use strict';
const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('card date format is shared and guarded without cookies', async ({ browser, baseURL }) => {
  const suffix = db.uniqueSuffix();
  const username = `html4date${suffix}`;
  const output = `${process.cwd()}/../../.tools/html4-card-date-format`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user; let board; let card; let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(`Date-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    board = db.seedBoard({ ownerId: user._id, title: `Date board ${suffix}`,
      listCount: 1, cardTitlesPerList: [['Date card']] });
    card = db.findOne('cards', { boardId: board.boardId, title: 'Date card' });
    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCardNumber: true } });
    db.updateOne('cards', { _id: card._id }, { $set: { cardNumber: 73 } });
    for (const target of ['/allboards', `/b/${board.boardId}/${board.slug}`,
      `/b/${board.boardId}/${board.slug}/${card._id}`]) {
      await Promise.all([legacy.waitForNavigation(), legacy.locator(`form[action="${target}"] input[type="submit"]`).first().click()]);
    }
    await expect(legacy.locator('h1')).toHaveText('#73 Date card');
    await expect(legacy.getByRole('row', { name: /^Title #73 Date card$/ }))
      .toContainText('#73 Date card');
    const form = () => legacy.locator('form:has(input[value="set-card-date-format"])');
    await form().locator('select[name="dateFormat"]').selectOption('DD-MM-YYYY');
    await Promise.all([legacy.waitForNavigation(), form().locator('input[type="submit"]').click()]);
    expect(db.findOne('users', { _id: user._id }).profile.dateFormat).toBe('DD-MM-YYYY');

    // Verify the shared preference in the modern view before deliberately
    // triggering the account's input-abuse protection below.
    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.waitForFunction(
      () => Meteor.user()?.profile?.dateFormat === 'DD-MM-YYYY',
      undefined,
      { timeout: 15_000 },
    );
    await navigateInApp(modern, `/b/${board.boardId}/${board.slug}/${card._id}`);
    await waitForMeteor(modern);
    await expect(modern.locator('h2.card-details-title')).toContainText('#73 Date card');
    await expect(modern.locator('.js-date-format-selector')).toHaveValue('DD-MM-YYYY');
    fs.mkdirSync(output, { recursive: true });
    await modern.screenshot({ path: `${output}/html5-date-format.png`, fullPage: true });

    await form().locator('select[name="dateFormat"]').evaluate(select => {
      const option = document.createElement('option'); option.value = 'javascript:date';
      select.add(option); select.value = option.value;
    });
    await Promise.all([legacy.waitForNavigation(), form().locator('input[type="submit"]').click()]);
    expect(db.findOne('users', { _id: user._id }).profile.dateFormat).toBe('DD-MM-YYYY');
    await expect.poll(() => db.findOne('eventlog', { stream: 'security', userId: user._id,
      source: 'memberDateFormat' })).not.toBeNull();
    await legacy.screenshot({ path: `${output}/html4-date-format.png`, fullPage: true });

  } finally {
    if (modernContext) await modernContext.close(); await legacyContext.close();
    if (board?.boardId) { db.deleteMany('cards', { boardId: board.boardId }); db.deleteMany('lists', { boardId: board.boardId }); db.deleteMany('swimlanes', { boardId: board.boardId }); db.deleteMany('boards', { _id: board.boardId }); }
    if (user?._id) { db.deleteMany('eventlog', { userId: user._id }); db.deleteMany('legacyHtml4Sessions', { userId: user._id }); db.deleteMany('users', { _id: user._id }); }
  }
});
