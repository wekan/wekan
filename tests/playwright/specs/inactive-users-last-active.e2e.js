'use strict';
// #6783: Admin Panel / People showed "Last active" as "-" for every user but the
// administrator, because the `people` publication did not carry
// lastConnectionDate. #6784: USERS_DISABLE_INACTIVE_AFTER_DAYS is set in Admin
// Panel / People / Login as well as in the environment.
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const db = require('../helpers/db');
const AdminPage = require('../pages/AdminPage');

test('People shows another user\'s Last active, not "-"', async ({ page, adminUser, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { lastConnectionDate: new Date('2026-01-02T10:00:00Z') } });
  await loginWithToken(page, adminUser.id, adminUser.token);
  const ap = new AdminPage(page);
  await ap.navigateToPeople();
  const row = page.locator('table tbody tr', { has: page.locator('td.username', { hasText: user.username }) });
  const cell = row.locator('td.last-active-status');
  await expect(cell).toBeVisible({ timeout: 10_000 });
  await expect(cell).not.toHaveText(/^\s*-\s*$/);
  await expect(cell).toContainText('2026');
});

test('negative: a user who never connected still shows "-"', async ({ page, adminUser, user }) => {
  db.updateOne('users', { _id: user.id }, { $unset: { lastConnectionDate: '' } });
  await loginWithToken(page, adminUser.id, adminUser.token);
  const ap = new AdminPage(page);
  await ap.navigateToPeople();
  const row = page.locator('table tbody tr', { has: page.locator('td.username', { hasText: user.username }) });
  await expect(row.locator('td.last-active-status')).toHaveText(/^\s*-\s*$/, { timeout: 10_000 });
});

test('USERS_DISABLE_INACTIVE_AFTER_DAYS is in Admin Panel / People / Login', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/people/login');
  await expect(page.locator('.js-auth-provider-settings label', { hasText: 'USERS_DISABLE_INACTIVE_AFTER_DAYS' }))
    .toBeVisible({ timeout: 10_000 });
});
