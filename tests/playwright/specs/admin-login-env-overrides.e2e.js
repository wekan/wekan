'use strict';
// Every login environment variable is overridable in Admin Panel / People, in
// its login method's own section (models/lib/authConfigCatalog.js). This drives
// the real pages: an override is saved and shown as the Admin Panel's, a
// secret is never sent back to the browser, emptying a field gives the
// environment back, and an ordinary user cannot read or write any of it.
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const db = require('../helpers/db');

const SECRET = 'e2e-client-secret-4711';

test('each login method has its own override section in People', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  // One page load, then the menu, as an administrator moves between them. A
  // full load per section refreshes the login cookie each time, and Meteor
  // allows 30 refreshes per 10 seconds per address - every test here comes from
  // the same one.
  await navigateInApp(page, '/admin/people/ldap');
  for (const [slug, id, field] of [
    ['ldap', 'ldap-setting', 'LDAP_GROUP_FILTER_NESTED'],
    ['oidc', 'oidc-setting', 'OAUTH2_CLIENT_ID'],
    ['cas', 'cas-setting', 'CAS_VALIDATE_URL'],
    ['header-login', 'header-login-setting', 'HEADER_LOGIN_TRUSTED_IPS'],
    ['login', 'registration-setting', 'DEFAULT_AUTHENTICATION_METHOD'],
  ]) {
    await page.locator(`.side-menu a[data-id="${id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/admin/people/${slug}$`));
    await expect(page.locator('.side-menu li.active a')).toHaveAttribute('data-id', id);
    await expect(page.locator('.js-auth-provider-settings label', { hasText: field })).toBeVisible();
  }
});

test('OAuth2 overrides save, the secret never reaches the browser, and ordinary users are refused',
  async ({ page, adminUser, user }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    try {
      await navigateInApp(page, '/admin/people/oidc');
      await page.locator('#auth-clientId').fill('e2e-client');
      await page.locator('#auth-secret').fill(SECRET);
      await page.locator('.js-auth-provider-save').click();
      await expect.poll(() => page.evaluate(async () =>
        (await Meteor.callAsync('getAuthConfigSources', 'oidc')).sources.secret)).toEqual({ source: 'admin', hasValue: true });

      // The typed secret is cleared from the form, and after a reload neither
      // the page, the method result nor the client's Settings copy holds it.
      await expect(page.locator('#auth-secret')).toHaveValue('');
      await page.reload();
      await expect(page.locator('#auth-clientId')).toHaveValue('e2e-client');
      await expect(page.locator('.js-auth-secret-status[data-key="secret"]')).toContainText('Admin Panel');
      expect(await page.content()).not.toContain(SECRET);
      const seen = await page.evaluate(async () => JSON.stringify(
        await Meteor.callAsync('getAuthConfigSources', 'oidc')));
      expect(seen).not.toContain(SECRET);

      // A URL with credentials in it is refused on the server.
      const refused = await page.evaluate(async () => {
        try { await Meteor.callAsync('saveAuthConfigSettings', 'oidc', { serverUrl: 'https://u:p@idp.example' }); return 'saved'; }
        catch (error) { return error.error; }
      });
      expect(refused).toBe('invalid-login-settings');

      // Emptying the field and ticking the box give the environment back.
      await page.locator('#auth-clientId').fill('');
      await page.locator('.js-auth-secret-clear[data-key="secret"]').check();
      await page.locator('.js-auth-provider-save').click();
      await expect.poll(() => page.evaluate(async () => {
        const { sources } = await Meteor.callAsync('getAuthConfigSources', 'oidc');
        return [sources.clientId.source, sources.secret.source];
      })).not.toContain('admin');

      await loginWithToken(page, user.id, user.token);
      for (const args of [['getAuthConfigSources', 'oidc'], ['saveAuthConfigSettings', 'oidc', { clientId: 'x' }]]) {
        const result = await page.evaluate(async args => {
          try { await Meteor.callAsync(...args); return 'allowed'; } catch (error) { return error.error; }
        }, args);
        expect(result).toBe('error-notAuthorized');
      }
    } finally {
      await loginWithToken(page, adminUser.id, adminUser.token);
      await page.evaluate(() => Meteor.callAsync('saveAuthConfigSettings', 'oidc', { clientId: '', clearSecrets: ['secret'] })).catch(() => {});
    }
  });

test('DEFAULT_AUTHENTICATION_METHOD chosen in Login overrides the environment, and Default gives it back',
  async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    const before = await page.evaluate(() => Meteor.callAsync('getDefaultAuthenticationMethod'));
    try {
      await navigateInApp(page, '/admin/people/login');
      await expect(page.locator('#defaultAuthenticationMethod')).toHaveCount(0);
      await page.locator('#auth-defaultAuthenticationMethod').selectOption('ldap');
      await page.locator('.js-auth-provider-save').click();
      await expect.poll(() => page.evaluate(() => Meteor.callAsync('getDefaultAuthenticationMethod'))).toBe('ldap');
      // The value the sign-in page reads follows it.
      await expect.poll(() => db.findOne('settings', {}, { defaultAuthenticationMethod: 1 }).defaultAuthenticationMethod).toBe('ldap');
      // Saved on the server - the form reloads what the server reports.
      await expect(page.locator('#auth-defaultAuthenticationMethod')).toHaveValue('ldap');
      await page.locator('#auth-defaultAuthenticationMethod').selectOption('');
      await page.locator('.js-auth-provider-save').click();
      await expect.poll(() => page.evaluate(() => Meteor.callAsync('getDefaultAuthenticationMethod'))).toBe(before);
    } finally {
      await page.evaluate(() => Meteor.callAsync('saveAuthConfigSettings', 'login', { defaultAuthenticationMethod: '' })).catch(() => {});
    }
  });
