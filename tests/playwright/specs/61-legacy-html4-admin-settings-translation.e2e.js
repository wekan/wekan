'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('Settings Translation has equivalent complete HTML4 operations', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = db.uniqueSuffix();
  const username = `html4translation${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const pageMarker = `Html4Page${suffix}`;
  const literalText = `Html4 literal [x] ${suffix}`;
  const changedText = `Muokattu ${suffix}`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'fi-FI' });
  const legacy = await legacyContext.newPage();
  let user;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    db.updateOne('users', { _id: user._id }, {
      $set: { isAdmin: true, loginDisabled: false, 'profile.language': 'fi' },
    });
    const now = Date.now() - 60_000;
    db.insertMany('translation', Array.from({ length: 27 }, (_, index) => ({
      language: 'fi', text: `${pageMarker} ${String(index).padStart(2, '0')}`,
      translationText: `Sivu ${index}`, createdAt: new Date(now + index),
      modifiedAt: new Date(now + index),
    })));

    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/settings/version"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/settings/translation"] input[type="submit"]').first().click()]);

    const create = legacy.locator('form:has(input[name="legacyOperation"][value="create-translation"])');
    await create.locator('input[name="language"]').fill('fi');
    await create.locator('input[name="text"]').fill(literalText);
    await create.locator('textarea[name="translationText"]').fill(`Alku ${suffix}`);
    await Promise.all([legacy.waitForNavigation(), create.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('translation', { text: literalText })?.translationText)
      .toBe(`Alku ${suffix}`);
    const created = db.findOne('translation', { text: literalText });
    expect(created.createdAt).toBeTruthy();
    expect(created.modifiedAt).toBeTruthy();

    let edit = legacy.locator(`form:has(input[name="translationId"][value="${created._id}"]):has(input[name="legacyOperation"][value="update-translation"])`);
    await edit.locator('input[name="translationText"]').fill(changedText);
    await Promise.all([legacy.waitForNavigation(), edit.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('translation', { _id: created._id })?.translationText)
      .toBe(changedText);

    let search = legacy.locator('form:has(input[name="legacyOperation"][value="search-translations"])');
    await search.locator('input[name="q"]').fill('[x]');
    await Promise.all([legacy.waitForNavigation(), search.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('body')).toContainText(literalText);
    await expect(legacy.locator('body')).not.toContainText(pageMarker);

    search = legacy.locator('form:has(input[name="legacyOperation"][value="search-translations"])');
    await search.locator('input[name="q"]').fill(pageMarker);
    await Promise.all([legacy.waitForNavigation(), search.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('body')).toContainText('1 / 2');
    const next = legacy.locator('form:has(input[name="legacyOperation"][value="translation-page"]):has(input[name="page"][value="2"])');
    await Promise.all([legacy.waitForNavigation(), next.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('body')).toContainText('2 / 2');

    search = legacy.locator('form:has(input[name="legacyOperation"][value="search-translations"])');
    await search.locator('input[name="q"]').fill('[x]');
    await Promise.all([legacy.waitForNavigation(), search.locator('input[type="submit"]').click()]);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-translation.png`, fullPage: true,
      });
    }

    modernContext = await browser.newContext({ locale: 'en-US',
      viewport: { width: 1280, height: 1800 } });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/admin/settings/translation');
    await waitForMeteor(modern);
    const modernSearch = modern.locator('.js-table-page-search');
    await modernSearch.fill('[x]');
    await modernSearch.press('Enter');
    await expect(modern.locator('body')).toContainText(literalText);
    await expect(modern.locator('body')).toContainText(changedText);
    await modernSearch.fill(pageMarker);
    await modernSearch.press('Enter');
    await expect(modern.locator('body')).toContainText('1 / 2');
    await modernSearch.fill('[x]');
    await modernSearch.press('Enter');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) await modern.screenshot({
      path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-translation.png`, fullPage: true,
    });

    const requestDelete = legacy.locator(`form:has(input[name="translationId"][value="${created._id}"]):has(input[name="legacyOperation"][value="request-delete-translation"])`);
    await Promise.all([legacy.waitForNavigation(),
      requestDelete.locator('input[type="submit"]').click()]);
    expect(db.findOne('translation', { _id: created._id })).toBeTruthy();
    const confirmDelete = legacy.locator(`form:has(input[name="translationId"][value="${created._id}"]):has(input[name="legacyOperation"][value="delete-translation"])`);
    await expect(confirmDelete).toHaveCount(1);
    await Promise.all([legacy.waitForNavigation(),
      confirmDelete.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('translation', { _id: created._id })).toBeNull();

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/settings/translation`);
    await expect(anonymous.locator('body')).toContainText(/Sinulla ei ole oikeutta|Not authorized/);
    await expect(anonymous.locator('body')).not.toContainText(pageMarker);
  } finally {
    db.deleteMany('translation', { $or: [
      { text: { $regex: `^${pageMarker}` } }, { text: literalText },
    ] });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) db.deleteMany('users', { _id: user._id });
  }
});
