'use strict';
// No account fixtures: this suite also runs against an isolated empty database.
const { test, expect } = require('@playwright/test');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
test.use({ storageState: undefined });
test('signed-out pages load the full layout without an unsolicited 2FA prompt', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  for (const route of ['sign-in', 'sign-up']) {
    await page.goto(`${BASE_URL}/${route}`);
    await expect(page.locator('.auth-layout').first()).toBeVisible();
    await expect(page.locator('.auth-layout').first()).toHaveCSS('display', 'flex');
    await expect(page.locator('body')).toHaveCSS('margin-top', '0px');
    const prompt = page.locator('#two-factor-code-container');
    await expect(prompt).toBeHidden();
    await expect(prompt).toHaveAttribute('hidden');
    // Removing the class reproduces the original missing-CSS failure: the
    // native HTML attribute must still keep the unrequested challenge hidden.
    await prompt.evaluate(element => element.classList.remove('hide'));
    await expect(prompt).toBeHidden();
    await prompt.evaluate(element => element.classList.add('hide'));
    await page.keyboard.press('Tab');
    expect(await page.locator('#two-factor-code-input').evaluate(element => element === document.activeElement)).toBe(false);
  }
  expect(errors).toEqual([]);
});
