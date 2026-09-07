'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

test('Forgot Password has equivalent HTML4 and HTML5 views at the same URL', async ({ browser, baseURL }) => {
  test.setTimeout(60_000);
  const output = `${process.cwd()}/../../.tools/html4-account-recovery`;
  fs.mkdirSync(output, { recursive: true });

  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  await legacy.goto(`${baseURL}/forgot-password`);
  await expect(legacy.locator('h1')).toContainText('Forgot password');
  const form = legacy.locator('form[action="/users/forgot-password"]');
  await expect(form.locator('label[for="email"]')).toContainText('Email');
  await form.locator('input[name="email"]').fill(`missing-${Date.now()}@wekan-test.invalid`);
  await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
  await expect(legacy.locator('body')).toContainText('Email sent');
  await legacy.screenshot({ path: `${output}/html4-forgot-password.png`, fullPage: true });

  const modernContext = await browser.newContext({ locale: 'en-US' });
  const modern = await modernContext.newPage();
  await modern.goto(`${baseURL}/forgot-password`);
  await expect(modern.locator('input[type="email"]')).toBeVisible();
  await expect(modern.locator('button[type="submit"], input[type="submit"]')).toBeVisible();
  await modern.screenshot({ path: `${output}/html5-forgot-password.png`, fullPage: true });

  await modernContext.close();
  await legacyContext.close();
});
