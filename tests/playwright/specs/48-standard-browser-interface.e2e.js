'use strict';

const { test, expect } = require('@playwright/test');

test('sign-in loads Meteor directly without the removed HTML4 capability probe', async ({ page }) => {
  const requested = [];
  page.on('request', request => requested.push(request.url()));
  const response = await page.goto('/sign-in');
  expect(response.ok()).toBeTruthy();
  const document = await response.text();
  expect(document).toContain('__meteor_runtime_config__');
  expect(document).not.toMatch(/legacy-html4|x-wekan-progressive-client/i);
  await expect(page.locator('#at-field-username_and_email')).toBeVisible();
  expect(requested.some(url => url.includes('/legacy-html4/'))).toBe(false);
});

test('a browser without JavaScript receives the standard Meteor document', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    const response = await page.goto(`${baseURL}/sign-in`);
    expect(response.ok()).toBeTruthy();
    expect(await response.text()).toContain('__meteor_runtime_config__');
    await expect(page.locator('.legacy-content')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Legacy HTML4');
  } finally {
    await context.close();
  }
});
