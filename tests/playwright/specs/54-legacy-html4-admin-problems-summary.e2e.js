'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Problems Summary has equivalent admin-only HTML4 reads and acknowledgement', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4admin${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const eventId = `html4-problem-${suffix}`;
  const legacyContext = await browser.newContext({
    javaScriptEnabled: false,
    locale: 'fi-FI',
  });
  const legacy = await legacyContext.newPage();
  let user;
  let modernContext;
  const previousSecurityAck = db.findOne('eventlogAcks', {
    stream: 'security',
  });
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy
      .locator('input[name="email"]')
      .fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    db.updateOne(
      'users',
      { _id: user._id },
      {
        $set: { isAdmin: true, 'profile.language': 'fi' },
      },
    );
    db.insertOne('eventlog', {
      _id: eventId,
      stream: 'security',
      at: new Date(),
      severity: 'high',
      category: 'authz',
      bleed: 'LegacySummaryTest',
      action: 'blocked',
      source: 'html4-admin-summary-test',
      detail: `Summary event ${suffix}`,
    });

    const allBoards = legacy.locator('form[action="/allboards"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      allBoards.locator('input[type="submit"]').click(),
    ]);
    const adminNav = legacy
      .locator('form[action="/admin/problems/summary"]')
      .first();
    await expect(adminNav).toBeVisible();
    await Promise.all([
      legacy.waitForNavigation(),
      adminNav.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('h1')).toContainText(
      'Hallintapaneeli / Ongelmat / Yhteenveto',
    );
    await expect(legacy.locator('tbody')).toContainText('Tietoturva');
    await expect(
      legacy.locator('input[name="problemStreams"][value="security"]'),
    ).toBeVisible();
    await expect(
      legacy.locator(
        'form:has(input[name="legacyOperation"][value="repair-broken-cards"])',
      ),
    ).toHaveCount(0);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-problems-summary.png`,
        fullPage: true,
      });
    }

    const acknowledge = legacy.locator(
      'form:has(input[name="legacyOperation"][value="acknowledge-problems"])',
    );
    await acknowledge
      .locator('input[name="problemStreams"][value="security"]')
      .check();
    await Promise.all([
      legacy.waitForNavigation(),
      acknowledge.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('tbody')).toContainText('Kuittaa');
    await expect(
      legacy.locator('input[name="problemStreams"][value="security"]'),
    ).toHaveCount(0);

    modernContext = await browser.newContext({ locale: 'fi-FI' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    db.insertOne('eventlog', {
      _id: `${eventId}-modern`,
      stream: 'security',
      at: new Date(),
      severity: 'high',
      category: 'authz',
      bleed: 'ModernSummaryTest',
      action: 'blocked',
      source: 'html5-admin-summary-test',
      detail: `Modern event ${suffix}`,
    });
    await navigateInApp(modern, '/admin/problems/summary');
    await expect(modern.locator('h1').first()).toContainText('Yhteenveto');
    await expect(modern.locator('.admin-problem-banner')).toContainText(
      'Tietoturva',
    );
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-problems-summary.png`,
        fullPage: true,
      });
    }

    const outsider = await browser.newContext({ javaScriptEnabled: false });
    const outsiderPage = await outsider.newPage();
    await outsiderPage.goto(`${baseURL}/admin/problems/summary`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText(
      'ModernSummaryTest',
    );
    await outsider.close();
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    db.deleteMany('eventlog', { _id: { $in: [eventId, `${eventId}-modern`] } });
    db.deleteMany('eventlogAcks', { stream: 'security' });
    if (previousSecurityAck) db.insertOne('eventlogAcks', previousSecurityAck);
    if (user) {
      db.deleteOne('users', { _id: user._id });
    }
  }
});
