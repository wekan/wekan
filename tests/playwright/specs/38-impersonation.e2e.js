'use strict';

/**
 * Spec 38 — GlobalAdmin impersonation (#5799 follow-up)
 *
 * Covers:
 *  - A GlobalAdmin can impersonate a user from Admin Panel > People (the
 *    more-settings "⋯" menu → "Impersonate user").
 *  - After impersonating, the connection's user becomes the impersonated user
 *    (Meteor.userId() === user.id) and an impersonatedUsers audit record is
 *    written ({ adminId, userId, reason: 'clickedImpersonate' }).
 *  - Board data access then acts as the impersonated user: a board the admin is
 *    NOT a member of (owned by the impersonated user) becomes visible on the
 *    All Boards page — without a full page reload, which would reset the
 *    connection-scoped impersonation back to the admin.
 *  - A non-admin user cannot impersonate (server rejects with Permission
 *    denied) and their session is unchanged.
 *
 * Note: impersonation uses Meteor's connection-scoped setUserId(), so it does
 * NOT survive a full page navigation/reload. These tests therefore navigate
 * within the SPA (clicking) after impersonating, never page.goto().
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, waitForMeteor } = require('../helpers/auth');
const AdminPage = require('../pages/AdminPage');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

// Read the current client-side Meteor user id.
const clientUserId = page => page.evaluate(() => Meteor.userId());

test.describe('GlobalAdmin impersonation', () => {
  test.use({ storageState: undefined });

  test.afterEach(async ({ adminUser }) => {
    // Clean up ONLY this test's impersonation audit records. adminUser.id is a
    // random per-test id, so scoping the delete to it keeps concurrent browser
    // processes (Chromium/Firefox/WebKit share one server+DB in the parallel
    // run) from deleting each other's in-flight records — a global
    // { reason: 'clickedImpersonate' } delete raced the audit-record poll below.
    db.deleteMany('impersonatedUsers', { adminId: adminUser.id, reason: 'clickedImpersonate' });
  });

  test('admin impersonates a user; session + board data act as that user', async ({ page, adminUser, user, board }) => {
    const boardTitle = `E2E Board ${board.boardId}`;

    await loginWithToken(page, adminUser.id, adminUser.token);
    const ap = new AdminPage(page);
    await ap.navigateToPeople();

    // Open the "⋯" more-settings menu for the test user and click Impersonate.
    const row = ap.userRowByUsername(user.username);
    await row.locator('a.more-settings-user').first().click();
    await page.locator('.js-pop-over a.impersonate-user').waitFor({ timeout: 10_000 });
    await page.locator('.js-pop-over a.impersonate-user').click();

    // Impersonation redirects to the All Boards page (FlowRouter.go('/')).
    await page.waitForURL(url => !/\/people/.test(url.href), { timeout: 15_000 });
    await waitForMeteor(page);

    // The client connection is now the impersonated user.
    await expect.poll(() => clientUserId(page), { timeout: 15_000 }).toBe(user.id);

    // An audit record was written linking the admin to the impersonated user.
    await expect
      .poll(
        () =>
          db.findOne(
            'impersonatedUsers',
            { adminId: adminUser.id, userId: user.id, reason: 'clickedImpersonate' },
            { _id: 1 },
          )?._id || null,
        { timeout: 10_000 },
      )
      .not.toBeNull();

    // Board data now acts as the impersonated user: the board owned by `user`
    // (the admin is NOT a member of it) is reachable. Switch to the "Remaining"
    // sub-view in-SPA (no reload) and confirm the board appears.
    const remaining = page.locator('.js-select-menu[data-type="remaining"]');
    if (await remaining.count()) {
      await remaining.first().click();
    }
    await expect(page.locator('.board-list-item-name', { hasText: boardTitle }).first())
      .toBeVisible({ timeout: 15_000 });
  });

  test('non-admin user cannot impersonate', async ({ page, user, user2 }) => {
    await loginWithToken(page, user.id, user.token);
    await waitForMeteor(page);

    const err = await page.evaluate(
      targetId =>
        new Promise(resolve => {
          Meteor.call('impersonate', targetId, e =>
            resolve(e ? e.error || e.reason || e.message : null),
          );
        }),
      user2.id,
    );
    // Server throws Meteor.Error(403, 'Permission denied').
    expect(err).not.toBeNull();
    expect(String(err)).toMatch(/403|permission/i);

    // The session is unchanged — still the non-admin user.
    await expect.poll(() => clientUserId(page), { timeout: 10_000 }).toBe(user.id);

    // No audit record was written for this attempt.
    const rec = db.findOne(
      'impersonatedUsers',
      { userId: user2.id },
      { _id: 1 },
    );
    expect(rec?._id || null).toBeNull();
  });
});
