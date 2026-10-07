'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('People opens Email and lists separate authentication panes after Shared templates', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/people');
  await expect(page.locator('.side-menu li.active a')).toHaveAttribute('data-id', 'email-setting');
  await expect(page.locator('#email-setting')).toBeVisible();
  const ids = await page.locator('.side-menu a.js-left-menu-item').evaluateAll(items => items.map(item => item.dataset.id));
  expect(ids[0]).toBe('email-setting');
  expect(ids.slice(ids.indexOf('templates-setting'))).toEqual([
    'templates-setting', 'registration-setting', 'saml-setting', 'ldap-setting', 'oidc-setting', 'cas-setting',
    'header-login-setting', 'oauth-setting', 'passwordless-setting',
  ]);
  const panes = [
    ['registration-setting', 'login', '.js-toggle-registration'],
    // LDAP, OAuth2, CAS and Header login are catalog forms (authProviderSettings);
    // LDAP alone has the connection test under it.
    ['ldap-setting', 'ldap', '.js-ldap-test-connection'],
    ['oauth-setting', 'oauth', '.js-oauth-shared-save'],
    ['passwordless-setting', 'passwordless', '.js-passwordless-save'],
  ];
  for (const [id, slug, selector] of panes) {
    await page.locator(`.side-menu a[data-id="${id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/admin/people/${slug}$`));
    await expect(page.locator(selector)).toBeVisible();
    for (const [otherId, , otherSelector] of panes) {
      if (otherId !== id) await expect(page.locator(otherSelector)).toHaveCount(0);
    }
    await page.reload();
    await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator('.side-menu li.active a')).toHaveAttribute('data-id', id);
  }
});

for (const language of ['fi', 'ar', 'ja']) {
  test(`login settings render localized labels in ${language}`, async ({ page, adminUser }) => {
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
    await navigateInApp(page, '/admin/people/login');
    await expect(page.locator('.side-menu a[data-id="header-login-setting"]')).toHaveText(strings['header-login']);
    const restart = page.locator('.accounts-form').filter({ has: page.locator('#auth-loginExpirationInDays') });
    await expect(restart).toContainText(strings['login-setting-after-restart']);
    await expect(restart).not.toContainText('Takes effect after WeKan restarts');
    await expect(page.locator('html')).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    try {
      await navigateInApp(page, '/admin/people/oidc');
      await page.locator('#auth-secret').fill('translation-test-secret');
      // If the form re-rendered after the fill, Save would store nothing and the
      // clear control below would never come: say so here instead.
      await expect(page.locator('#auth-secret')).toHaveValue('translation-test-secret');
      await page.locator('.js-auth-provider-save').click();
      const clear = page.locator('.auth-secret-clear').filter({ has: page.locator('[data-key="secret"]') });
      // Save, then the form reloads its settings; under a full Firefox run that
      // round trip outlasted the default 15 s once.
      await expect(clear).toContainText(strings['login-setting-clear-secret'], { timeout: 30_000 });
      await expect(clear).not.toContainText('Remove the value stored in the Admin Panel');
      await page.locator('.js-auth-secret-clear[data-key="secret"]').check();
      await page.locator('.js-auth-provider-save').click();
      await expect(clear).toHaveCount(0);
    } finally {
      await page.evaluate(() => Meteor.callAsync('saveAuthConfigSettings', 'oidc', { clearSecrets: ['secret'] }));
    }
  });
}
