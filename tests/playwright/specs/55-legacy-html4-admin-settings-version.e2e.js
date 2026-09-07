'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('Settings Version has equivalent admin-only HTML4 data and version check', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4version${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const legacyContext = await browser.newContext({
    javaScriptEnabled: false,
    locale: 'fi-FI',
  });
  const legacy = await legacyContext.newPage();
  let user;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    db.updateOne('users', { _id: user._id }, {
      $set: { isAdmin: true, 'profile.language': 'fi' },
    });

    const allBoards = legacy.locator('form[action="/allboards"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      allBoards.locator('input[type="submit"]').click(),
    ]);
    const settings = legacy.locator('form[action="/admin/settings/version"]').first();
    await expect(settings).toBeVisible();
    await Promise.all([
      legacy.waitForNavigation(),
      settings.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('h1')).toContainText('Hallintapaneeli / Asetukset');
    for (const text of ['Alusta', 'Käyttöjärjestelmä', 'Meteor', 'Tietokanta', 'Node']) {
      await expect(legacy.locator('tbody')).toContainText(text);
    }
    await expect(legacy.locator('tbody')).toContainText('Reaktiivisuustila');
    await expect(legacy.locator('tbody')).toContainText('DDP');

    const check = legacy.locator(
      'form:has(input[name="legacyOperation"][value="check-newest-versions"])',
    );
    await expect(check).toBeVisible();
    await Promise.all([
      legacy.waitForNavigation(),
      check.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('tbody')).toContainText(
      /WeKan \d+\.\d+|Versionumeroa ei voitu tarkistaa/,
    );

    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-settings-version.png`,
        fullPage: true,
      });
    }

    modernContext = await browser.newContext({ locale: 'fi-FI' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/admin/settings/version');
    await waitForMeteor(modern);
    const modernBody = modern.locator('body');
    for (const text of ['Alusta', 'Käyttöjärjestelmä', 'Meteor', 'Tietokanta', 'Node']) {
      await expect(modernBody).toContainText(text);
    }
    await expect(modernBody).toContainText('Reaktiivisuustila');
    await expect(modern.locator('.info-table tr', {
      hasText: 'WeKan ® Versio',
    }).locator('td')).toContainText(/\d+\.\d+/);
    await expect(modern.locator('.info-table tr', {
      hasText: 'Käyttöjärjestelmäalusta',
    }).locator('td')).not.toHaveText('');
    await expect(modern.locator('.js-check-newest-versions')).toBeVisible();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-settings-version.png`,
        fullPage: true,
      });
    }

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/settings/version`);
    await expect(anonymous.locator('body')).toContainText(
      /Sinulla ei ole oikeutta tarkastella tätä sivua|Not authorized/,
    );
    await expect(anonymous.locator('body')).not.toContainText('Reaktiivisuustila');
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) db.deleteMany('users', { _id: user._id });
  }
});
