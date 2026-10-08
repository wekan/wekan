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

// Maintainer decision of 2026-10-08: header login is environment-only, so a
// site administrator's session alone cannot let a proxy sign in as anyone.
test('Header login is shown read-only, and a hand-made save is refused', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/people/header-login');
  const form = page.locator('.js-auth-provider-settings');
  await expect(form.locator('label', { hasText: 'HEADER_LOGIN_TRUSTED_IPS' })).toBeVisible();
  await expect(form.locator('#auth-trustedIps')).toHaveAttribute('readonly', '');
  await expect(form.locator('.js-auth-config-field')).toHaveCount(0);
  await expect(form.locator('.js-auth-provider-save')).toHaveCount(0);
  const refused = await page.evaluate(async () => {
    try { await Meteor.callAsync('saveAuthConfigSettings', 'headerLogin', { id: 'X-Forged', trustedIps: '0.0.0.0/0' }); return 'saved'; }
    catch (error) { return error.error; }
  });
  expect(refused).toBe('login-settings-env-only');
  expect(db.findOne('settings', {}, { headerLogin: 1 }).headerLogin?.id).toBeUndefined();
});

// Admin Panel / People / LDAP / Sync now (maintainer decision of 2026-10-08):
// the method is loaded and admin-only, and the pane reports its answer. The
// test server has no directory, so LDAP is off and the answer is a refusal.
test('LDAP Sync now answers in the pane, and ordinary users are refused', async ({ page, adminUser, user }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/people/ldap');
  await page.locator('.js-ldap-sync-now').click();
  await expect(page.locator('.js-ldap-sync-result')).toHaveClass(/ldap-test-error/);
  await expect(page.locator('.js-ldap-sync-result')).toContainText('LDAP_disabled');
  await loginWithToken(page, user.id, user.token);
  const refused = await page.evaluate(async () => {
    try { await Meteor.callAsync('ldap_sync_now'); return 'allowed'; } catch (error) { return error.error; }
  });
  expect(refused).toBe('error-notAuthorized');
});

// Automatic logout (maintainer decision of 2026-10-08): LOGOUT_WITH_TIMER and
// LOGOUT_IN set in Admin Panel / People / Login remove the login tokens that
// are past their deadline, and keep the ones that are not.
test('LOGOUT_WITH_TIMER signs out logins past LOGOUT_IN and keeps newer ones', async ({ page, adminUser, user }) => {
  const DAY = 24 * 60 * 60 * 1000;
  const marker = `e2e-logout-${Date.now()}`;
  db.updateOne('users', { _id: user.id }, { $push: { 'services.resume.loginTokens': {
    when: new Date(Date.now() - 3 * DAY), hashedToken: `${marker}-old` } } });
  db.updateOne('users', { _id: user.id }, { $push: { 'services.resume.loginTokens': {
    when: new Date(Date.now() - 1000), hashedToken: `${marker}-new` } } });
  const tokens = () => (db.findOne('users', { _id: user.id }, { 'services.resume.loginTokens': 1 })
    .services.resume.loginTokens || []).map(token => token.hashedToken).filter(hash => hash.startsWith(marker));
  await loginWithToken(page, adminUser.id, adminUser.token);
  try {
    await navigateInApp(page, '/admin/people/login');
    await expect(page.locator('.js-auth-provider-settings label', { hasText: 'LOGOUT_WITH_TIMER' })).toBeVisible();
    await page.locator('#auth-logoutWithTimer').selectOption('true');
    await page.locator('#auth-logoutIn').fill('2');
    await page.locator('.js-auth-provider-save').click();
    await expect.poll(tokens, { timeout: 15000 }).toEqual([`${marker}-new`]);
    // An hour that does not exist is refused on the server.
    const refused = await page.evaluate(async () => {
      try { await Meteor.callAsync('saveAuthConfigSettings', 'login', { logoutOnHours: 24 }); return 'saved'; }
      catch (error) { return error.error; }
    });
    expect(refused).toBe('invalid-login-settings');
  } finally {
    await page.evaluate(() => Meteor.callAsync('saveAuthConfigSettings', 'login', { logoutWithTimer: '', logoutIn: '' })).catch(() => {});
    db.updateOne('users', { _id: user.id }, { $pull: { 'services.resume.loginTokens': { hashedToken: { $regex: `^${marker}` } } } });
  }
});

// #1904: OAuth login providers can be restricted to email domains, saved from
// the shared provider settings and refused when the list is not domain names.
test('OAuth provider email domains are saved, and a malformed list is refused', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  try {
    await navigateInApp(page, '/admin/people/oauth');
    await page.locator('#oauth-providers-allowed-email-domains').fill(' Example.com , example.org ');
    await page.locator('.js-oauth-shared-save').click();
    await expect.poll(() => db.findOne('settings', {}, { oauthProvidersAllowedEmailDomains: 1 }).oauthProvidersAllowedEmailDomains)
      .toBe('example.com,example.org');
    const refused = await page.evaluate(async () => {
      try { await Meteor.callAsync('saveOauthProviderSettings', 'google', { enabled: false, id: '', allowedEmailDomains: 'not a domain' }); return 'saved'; }
      catch (error) { return error.error; }
    });
    expect(refused).toBe('invalid-email-domains');
  } finally {
    db.updateOne('settings', {}, { $unset: { oauthProvidersAllowedEmailDomains: '' } });
  }
});
