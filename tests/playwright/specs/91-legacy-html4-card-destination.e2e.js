'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('Legacy HTML4 and HTML5 share authorized card placement and copy operations', async ({
  browser, baseURL,
}) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4cardplace${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let source;
  let target;
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
    source = db.seedBoard({ ownerId: user._id, title: `Placement source ${suffix}`,
      listCount: 1, cardTitlesPerList: [['First', `Moving ${suffix}`, 'Last']] });
    target = db.seedBoard({ ownerId: user._id, title: `Placement target ${suffix}`,
      listCount: 1, cardTitlesPerList: [['Anchor']] });
    const moving = db.findOne('cards', { boardId: source.boardId, title: `Moving ${suffix}` });
    const open = action => Promise.all([
      legacy.waitForNavigation(),
      legacy.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
    ]);
    if (await legacy.locator('form[action="/allboards"] input[type="submit"]').count()) {
      await open('/allboards');
    }
    const sourceBoardPath = `/b/${source.boardId}/${source.slug}`;
    const sourcePath = `${sourceBoardPath}/${moving._id}`;
    await open(sourceBoardPath);
    await open(sourcePath);

    const moveForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="move-card-to-destination"])',
    );
    const copyForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="copy-card-to-destination"])',
    );
    await expect(moveForm).toBeVisible();
    await expect(copyForm).toBeVisible();
    await expect(moveForm.locator('select[name="cardDestination"]')).toHaveCount(1);
    await expect(moveForm.locator('select[name="position"] option[value="top"]')).toHaveCount(1);
    await expect(moveForm.locator('select[name="position"] option[value="above"]')).toHaveCount(1);

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.goto(`${baseURL}${sourcePath}`);
    await expect(modern.locator('.js-card-details')).toContainText(`Moving ${suffix}`);
    await modern.locator('.js-open-card-details-menu').click();
    await expect(modern.locator('.js-move-card')).toBeVisible();
    await expect(modern.locator('.js-copy-card')).toBeVisible();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-card-destination.png`, fullPage: true,
      });
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-card-destination.png`, fullPage: true,
      });
    }

    const targetValue = `${target.boardId}|${target.swimlaneId}|${target.listIds[0]}|`;
    await moveForm.locator('select[name="cardDestination"]').selectOption(targetValue);
    await moveForm.locator('select[name="position"]').selectOption('top');
    await moveForm.locator('input[name="cardTitle"]').fill(`Moved ${suffix}`);
    await Promise.all([legacy.waitForNavigation(), moveForm.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('cards', { _id: moving._id })).toMatchObject({
      boardId: target.boardId, swimlaneId: target.swimlaneId,
      listId: target.listIds[0], title: `Moved ${suffix}`,
    });
    const moved = db.findOne('cards', { _id: moving._id });
    const anchor = db.findOne('cards', { boardId: target.boardId, title: 'Anchor' });
    expect(moved.sort).toBeLessThan(anchor.sort);

    const targetBoardPath = `/b/${target.boardId}/${target.slug}`;
    const targetPath = `${targetBoardPath}/${moving._id}`;
    await open('/allboards');
    await open(targetBoardPath);
    await open(targetPath);
    const targetCopyForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="copy-card-to-destination"])',
    );
    const sourceValue = `${source.boardId}|${source.swimlaneId}|${source.listIds[0]}|`;
    await targetCopyForm.locator('select[name="cardDestination"]').selectOption(sourceValue);
    await targetCopyForm.locator('select[name="position"]').selectOption('bottom');
    await targetCopyForm.locator('input[name="cardTitle"]').fill(`Copied ${suffix}`);
    await Promise.all([
      legacy.waitForNavigation(), targetCopyForm.locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('cards', {
      boardId: source.boardId, title: `Copied ${suffix}`,
    })).not.toBeNull();

    // A client-created destination option remains untrusted. It must neither
    // move the card nor silently disappear: the shared authorization canary
    // records the exact attempt for Admin Panel / Problems / Security. Keep
    // this last because high-severity security policy may disable the actor.
    await targetCopyForm.locator('select[name="cardDestination"]').evaluate((select, value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = 'Forged destination';
      select.appendChild(option);
      select.value = value;
    }, `forged-board|${target.swimlaneId}|${target.listIds[0]}|`);
    await Promise.all([
      legacy.waitForNavigation(), targetCopyForm.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: moving._id }).boardId).toBe(target.boardId);
    await expect(legacy.locator('tbody')).toContainText('Operation failed');
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', userId: user._id, action: 'detected',
      source: 'canary:board.write-without-capability',
    })).not.toBeNull();
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    db.cleanup({
      boardIds: [source?.boardId, target?.boardId].filter(Boolean),
      userIds: user ? [user._id] : [],
    });
  }
});
