'use strict';
const { test, expect } = require('@playwright/test');
const { createAuthenticationSubmitHandler } = require('../../../client/lib/authenticationSubmit');

// A real native submit is essential: manually dispatching both events hides
// Firefox's protection against reentering its native form submission.
for (const submitWith of ['click', 'Enter']) {
  test(`password submit replay reaches the form handler after ${submitWith}`, async ({ page }) => {
    await page.setContent('<section><form id="at-pwd-form"><input id="username"><button type="submit">Sign in</button></form></section>');
    await page.evaluate(source => {
      const createHandler = (0, eval)(`(${source})`);
      window.submissions = 0;
      window.providerLogins = 0;
      const form = document.querySelector('form');
      document.querySelector('section').addEventListener('submit', createHandler({
        isSignIn: () => true,
        readCredentials: () => ({ username: 'dummy', password: 'test-only' }),
        resolveMethod: () => 'password',
        submitPassword: form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
        login: () => { window.providerLogins++; },
        complete: error => { throw error || new Error('unexpected provider completion'); },
        setBusy() {},
      }), true);
      form.addEventListener('submit', event => {
        event.preventDefault();
        window.submissions++;
      });
    }, createAuthenticationSubmitHandler.toString());
    if (submitWith === 'click') await page.getByRole('button').click();
    else await page.locator('#username').press('Enter');
    await expect.poll(() => page.evaluate(() => window.submissions)).toBe(1);
    expect(await page.evaluate(() => window.providerLogins)).toBe(0);
  });
}
