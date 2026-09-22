'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Impersonation Report shows initials and wrapped names for present and deleted users', async ({ page, adminUser, user }) => {
  const records = [db.uid('impersonated'), db.uid('impersonated')];
  const missingUserId = db.uid('deleted');
  const at = new Date();
  db.insertOne('impersonatedUsers', { _id: records[0], adminId: adminUser.id,
    userId: user.id, reason: 'clickedImpersonate', createdAt: at });
  db.insertOne('impersonatedUsers', { _id: records[1], adminId: adminUser.id,
    userId: missingUserId, reason: 'clickedImpersonate', createdAt: at });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/impersonation');
    const live = page.locator('.table-page-table tbody tr').filter({ hasText: user.username });
    await expect(live.locator('.table-page-single-person-name').filter({ hasText: user.username })).toBeVisible();
    await expect(live.locator('.table-page-single-person .avatar').last()).toBeVisible();
    const deleted = page.locator('.table-page-table tbody tr').filter({ hasText: missingUserId });
    await expect(deleted.locator('svg.avatar-initials text').last()).toHaveText(missingUserId[0].toUpperCase());
    expect(await deleted.locator('.table-page-single-person-name').last().evaluate(
      el => ({ whiteSpace: getComputedStyle(el).whiteSpace,
        overflowWrap: getComputedStyle(el).overflowWrap })))
      .toEqual({ whiteSpace: 'normal', overflowWrap: 'anywhere' });
  } finally {
    db.deleteOne('impersonatedUsers', { _id: records[0] });
    db.deleteOne('impersonatedUsers', { _id: records[1] });
  }
});
