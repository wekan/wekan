'use strict';
// #6789: the attachment retention settings are environment variables that
// Admin Panel / Attachments / Retention overrides, field by field, through the
// same form as the login settings.
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Admin Panel / Attachments / Retention offers every retention setting', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/attachments/retention');
  for (const envVar of ['ATTACHMENTS_RETENTION_DAYS', 'ATTACHMENTS_RETENTION_MODE',
    'ATTACHMENTS_PURGE_DELETED_AFTER_DAYS', 'ATTACHMENTS_RETENTION_DRY_RUN', 'ATTACHMENTS_RETENTION_MAX_PER_RUN']) {
    await expect(page.locator('.js-auth-provider-settings label', { hasText: envVar })).toBeVisible({ timeout: 10_000 });
  }
  await expect(page.locator('.side-menu li.active a')).toHaveAttribute('data-id', 'retention');
});

test('negative: an ordinary user cannot open the retention settings', async ({ page, user }) => {
  await loginWithToken(page, user.id, user.token);
  await navigateInApp(page, '/admin/attachments/retention');
  await expect(page.locator('.js-auth-provider-settings')).toHaveCount(0);
});

// #6790: BACKUP_KEEP_DAYS, beside the backup schedule.
test('Admin Panel / Attachments / Backup offers BACKUP_KEEP_DAYS', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/attachments/backup');
  await expect(page.locator('.js-auth-provider-settings label', { hasText: 'BACKUP_KEEP_DAYS' })).toBeVisible({ timeout: 10_000 });
});
