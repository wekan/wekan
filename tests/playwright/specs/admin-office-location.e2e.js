'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Offices shows recorded flag and city and wraps a long IPv6 address', async ({ page, adminUser }) => {
  const address = '2001:db8:1234:5678:abcd:ef01:2345:6789';
  const location = { country: 'FI', city: 'Helsinki' };
  const key = db.uid('login');
  const at = new Date();
  db.updateOne('users', { _id: adminUser.id }, { $set: {
    [`loginAddresses.entries.${key}`]: { value: address, family: 'ipv6', count: 2,
      firstAt: at, at, location },
  } });
  db.insertOne('loginAddresses', { _id: db.uid('office'), address, ipv6: address,
    location, count: 2, firstAt: at, at, users: { entries: {} } });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/office');
    const search = page.locator('.js-table-page-search');
    await search.fill(adminUser.username);
    await search.press('Enter');
    const row = page.locator('.table-page-table tbody tr').filter({ hasText: address });
    await expect(row).toContainText('🇫🇮');
    await expect(row).toContainText('Helsinki');
    const headers = await page.locator('.table-page-table thead th').allTextContents();
    expect(headers.slice(1, 5).map(text => text.trim())).toEqual([
      // 'location' + " (IPv6)": translated in every language, not English text.
      'IPv4 address', 'Location', 'IPv6 address', 'Location (IPv6)',
    ]);
    await expect(row.locator('td').nth(1)).toBeEmpty();
    await expect(row.locator('td').nth(2)).toBeEmpty();
    await expect(row.locator('td').nth(4)).toContainText('Helsinki');
    const wrapping = await row.locator('td').filter({ hasText: address }).evaluate(
      cell => ({ whiteSpace: getComputedStyle(cell).whiteSpace,
        overflowWrap: getComputedStyle(cell).overflowWrap }));
    expect(wrapping).toEqual({ whiteSpace: 'normal', overflowWrap: 'anywhere' });
  } finally {
    db.deleteOne('loginAddresses', { address });
    db.updateOne('users', { _id: adminUser.id }, { $unset: { [`loginAddresses.entries.${key}`]: '' } });
  }
});


test('Latin offices report distinguishes first and last observed logins', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/admin/problems/office');
  const headers = page.locator('.table-page-table thead');
  await expect(headers).toContainText('Ingressus');
  await expect(headers).toContainText('Primum visum');
  await expect(headers).toContainText('Ultimum visum');
  await expect(headers).not.toContainText('First seen');
  await expect(headers).not.toContainText('Last seen');
});
