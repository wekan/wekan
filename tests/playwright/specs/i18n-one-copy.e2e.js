'use strict';

/**
 * A language other than English comes from the server's one copy of its
 * dictionary: /i18n/<hash>.json (server/i18nAssets.js), fetched by
 * imports/i18n/tap.js. The browser bundle used to carry every dictionary a
 * second time, 140 MiB of it.
 *
 * A browser whose language is Finnish shows the sign-in page in Finnish, and
 * the words came from that request. Negative: a name that is not a dictionary
 * hash is 404, and no answer of it lets a shared cache keep it.
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('Translations from the server', () => {
  test('a Finnish browser gets Finnish from /i18n/<hash>.json', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'fi-FI' });
    const page = await context.newPage();
    const asked = [];
    page.on('response', r => {
      if (/\/i18n\/[0-9a-f]{20}\.json$/.test(new URL(r.url()).pathname)) asked.push(r);
    });
    await page.goto(`${BASE_URL}/sign-in`);
    await expect(page.getByText('Kirjaudu sisään').first()).toBeVisible({ timeout: 30_000 });
    expect(asked.length).toBeGreaterThan(0);
    const answer = asked[0];
    expect(answer.status()).toBe(200);
    expect(answer.headers()['cache-control']).toBe('private, max-age=31536000, immutable');
    expect((await answer.json())['act-addAttachment']).toBeTruthy();
    await context.close();
  });

  test('negative: only a dictionary hash is answered', async ({ request }) => {
    for (const name of ['fi.i18n.json', '0000000000000000000a.json', '..%2Fsettings.json', 'e23f44e4ca1a8e9d0008.js']) {
      const response = await request.get(`${BASE_URL}/i18n/${name}`);
      expect(response.status(), name).toBe(404);
    }
  });
});
