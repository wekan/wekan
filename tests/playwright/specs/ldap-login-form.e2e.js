'use strict';
// Exercise the real form and Accounts completion path. The directory boundary
// is controlled in the browser; no external LDAP credentials are required.
const { test, expect } = require('../fixtures');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

async function prepare(page, method = 'ldap') {
  await page.goto(`${BASE_URL}/sign-in`);
  await expect(page.locator('#at-field-username_and_email')).toBeVisible();
  await page.evaluate(method => {
    let view = Blaze.getView(document.querySelector('#at-field-username_and_email'));
    while (view && view.name !== 'Template.userFormsLayout') view = view.parentView;
    view.templateInstance().currentSetting.set({
      displayAuthenticationMethod: false, defaultAuthenticationMethod: method,
    });
    window.ldapFormCalls = [];
    window.originalLoginField = document.querySelector('#at-field-username_and_email');
    Meteor.loginWithLDAP = (username, password, callback) => {
      window.ldapFormCalls.push('ldap');
      window.finishDirectoryLogin = callback;
    };
    Meteor.loginWithPassword = (username, password, callback) => {
      window.ldapFormCalls.push('password');
      callback({ error: 403, reason: 'Local password rejected' });
    };
  }, method);
  await page.locator('#at-field-username_and_email').fill('directory-test-user');
  await page.locator('#at-field-password').fill('test-only-password');
}

for (const action of ['click', 'Enter']) {
  test(`#6692 ${action}: one LDAP request, visible error, mounted form and retry`, async ({ page }) => {
    await prepare(page);
    if (action === 'click') await page.locator('#at-btn').click();
    else await page.locator('#at-field-password').press('Enter');
    await expect.poll(() => page.evaluate(() => window.ldapFormCalls)).toEqual(['ldap']);
    expect(await page.evaluate(() => window.originalLoginField === document.querySelector('#at-field-username_and_email'))).toBe(true);
    // A second submit while waiting cannot issue another request.
    await page.locator('#at-pwd-form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(await page.evaluate(() => window.ldapFormCalls)).toEqual(['ldap']);
    await page.evaluate(() => window.finishDirectoryLogin({ error: 'LDAP-login-error', reason: 'Directory login denied <test>' }));
    await expect(page.locator('#login-error-message')).toHaveText('Directory login denied <test>');
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.locator('#at-field-username_and_email')).toHaveValue('directory-test-user');
    await page.locator('#at-btn').click();
    await expect.poll(() => page.evaluate(() => window.ldapFormCalls)).toEqual(['ldap', 'ldap']);
    await page.evaluate(() => window.finishDirectoryLogin({ reason: 'Still denied' }));
    await expect(page.locator('#login-error-message')).toHaveText('Still denied');
  });
}

test('#6692 successful provider completion establishes a session and leaves sign-in', async ({ page, user }) => {
  await prepare(page);
  await page.evaluate(token => {
    Meteor.loginWithLDAP = (username, password, callback) => {
      window.ldapFormCalls.push('ldap');
      // Use a fixture resume token to exercise real DDP/cookie completion.
      Meteor.loginWithToken(token, callback);
    };
  }, user.token);
  await page.locator('#at-btn').click();
  await expect.poll(() => page.evaluate(() => Meteor.userId())).toBe(user.id);
  await expect(page).not.toHaveURL(/\/sign-in$/);
  expect(await page.evaluate(() => window.ldapFormCalls)).toEqual(['ldap']);
});

test('#6692 local password login still reaches the original form handler once', async ({ page }) => {
  await prepare(page, 'password');
  await page.locator('#at-field-password').press('Enter');
  await expect.poll(() => page.evaluate(() => window.ldapFormCalls)).toEqual(['password']);
  await expect(page.locator('#login-error-message')).toHaveText('Local password rejected');
});
