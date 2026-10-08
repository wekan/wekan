'use strict';

// "Sign in with Google" looped back to the sign-in page when WeKan was opened
// at another address than ROOT_URL. The sign-in page now says so. The test
// server answers on both localhost and 127.0.0.1, two origins of one server,
// so the address ROOT_URL does not name plays the wrong address.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { waitForMeteor } = require('../helpers/auth');

test.describe('#login-origin-mismatch sign-in at another address than ROOT_URL', () => {
  test.beforeEach(async ({ adminUser }) => {
    expect(adminUser.id).toBeTruthy();
    db.updateOne('settings', {}, { $set: { 'oauthProviders.google': { enabled: true, id: 'test-client-id', secret: 'test-secret' } } });
  });
  test.afterEach(() => {
    db.updateOne('settings', {}, { $unset: { 'oauthProviders.google': '' } });
  });

  test('at ROOT_URL itself there is no notice (negative)', async ({ page }) => {
    await page.goto('/sign-in');
    await waitForMeteor(page);
    const root = await page.evaluate(() => __meteor_runtime_config__.ROOT_URL);
    test.skip(new URL(root).origin !== new URL(page.url()).origin, 'the test server is not opened at its ROOT_URL');
    await expect(page.locator('.js-oauth-provider[data-provider="google"]')).toBeVisible();
    await expect(page.locator('.js-login-origin-mismatch')).toHaveCount(0);
  });

  test('at another address the page names both, instead of looping', async ({ page }) => {
    await page.goto('/sign-in');
    await waitForMeteor(page);
    const root = new URL(await page.evaluate(() => __meteor_runtime_config__.ROOT_URL));
    const aliases = { localhost: '127.0.0.1', '127.0.0.1': 'localhost' };
    test.skip(!aliases[root.hostname], 'ROOT_URL is not a loopback name with an alias');
    const other = new URL(root.href);
    other.hostname = aliases[root.hostname];
    await page.goto(new URL('sign-in', other.href.replace(/\/?$/, '/')).href);
    await waitForMeteor(page);
    const notice = page.locator('.js-login-origin-mismatch');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(root.origin);
    await expect(notice).toContainText(other.origin);
    await expect(notice).toHaveAttribute('role', 'alert');
  });

  test('with no provider login, a password-only page shows nothing (negative)', async ({ page }) => {
    db.updateOne('settings', {}, { $unset: { 'oauthProviders.google': '' } });
    await page.goto('/sign-in');
    await waitForMeteor(page);
    const root = new URL(await page.evaluate(() => __meteor_runtime_config__.ROOT_URL));
    const aliases = { localhost: '127.0.0.1', '127.0.0.1': 'localhost' };
    test.skip(!aliases[root.hostname], 'ROOT_URL is not a loopback name with an alias');
    const other = new URL(root.href);
    other.hostname = aliases[root.hostname];
    await page.goto(new URL('sign-in', other.href.replace(/\/?$/, '/')).href);
    await waitForMeteor(page);
    await expect(page.locator('.at-pwd-form, form#at-pwd-form').first()).toBeVisible();
    await expect(page.locator('.js-login-origin-mismatch')).toHaveCount(0);
  });
});
