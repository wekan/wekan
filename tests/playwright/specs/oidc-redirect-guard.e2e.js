'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const guard = fs.readFileSync(path.resolve(__dirname, '../../../client/lib/oidcAutoRedirect.js'), 'utf8')
  .replace('export const OidcAutoRedirect', 'window.OidcAutoRedirect');

test('OIDC automatic attempt stays latched across browser callback reloads', async ({ page }) => {
  await page.route('https://wekan.example/**', route => route.fulfill({
    contentType: 'text/html', body: '<!doctype html><title>Login callback</title>',
  }));
  await page.addInitScript({ content: guard });
  await page.goto('https://wekan.example/sign-in');
  expect(await page.evaluate(() => OidcAutoRedirect.hasAlreadyFired())).toBe(false);
  expect(await page.evaluate(() => OidcAutoRedirect.markFired())).toBe(true);
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.reload();
    expect(await page.evaluate(() => OidcAutoRedirect.hasAlreadyFired())).toBe(true);
  }
  await page.evaluate(() => OidcAutoRedirect.clear());
  await page.reload();
  expect(await page.evaluate(() => OidcAutoRedirect.hasAlreadyFired())).toBe(false);
});
