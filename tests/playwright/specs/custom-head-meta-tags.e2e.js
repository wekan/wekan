'use strict';
// #4042: Admin Panel / Settings / Layout / Custom head meta tags reach the
// page's <head> - as <meta> elements only.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test('custom meta tags are in the served page, and nothing else from the field is', async ({ request }) => {
  const before = db.findOne('settings', {}, { customHeadEnabled: 1, customHeadMetaTags: 1 });
  db.updateOne('settings', {}, { $set: { customHeadEnabled: true, customHeadMetaTags:
    '<meta property="og:title" content="E2E meta check"><script>window.e2eInjected=1</script><meta http-equiv="refresh" content="0;url=https://evil.example">' } });
  try {
    await expect.poll(async () => (await (await request.get(`${BASE_URL}/sign-in`)).text())
      .includes('<meta property="og:title" content="E2E meta check">'), { timeout: 15_000 }).toBe(true);
    const html = await (await request.get(`${BASE_URL}/sign-in`)).text();
    expect(html).not.toContain('window.e2eInjected');
    expect(html).not.toContain('evil.example');
  } finally {
    db.updateOne('settings', {}, { $set: { customHeadEnabled: Boolean(before && before.customHeadEnabled),
      customHeadMetaTags: (before && before.customHeadMetaTags) || '' } });
  }
});
