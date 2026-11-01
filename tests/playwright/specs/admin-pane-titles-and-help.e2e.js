'use strict';
// Admin Panel follow-ups that are visible in the browser:
//
//  1. Problems / Password length names itself in the title bar (85af731c1b):
//     without its ADMIN_PANE_TITLES entry the path stopped at "Problems".
//  2. People / Audit log has its own address, /admin/people/audit-log, a title,
//     and a table that aligns to the START of the line, so it reads right to
//     left in Hebrew (2017f2871f): `text-align: left` kept it on the left.
//  3. Attachments / Google Cloud Storage shows the key help ONCE (e6f7d226ca):
//     a leftover copy showed the same sentence twice under the field.
//  4. Problems / Summary's Data health "Never" has a key of its own
//     (77956c98ed): an admin's custom translation of List Sync's "never synced"
//     must not change what Data health's "Last Run" says.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

const setLanguage = (userId, language) =>
  db.updateOne('users', { _id: userId }, { $set: { 'profile.language': language } });

test('Problems / Password length names itself in the title bar', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/problems/password-length');
  await expect(page.locator('.js-password-min-length')).toBeVisible({ timeout: 20_000 });
  const title = page.locator('#header-quick-access .header-page-title, .header-page-title').first();
  await expect(title).toHaveAttribute('title', /\/ Problems \/ Password length$/, { timeout: 10_000 });
});

test('People / Audit log has its own URL and title, and reads right to left', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/people/audit-log');
  const table = page.locator('table.admin-audit-log-table');
  await expect(table).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/admin\/people\/audit-log$/);
  const title = page.locator('.header-page-title').first();
  await expect(title).toHaveAttribute('title', /\/ People \/ Audit log$/, { timeout: 10_000 });

  // Hebrew is written right to left: the header cells' text sits at the RIGHT
  // edge of each cell, which `text-align: left` would not do.
  setLanguage(adminUser.id, 'he');
  await page.reload();
  await navigateInApp(page, '/admin/people/audit-log');
  await expect(table).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => getComputedStyle(
    document.querySelector('.admin-audit-log-table th')).direction), { timeout: 15_000 }).toBe('rtl');
  const placement = await page.evaluate(() => {
    const th = document.querySelector('.admin-audit-log-table th');
    const style = getComputedStyle(th);
    const range = document.createRange();
    range.selectNodeContents(th);
    const text = range.getBoundingClientRect();
    const cell = th.getBoundingClientRect();
    return {
      textAlign: style.textAlign,
      gapRight: cell.right - parseFloat(style.paddingRight) - text.right,
      gapLeft: text.left - cell.left - parseFloat(style.paddingLeft),
    };
  });
  expect(placement.textAlign).toBe('start');
  expect(Math.abs(placement.gapRight)).toBeLessThan(2);
  expect(placement.gapLeft).toBeGreaterThan(2);
});

test('Attachments / Google Cloud Storage shows the key help once', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/attachments/gcs');
  const field = page.locator('#gcs-credentials');
  await expect(field).toBeAttached({ timeout: 20_000 });
  const help = 'Optional: paste the service account JSON key. Leave blank to use the key file or default credentials.';
  const group = page.locator('.form-group', { has: field });
  await expect(group.getByText(help, { exact: true })).toHaveCount(1);
  await expect(page.getByText(help, { exact: true })).toHaveCount(1);
});

test('Problems / Summary: Data health "Never" is not List Sync\'s "never synced"', async ({ page, adminUser }) => {
  const scan = db.findOne('dataHealth', { _id: 'scan' });
  const ids = [`e2e-never-sync-${adminUser.id}`, `e2e-never-run-${adminUser.id}`];
  setLanguage(adminUser.id, 'fi');
  try {
    // A scan that never ran, and an admin's custom wording of BOTH keys: the
    // List Sync one says "never synced", Data health's own says "never run".
    // Data health must show its own - and showing it at all proves the custom
    // wording reaches this page, so the List Sync one would have shown too had
    // the page still borrowed that key.
    if (scan) db.updateOne('dataHealth', { _id: 'scan' }, { $unset: { at: '' } });
    const now = new Date();
    db.insertMany('translation', [
      { _id: ids[0], language: 'fi', text: 'list-sync-last-synced-never',
        translationText: 'Ei koskaan synkronoitu', createdAt: now, modifiedAt: now },
      { _id: ids[1], language: 'fi', text: 'data-health-never-run',
        translationText: 'Ei koskaan ajettu', createdAt: now, modifiedAt: now },
    ]);
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/summary');
    const lastRun = page.locator('p.quiet', { hasText: 'Viimeksi ajettu:' }).first();
    await expect(lastRun).toHaveText('Viimeksi ajettu: Ei koskaan ajettu', { timeout: 20_000 });
    await expect(lastRun).not.toContainText('synkronoitu');
  } finally {
    db.deleteMany('translation', { _id: { $in: ids } });
    if (scan && scan.at) db.updateOne('dataHealth', { _id: 'scan' }, { $set: { at: new Date(scan.at) } });
  }
});
