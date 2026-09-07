'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('People Domains has equivalent searchable paged HTML4 content', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const prefix = `html4domain${suffix}`.toLowerCase();
  const username = `html4domains${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const seeded = Array.from({ length: 12 }, (_, index) => db.seedUser());
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let admin;
  let modernContext;
  try {
    seeded.forEach((user, index) => db.updateOne('users', { _id: user.id }, {
      $set: { 'emails.0.address': `person${index}@${prefix}-${String(index).padStart(2, '0')}.invalid` },
    }));
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    admin = db.findOne('users', { username });
    db.updateOne('users', { _id: admin._id }, {
      $set: { isAdmin: true, loginDisabled: false, 'profile.language': 'en' },
    });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/people/people"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/people/domains"] input[type="submit"]').first().click()]);
    const search = legacy.locator('form[action="/admin/people/domains"]:has(#legacy-search-query)');
    await search.locator('input[name="q"]').fill(prefix);
    await Promise.all([legacy.waitForNavigation(), search.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('body')).toContainText(`12 Domains`);
    await expect(legacy.locator('body')).toContainText('Page 1 / 2');
    await expect(legacy.getByText(`${prefix}-00.invalid`, { exact: true })).toHaveCount(1);
    const next = legacy.locator('form:has(input[name="page"][value="2"])');
    await Promise.all([legacy.waitForNavigation(), next.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('body')).toContainText('Page 2 / 2');
    await expect(legacy.getByText(`${prefix}-11.invalid`, { exact: true })).toHaveCount(1);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-people-domains.png`, fullPage: true,
      });
    }

    modernContext = await browser.newContext({ locale: 'en-US',
      viewport: { width: 1280, height: 1800 } });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, admin._id, db.addResumeToken(admin._id));
    await navigateInApp(modern, '/admin/people/domains');
    await waitForMeteor(modern);
    const modernSearch = modern.locator('.js-table-page-search');
    await modernSearch.fill(prefix);
    await modernSearch.press('Enter');
    await expect(modern.locator('.table-page-total')).toContainText('12');
    await expect(modern.locator('.table-page-pagination')).toContainText('1 / 2');
    await expect(modern.locator('td', { hasText: `${prefix}-00.invalid` })).toHaveCount(1);
    await modern.locator('.js-table-page-next').click();
    await expect(modern.locator('td', { hasText: `${prefix}-11.invalid` })).toHaveCount(1);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) await modern.screenshot({
      path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-people-domains.png`, fullPage: true,
    });

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/people/domains`);
    await expect(anonymous.locator('body')).toContainText(/not authorized/i);
    await expect(anonymous.locator('body')).not.toContainText(prefix);
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    db.cleanup({ userIds: [...seeded.map(user => user.id), ...(admin?._id ? [admin._id] : [])] });
  }
});
