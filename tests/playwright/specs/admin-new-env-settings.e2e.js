'use strict';
// The newest features' environment variables are also Admin Panel settings,
// drawn by the shared override form (models/lib/authConfigCatalog.js):
// Email to card limits beside its own settings, Windows SSO and the
// login-cookie limit in People / Login.
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

const field = (page, envVar) => page.locator('.js-auth-provider-settings label', { hasText: envVar });

test('People / Login offers Windows SSO and the login-cookie limit', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/people/login');
  for (const envVar of ['ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT', 'WINDOWS_SSO_ENABLED', 'WINDOWS_SSO_DOMAINS',
    'WINDOWS_SSO_ACTIVE_DIRECTORY', 'WINDOWS_SSO_MERGE_EXISTING_USERS']) {
    await expect(field(page, envVar)).toBeVisible({ timeout: 10_000 });
  }
});

test('Email to card in the Admin Panel offers its limits', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => {
    Popup.close();
    Popup.open('notificationSettings', { dataContext: { scope: 'admin' } })({
      currentTarget: document.body, target: document.body, preventDefault() {},
    });
  });
  const section = page.locator('.email-to-card-settings[data-scope="admin"]');
  await section.locator('summary').click();
  for (const envVar of ['INBOUND_IMAP_POLL_SECONDS', 'INBOUND_EMAIL_PER_ADDRESS_PER_HOUR', 'INBOUND_EMAIL_MAX_BYTES',
    'INBOUND_EMAIL_MAX_ATTACHMENT_BYTES', 'EMAIL_VIEW_SENDS_PER_HOUR']) {
    await expect(section.locator('.js-auth-provider-settings label', { hasText: envVar })).toBeVisible({ timeout: 10_000 });
  }
  // negative: the per-process IMAP switch is not offered
  await expect(section.locator('.js-auth-provider-settings label', { hasText: 'INBOUND_IMAP_DISABLED' })).toHaveCount(0);
});

test('negative: an ordinary user is offered none of them', async ({ page, user }) => {
  await loginWithToken(page, user.id, user.token);
  await navigateInApp(page, '/admin/people/login');
  await expect(field(page, 'WINDOWS_SSO_ENABLED')).toHaveCount(0);
});
