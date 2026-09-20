'use strict';
const { test, expect } = require('../fixtures');

test.describe('Dev server nobuild', () => {
  test.skip(process.env.WEKAN_TEST_SERVER_MODE !== 'source', 'Requires the source-loader development server');

  test('source-loaded sign-in preserves native browser fetch', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[name="at-field-username_and_email"]')).toBeVisible();
    const status = await page.evaluate(async () => {
      const url = Meteor.absoluteUrl('__source/status');
      return (await fetch(url)).json();
    });
    expect(status).toEqual({ mode: 'source', port: 3000, mongoPort: 3001 });
    expect(errors).toEqual([]);
  });

  test('serves declared client source and rejects private or invented imports', async ({ request }) => {
    const client = await request.get('/__source/module', { params: { id: '/client/main.js', parent: '' } });
    expect(client.status()).toBe(200);
    const source = await client.json();
    expect(source.id).toBe('client/main.js');
    expect(source.code).toContain('/client/styles');
    for (const params of [
      { id: '/server/main.js', parent: '' },
      { id: '../../private/settings.json', parent: 'client/main.js' },
      { id: '/client/main.js', parent: 'invented.js' },
      { id: '/.tools/dev-source/3000/web.browser/program.json', parent: '' },
    ]) {
      const response = await request.get('/__source/module', { params });
      expect(response.status()).toBe(403);
      expect(await response.text()).toBe('Client module unavailable');
    }
  });
});
