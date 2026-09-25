'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('SAML settings use the shared override form and deny ordinary users', async ({ page, adminUser, user }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  const previous = await page.evaluate(() => Meteor.callAsync('getSamlConfigSources'));
  try {
    await navigateInApp(page, '/admin/people/saml');
    await expect(page.locator('.side-menu li.active a')).toHaveAttribute('data-id', 'saml-setting');
    await expect(page.locator('#auth-enabled')).toBeVisible();
    await page.locator('#auth-enabled').selectOption('false');
    await page.locator('#auth-provider').fill('test-idp');
    await page.locator('#auth-issuer').fill('urn:wekan-test');
    await page.locator('.js-auth-provider-settings button[type=submit]').click();
    await expect.poll(() => page.evaluate(async () => (await Meteor.callAsync('getSamlConfigSources')).overrides.provider)).toBe('test-idp');
    await page.reload();
    await expect(page.locator('#auth-provider')).toHaveValue('test-idp');
    await expect(page.locator('a[href$="/_saml/config/test-idp"]')).toBeVisible();
    await page.locator('#auth-provider').fill('');
    await page.locator('.js-auth-provider-settings button[type=submit]').click();
    await expect.poll(() => page.evaluate(async () => (await Meteor.callAsync('getSamlConfigSources')).sources.provider.source)).not.toBe('admin');
    await loginWithToken(page, user.id, user.token);
    for (const method of ['getSamlConfigSources', 'saveSamlSettings']) {
      const result = await page.evaluate(async method => {
        try { await Meteor.callAsync(method, ...(method.startsWith('save') ? [{}] : [])); return 'allowed'; }
        catch (error) { return error.error; }
      }, method);
      expect(result).toBe('error-notAuthorized');
    }
  } finally {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.evaluate(input => Meteor.callAsync('saveSamlSettings', input), previous.overrides);
  }
});
