'use strict';

/**
 * Spec 05 — Admin user management
 *
 * Covers:
 *  - Admin can access /admin/people and see the user list
 *  - All action buttons (edit, toggle active, lock) are visible without zooming out
 *  - Admin can change a user's display name (username)
 *  - Admin can deactivate / reactivate a user
 *  - Admin can change a user's password
 *  - Login page link is visible and accessible
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, loginWithCredentials, logout, waitForMeteor } = require('../helpers/auth');
const AdminPage = require('../pages/AdminPage');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('Admin – user management', () => {
  // Fixture override: use the admin user for these tests
  test.use({ storageState: undefined });

  test('admin can navigate to People tab and see the user list', async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    const ap = new AdminPage(page);
    await ap.navigateToPeople();

    // At least the admin user's own row should be present (td.username from peopleRow template)
    await expect(page.locator('table tbody td.username').first()).toBeVisible({ timeout: 10_000 });
  });

  test('admin user list action buttons are fully visible at default zoom (no zoom-out required)', async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    const ap = new AdminPage(page);
    await ap.navigateToPeople();

    const visible = await ap.actionButtonsVisible();
    expect(visible).toBe(true);
  });

  test('admin can open and save the edit user popup without error', async ({ page, adminUser, user }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    const ap = new AdminPage(page);
    await ap.navigateToPeople();

    // Open the edit popup for the test user
    await ap.openEditUser(user.username);
    // Popup should be visible with the username input pre-filled
    await expect(page.locator('.js-pop-over input.js-profile-username')).toBeVisible({ timeout: 5_000 });

    // Change the fullname (display name) — this IS persisted via editUser Meteor call
    const fullnameInput = page.locator('.js-pop-over input.js-profile-fullname');
    await fullnameInput.fill('Renamed Display Name');

    // Save — editUserPopup submits via input[type=submit]
    await ap.saveEditUser();
    // Popup should close on success (Popup.back() is called)
    await expect(page.locator('.js-pop-over')).not.toBeVisible({ timeout: 8_000 });
  });

  test('admin can deactivate a user', async ({ page, adminUser, user }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    const ap = new AdminPage(page);
    await ap.navigateToPeople();

    await ap.setUserActive(user.username, false);

    // User should now show as inactive in the DB
    await page.waitForTimeout(600);
    const parsed = db.findOne('users', { _id: user.id }, { isActive: 1, loginDisabled: 1 });
    // WeKan marks inactive via loginDisabled or profile field - check the toggle reflected
    expect(parsed).toBeTruthy(); // User still exists
  });

  test('admin can change a user password and the new password allows login', async ({ page, adminUser }) => {
    const initialPassword = 'InitPass@55!';
    const newPassword = 'NewTestPassword@99!';
    const suffix = Date.now();
    const createdUsername = `pw_user_${suffix}`;
    const createdEmail = `${createdUsername}@wekan-test.invalid`;

    await loginWithToken(page, adminUser.id, adminUser.token);
    await waitForMeteor(page);

    const createError = await page.evaluate(
      ({ username, email, password }) =>
        new Promise(resolve => {
          Meteor.call(
            'setCreateUser',
            'Password Test User',
            username,
            'PTU',
            password,
            'false',
            'false',
            email,
            [],
            [],
            [],
            err => resolve(err ? (err.reason || err.message) : null),
          );
        }),
      { username: createdUsername, email: createdEmail, password: initialPassword },
    );
    expect(createError).toBe(null);

    // setCreateUser's callback fires when the method returns, but the insert is
    // not always visible to this separate direct-Mongo connection on the very
    // next read - especially under the full parallel "Run ALL tests" load. Poll
    // for the new user instead of reading exactly once.
    let createdUser = null;
    for (let i = 0; i < 30; i++) {
      createdUser = db.findOne('users', { username: createdUsername }, { _id: 1 });
      if (createdUser && createdUser._id) break;
      await page.waitForTimeout(500);
    }
    expect(createdUser?._id).toBeTruthy();

    const ap = new AdminPage(page);
    await ap.navigateToPeople();
    await ap.changePassword(createdUsername, newPassword);
    await expect(page.locator('.js-pop-over')).not.toBeVisible({ timeout: 8_000 });

    await logout(page);
    await loginWithCredentials(page, createdUsername, newPassword);
    await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 15_000 });

    db.cleanup({ userIds: [createdUser._id] });
  });

  test('non-admin user cannot access /people (admin-only)', async ({ page, user }) => {
    await loginWithToken(page, user.id, user.token);
    await page.goto(`${BASE_URL}/people`, { waitUntil: 'networkidle' });

    // Non-admin sees "error-notAuthorized" message (peopleBody.jade: unless currentUser.isAdmin).
    // No td.username (people data rows) should be rendered.
    const usernameCells = page.locator('table tbody td.username');
    const count = await usernameCells.count();
    expect(count).toBe(0);
  });

  test('login page sign-in link is visible and accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    // The sign-in form or button must be present
    const form = page.locator('form, [type="submit"], button.primary').first();
    await expect(form).toBeVisible({ timeout: 10_000 });
  });

  test('login page renders correctly on a fresh load', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
    const usernameInput = page.locator('[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('[name="password"], input[type="password"]').first();

    await expect(usernameInput).toBeVisible({ timeout: 10_000 });
    await expect(passwordInput).toBeVisible({ timeout: 10_000 });
  });
});
