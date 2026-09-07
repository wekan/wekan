'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('HTML4 and HTML5 share import member mapping and HTML4 drafts are single-use', async ({
  browser, baseURL,
}) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4map${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  const target = db.seedUser();
  let user;
  let importedBoardId;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    expect(user?._id).toBeTruthy();

    if (await legacy.locator('form[action="/allboards"] input[type="submit"]').count()) {
      await Promise.all([
        legacy.waitForNavigation(),
        legacy.locator('form[action="/allboards"] input[type="submit"]').first().click(),
      ]);
    }

    const open = action => Promise.all([
      legacy.waitForNavigation(),
      legacy.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
    ]);
    await open('/import');
    await open('/import/csv');
    const cardTitle = `Mapped card ${suffix}`;
    await legacy.locator('textarea[name="importText"]')
      .fill(`title,status,members\n${cardTitle},Mapped list,${target.username}`);
    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('form:has(input[value="import-board-text"]) input[type="submit"]').click(),
    ]);

    const mapForm = legacy.locator('form:has(button[value="finish-board-import"])');
    await expect(mapForm.locator('legend')).toHaveText('Map members');
    await expect(mapForm.locator('input[name="memberMap0"]')).toHaveValue(target.username);
    await expect(mapForm.locator('button[value="finish-board-import-without-mapping"]'))
      .toBeVisible();
    const draftId = await mapForm.locator('input[name="importDraftId"]').inputValue();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-import-member-map.png`, fullPage: true,
      });
    }
    await Promise.all([
      legacy.waitForNavigation(), mapForm.locator('button[value="finish-board-import"]').click(),
    ]);
    const card = db.findOne('cards', { title: cardTitle });
    expect(card?.members).toContain(target.id);
    importedBoardId = card.boardId;

    // Replay the consumed id with the next valid session signature.
    await open('/import/csv');
    const replay = legacy.locator('form:has(input[value="import-board-text"])');
    await replay.evaluate((form, id) => {
      form.querySelector('input[name="legacyOperation"]').value = 'finish-board-import';
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = 'importDraftId'; input.value = id;
      form.appendChild(input);
    }, draftId);
    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator(`form:has(input[name="importDraftId"][value="${draftId}"]) input[type="submit"]`)
        .click(),
    ]);
    expect(db.countDocuments('cards', { title: cardTitle })).toBe(1);
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', userId: user._id, bleed: 'ImportBleed',
      source: 'canary:legacy-html4.import-draft', action: 'detected',
    })).not.toBeNull();

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.goto(`${baseURL}/import/csv`);
    await modern.locator('.js-import-json')
      .fill(`title,status,members\nModern map ${suffix},Mapped list,${target.username}`);
    await modern.locator('form:has(.js-import-json) input[type="submit"]').click();
    await expect(modern.getByRole('heading', { name: 'Map members' })).toBeVisible();
    await expect(modern.locator('.mapping-list')).toContainText(target.username);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-import-member-map.png`, fullPage: true,
      });
    }
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (importedBoardId) db.cleanup({ boardIds: [importedBoardId] });
    if (user) db.cleanup({ userIds: [user._id] });
    db.cleanup({ userIds: [target.id] });
  }
});
