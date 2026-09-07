'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const { waitForMeteor } = require('../helpers/auth');

test('unknown same URL has accessible HTML4 and modern Not Found views', async ({ browser, baseURL }) => {
  const route = `/missing-html4-route-${Date.now()}`;
  const output = `${process.cwd()}/../../.tools/html4-not-found`;
  fs.mkdirSync(output, { recursive: true });

  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  const response = await legacy.goto(`${baseURL}${route}`);
  expect(response.status()).toBe(404);
  await expect(legacy.locator('h1')).toContainText('Page not found');
  await expect(legacy.locator('table.legacy-content')).toContainText(route);
  await legacy.screenshot({ path: `${output}/html4-not-found.png`, fullPage: true });

  const modernContext = await browser.newContext({ locale: 'en-US' });
  const modern = await modernContext.newPage();
  await modern.goto(`${baseURL}${route}`);
  await waitForMeteor(modern);
  await expect(modern.locator('body')).toContainText(/Page not found|Not Found/i);
  await modern.screenshot({ path: `${output}/html5-not-found.png`, fullPage: true });

  await modernContext.close();
  await legacyContext.close();
});
