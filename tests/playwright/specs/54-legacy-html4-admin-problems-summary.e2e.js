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
  const reportIds = Array.from({ length: 12 }, (_, index) =>
    `${eventId}-report-${index}`);
  const officeUserIds = Array.from({ length: 26 }, (_, index) =>
    `${eventId}-office-user-${index}`);
  const officeAddressIds = Array.from({ length: 26 }, (_, index) =>
    `${eventId}-office-address-${index}`);
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

    db.insertMany('eventlog', reportIds.map((id, index) => ({
      _id: id,
      stream: 'security',
      at: new Date(Date.now() + index),
      severity: index % 2 ? 'high' : 'medium',
      category: 'authz',
      bleed: `PagedSummary${index}`,
      action: 'blocked',
      source: `html4-event-report-${suffix}`,
      username,
      ipv4: '192.0.2.10',
      ipv6: '2001:db8::10',
      location: { country: 'FI', city: 'Helsinki' },
      count: index + 1,
      detail: `Searchable report ${suffix} row ${index}`,
    })));
    const securityNav = legacy
      .locator('form[action="/admin/problems/security-report"]')
      .first();
    await Promise.all([
      legacy.waitForNavigation(),
      securityNav.locator('input[type="submit"]').click(),
    ]);
    const reportSearch = legacy.locator('form:has(input[name="q"][type="text"])');
    await reportSearch.locator('input[name="q"][type="text"]').fill(suffix);
    await Promise.all([
      legacy.waitForNavigation(),
      reportSearch.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('thead')).toContainText('IPv4-osoite');
    await expect(legacy.locator('thead')).toContainText('IPv6-osoite');
    await expect(legacy.locator('tbody')).toContainText('Helsinki');
    await expect(legacy.locator('tbody')).toContainText('1 / 2');
    const nextPage = legacy.locator(
      'form:has(input[name="page"][value="2"])',
    );
    await Promise.all([
      legacy.waitForNavigation(),
      nextPage.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('tbody')).toContainText('2 / 2');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-security-report.png`,
        fullPage: true,
      });
    }

    const officeAt = new Date();
    db.insertMany('users', officeUserIds.map((id, index) => {
      const address = `198.51.100.${index + 1}`;
      return {
        _id: id,
        username: `office_${suffix}_${String(index).padStart(2, '0')}`,
        profile: { fullname: `Office Person ${suffix} ${index}` },
        loginAddresses: { entries: { address: {
          value: address, family: 'ipv4', count: index + 1,
          firstAt: officeAt, at: officeAt,
        } } },
      };
    }));
    db.insertMany('loginAddresses', officeAddressIds.map((id, index) => ({
      _id: id,
      address: `198.51.100.${index + 1}`,
      ipv4: `198.51.100.${index + 1}`,
      ipv6: '',
      location: { country: 'FI', city: `Office City ${suffix} ${index}` },
      locationLabel: `Office City ${suffix} ${index}`,
    })));
    const officesNav = legacy.locator('form[action="/admin/problems/office"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      officesNav.locator('input[type="submit"]').click(),
    ]);
    const officesSearch = legacy.locator('form:has(input[name="q"][type="text"])');
    await officesSearch.locator('input[name="q"][type="text"]').fill(suffix);
    await Promise.all([
      legacy.waitForNavigation(),
      officesSearch.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('thead')).toContainText('IPv4-osoite');
    await expect(legacy.locator('thead')).toContainText('IPv6-osoite');
    await expect(legacy.locator('tbody')).toContainText(`Office City ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText('1 / 2');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-offices.png`,
        fullPage: true,
      });
    }

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
    await navigateInApp(modern, '/admin/problems/security-report');
    await modern.locator('.js-table-page-search').fill(suffix);
    await expect(modern.locator('.table-page-page-info')).toContainText('1 / 2');
    await expect(modern.locator('tbody')).toContainText('Helsinki');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-security-report.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/office');
    await modern.locator('.js-table-page-search').fill(suffix);
    await expect(modern.locator('.table-page-page-info')).toContainText('1 / 2');
    await expect(modern.locator('tbody')).toContainText(`Office City ${suffix}`);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-offices.png`,
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
    db.deleteMany('eventlog', {
      _id: { $in: [eventId, `${eventId}-modern`, ...reportIds] },
    });
    db.deleteMany('eventlogAcks', { stream: 'security' });
    db.deleteMany('loginAddresses', { _id: { $in: officeAddressIds } });
    db.deleteMany('users', { _id: { $in: officeUserIds } });
    if (previousSecurityAck) db.insertOne('eventlogAcks', previousSecurityAck);
    if (user) {
      db.deleteOne('users', { _id: user._id });
    }
  }
});
