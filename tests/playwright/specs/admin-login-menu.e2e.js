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
    'templates-setting', 'registration-setting', 'saml-setting', 'ldap-setting', 'oauth-setting', 'passwordless-setting',
  ]);
  const panes = [
    ['registration-setting', 'login', '.js-toggle-registration'],
    ['ldap-setting', 'ldap', '.js-ldap-settings-save'],
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
