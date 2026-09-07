'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('Legacy HTML4 and HTML5 share bounded server-side Copy Many Cards', async ({
  browser, baseURL,
}) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4copymany${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let source;
  let target;
  let outsider;
  let outsiderUser;
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
    source = db.seedBoard({ ownerId: user._id, title: `Template ${suffix}`,
      listCount: 1, cardTitlesPerList: [[`Template card ${suffix}`]] });
    target = db.seedBoard({ ownerId: user._id, title: `Batch target ${suffix}`,
      listCount: 1, cardTitlesPerList: [['Existing']] });
    outsiderUser = db.seedUser({ username: `copymanyoutsider${suffix}` });
    outsider = db.seedBoard({ ownerId: outsiderUser.id, title: `Private ${suffix}`,
      listCount: 1, cardTitlesPerList: [['Untouched']] });
    const template = db.findOne('cards', { boardId: source.boardId });
    const open = action => Promise.all([
      legacy.waitForNavigation(),
      legacy.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
    ]);
    if (await legacy.locator('form[action="/allboards"] input[type="submit"]').count()) {
      await open('/allboards');
    }
    const sourceBoardPath = `/b/${source.boardId}/${source.slug}`;
    const sourcePath = `${sourceBoardPath}/${template._id}`;
    await open(sourceBoardPath);
    await open(sourcePath);
    const batchForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="copy-many-cards"])',
    );
    await expect(batchForm.locator('textarea[name="cardCopies"]')).toBeVisible();
    await expect(batchForm.locator('select[name="cardDestination"]')).toBeVisible();

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.goto(`${baseURL}${sourcePath}`);
    await modern.locator('.js-open-card-details-menu').click();
    await expect(modern.locator('.js-copy-checklist-cards')).toBeVisible();
    await modern.locator('.js-copy-checklist-cards').click();
    await expect(modern.locator('[data-popup="copyManyCardsPopup"]')).toBeVisible();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-copy-many-cards.png`, fullPage: true,
      });
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-copy-many-cards.png`, fullPage: true,
      });
    }

    const copies = [1, 2, 3].map(index => ({
      title: `Batch ${index} ${suffix}`, description: `Description ${index}`,
    }));
    await batchForm.locator('textarea[name="cardCopies"]').fill(JSON.stringify(copies));
    await batchForm.locator('select[name="cardDestination"]').selectOption(
      `${target.boardId}|${target.swimlaneId}|${target.listIds[0]}|`,
    );
    await batchForm.locator('select[name="position"]').selectOption('bottom');
    await Promise.all([
      legacy.waitForNavigation(), batchForm.locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.countDocuments('cards', {
      boardId: target.boardId, title: { $regex: `^Batch [123] ${suffix}$` },
    })).toBe(3);
    const made = db.find('cards', {
      boardId: target.boardId, title: { $regex: `^Batch [123] ${suffix}$` },
    }).sort((a, b) => a.sort - b.sort);
    expect(made.map(card => card.title)).toEqual(copies.map(copy => copy.title));
    expect(made.map(card => card.description)).toEqual(copies.map(copy => copy.description));

    const forgedForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="copy-many-cards"])',
    );
    await forgedForm.locator('textarea[name="cardCopies"]')
      .fill(JSON.stringify([{ title: `Forbidden ${suffix}` }]));
    await forgedForm.locator('select[name="cardDestination"]').evaluate((select, value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = 'Forged destination';
      select.appendChild(option);
      select.value = value;
    }, `${outsider.boardId}|${outsider.swimlaneId}|${outsider.listIds[0]}|`);
    await Promise.all([
      legacy.waitForNavigation(), forgedForm.locator('input[type="submit"]').click(),
    ]);
    expect(db.countDocuments('cards', { boardId: outsider.boardId })).toBe(1);
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', userId: user._id, action: 'detected',
      source: 'canary:board.write-without-capability',
    })).not.toBeNull();
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    db.cleanup({
      boardIds: [source?.boardId, target?.boardId, outsider?.boardId].filter(Boolean),
      userIds: [user?._id, outsiderUser?.id].filter(Boolean),
    });
  }
});
