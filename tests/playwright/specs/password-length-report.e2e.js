'use strict';
// Admin Panel / Problems / Password length
// (docs/Features/Admin-Panel/Problems/Password-length.md): each setting changed
// through the page itself, and what it does.
//
//  1. The minimum length, saved on the page, decides what is REPORTED: a
//     sign-in shorter than it is listed, one long enough is not - and with
//     enforcement off nothing is refused.
//  2. Enforcement, switched on on the page, refuses a shorter sign-up and makes
//     a short-password account change it; switched off again, it does neither.
//  3. The table: one row per account whose count grows, the address and both
//     sign-in times; the filter is Too short (default), Fixed and All, and a
//     changed password moves the row from Too short to Fixed.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, loginWithCredentials, logout, waitForMeteor } = require('../helpers/auth');


const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const PAGE = `${BASE_URL}/admin/problems/password-length`;
const resetLockout = () => db.deleteMany('AccountsLockout.Connections',
  { clientAddress: { $in: ['127.0.0.1', '::1', '::ffff:127.0.0.1'] } });
const loginOptions = () => db.findOne('settings', {}).loginOptions || {};
const reportOf = userId => db.findOne('shortPasswordLogins', { userId });

let setting;
test.beforeEach(() => {
  setting = db.findOne('settings', {});
  resetLockout();
});
test.afterEach(() => {
  db.updateOne('settings', { _id: setting._id }, {
    $set: { loginOptions: setting.loginOptions || {}, disableRegistration: !!setting.disableRegistration },
  });
  resetLockout();
});

async function openPage(page, admin) {
  await loginWithToken(page, admin.id, admin.token);
  await page.goto(PAGE);
  await expect(page.locator('.js-password-min-length')).toBeVisible({ timeout: 20_000 });
}

async function save(page, { min, enforce }) {
  if (min !== undefined) await page.locator('.js-password-min-length').fill(String(min));
  if (enforce !== undefined) {
    const box = page.locator('.js-toggle-password-min-length-enforce .materialCheckBox');
    const checked = await box.evaluate(el => el.classList.contains('is-checked'));
    if (checked !== enforce) await page.locator('.js-toggle-password-min-length-enforce').click();
  }
  await page.locator('.js-save-password-length').click();
  await expect(page.locator('.password-length-saved')).toBeVisible();
}

// A password account with a known password, set from the admin's page (the
// admin method signs the account out everywhere, never the admin).
async function withPassword(adminPage, user, password) {
  await adminPage.evaluate(async ({ id, pw }) => Meteor.callAsync('setPassword', pw, id), { id: user.id, pw: password });
}

test('the minimum length decides what is reported; nothing is refused unless enforced', async ({ page, browser, adminUser, user }) => {
  db.updateOne('settings', { _id: setting._id }, { $unset: { 'loginOptions.passwordMinLength': '', 'loginOptions.passwordMinLengthEnforce': '' } });
  await openPage(page, adminUser);
  await expect(page.locator('.js-password-min-length')).toHaveValue('8', { timeout: 10_000 });
  await save(page, { min: 12, enforce: false });
  expect(loginOptions().passwordMinLength).toBe(12);
  expect(loginOptions().passwordMinLengthEnforce).toBe(false);

  // 11 characters: below 12, reported, and the account is not asked to change.
  const context = await browser.newContext({ baseURL: BASE_URL });
  const other = await context.newPage();
  try {
    await withPassword(page, user, 'Eleven-1234');
    await loginWithCredentials(other, user.username, 'Eleven-1234');
    await expect.poll(() => reportOf(user.id)?.count, { timeout: 20_000 }).toBe(1);
    await other.waitForTimeout(1500);
    await expect(other.locator('.password-change-required')).toHaveCount(0);

    // Lower the minimum to 10 on the page: the same password is long enough now.
    await save(page, { min: 10 });
    await logout(other);
    resetLockout();
    await loginWithCredentials(other, user.username, 'Eleven-1234');
    await other.waitForTimeout(2500);
    expect(reportOf(user.id).count, 'not reported again').toBe(1);
  } finally {
    await context.close();
    db.deleteMany('shortPasswordLogins', { userId: user.id });
  }
});

test('enforcing, switched on and off on the page, refuses a short sign-up and forces the change', async ({ page, browser, adminUser, user }) => {
  db.updateOne('settings', { _id: setting._id }, { $set: { disableRegistration: false } });
  await openPage(page, adminUser);
  await save(page, { min: 10, enforce: false });
  // Set while not enforced: enforced, the admin's Set password refuses it too.
  await withPassword(page, user, 'Short-7');
  await save(page, { enforce: true });
  expect(loginOptions().passwordMinLengthEnforce).toBe(true);
  const names = [];
  const signUp = async (username, password, fieldMin) => {
    names.push(username);
    const context = await browser.newContext({ baseURL: BASE_URL });
    const p = await context.newPage();
    await p.goto(`${BASE_URL}/sign-up`);
    await waitForMeteor(p);
    // The form learns the policy just after loading, before a person has typed.
    await expect.poll(() => p.evaluate(() => AccountsTemplates.getField('password').minLength)).toBe(fieldMin);
    await p.locator('#at-field-username').fill(username);
    await p.locator('#at-field-email').fill(`${username}@example.com`);
    await p.locator('#at-field-password').fill(password);
    await p.locator('#at-field-password_again').fill(password);
    await p.waitForTimeout(1000);
    await p.locator('#at-btn').click();
    await p.waitForTimeout(2500);
    await context.close();
    return !!db.findOne('users', { username });
  };
  try {
    expect(await signUp(`enforce${Date.now()}a`, 'Nine-1234', 10), 'enforced: 9 < 10 refused').toBe(false);
    expect(await signUp(`enforce${Date.now()}b`, 'Ten-123456', 10), 'enforced: 10 accepted').toBe(true);

    // A short-password account must change it while enforced.
    const context = await browser.newContext({ baseURL: BASE_URL });
    const other = await context.newPage();
    try {
      await loginWithCredentials(other, user.username, 'Short-7');
      await expect(other.locator('.password-change-required')).toBeVisible({ timeout: 20_000 });

      // Switched off on the page: refused no more, and not asked to change.
      await save(page, { enforce: false });
      expect(loginOptions().passwordMinLengthEnforce).toBe(false);
      expect(await signUp(`enforce${Date.now()}c`, 'Nine-1234', 6), 'not enforced: the form\'s own 6').toBe(true);
      await other.reload();
      await waitForMeteor(other);
      await other.waitForTimeout(2500);
      await expect(other.locator('.password-change-required')).toHaveCount(0);
    } finally {
      await context.close();
    }
  } finally {
    db.deleteMany('users', { username: { $in: names } });
    db.deleteMany('shortPasswordLogins', { userId: user.id });
  }
});

test('the table: one row per account, the filter, and a changed password moves it to Fixed', async ({ page, browser, adminUser, user }) => {
  await openPage(page, adminUser);
  await save(page, { min: 8, enforce: false });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const other = await context.newPage();
  const NEW = 'A-long-enough-password-1';
  try {
    await withPassword(page, user, 'Short-7');
    for (let i = 1; i <= 2; i++) {
      resetLockout();
      await loginWithCredentials(other, user.username, 'Short-7');
      await expect.poll(() => reportOf(user.id)?.count, { timeout: 20_000 }).toBe(i);
      if (i === 1) await logout(other);
    }
    const report = reportOf(user.id);
    expect(report.ipv4 || report.ipv6, 'the address it came from').toBeTruthy();
    expect(new Date(report.at) >= new Date(report.firstAt)).toBe(true);

    const filter = page.locator('select.js-table-page-filter[data-filter="password-length-status"]');
    const row = page.locator('tbody tr', { hasText: user.username });
    await page.reload();
    await expect(filter).toHaveValue('short');
    await expect(row).toBeVisible({ timeout: 20_000 });
    await expect(row).toContainText('2');
    await expect(row).toContainText(report.ipv4 || report.ipv6);

    // The account changes its own password: Fixed, and every session is signed out.
    await other.locator('.js-open-header-member-menu').first().click();
    await other.locator('a.js-change-password').click();
    await other.locator('#at-field-current_password').fill('Short-7');
    await other.locator('#at-field-password').fill(NEW);
    const again = other.locator('#at-field-password_again');
    if (await again.count()) await again.fill(NEW);
    await other.locator('#at-btn').click();
    await expect.poll(() => reportOf(user.id)?.fixedAt, { timeout: 20_000 }).toBeTruthy();

    await page.reload();
    await expect(filter).toHaveValue('short');
    await expect(row).toHaveCount(0);
    await filter.selectOption('fixed');
    await expect(row).toBeVisible({ timeout: 20_000 });
    await filter.selectOption('all');
    await expect(row).toBeVisible();

    // Signing in with a short password again reopens it.
    await withPassword(page, user, 'Short-7');
    resetLockout();
    await loginWithCredentials(other, user.username, 'Short-7');
    await expect.poll(() => reportOf(user.id)?.fixedAt ?? null, { timeout: 20_000 }).toBe(null);
  } finally {
    await context.close();
    db.deleteMany('shortPasswordLogins', { userId: user.id });
  }
});
