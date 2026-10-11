const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const fixture = JSON.parse(fs.readFileSync(process.env.WEKAN_NEXTCLOUD_FIXTURE));
const saved = JSON.parse(fs.readFileSync(`${fixture.work}/persisted.json`));
test(`accounts, board, attachment and avatar survive ${process.env.NEXTCLOUD_TEST_PHASE}`, async ({ browser }) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${fixture.nextcloud}/index.php/login?redirect_url=${encodeURIComponent(new URL(fixture.url).pathname)}`);
    await page.locator('[name="user"]').fill('alice');
    await page.locator('[name="password"]').fill(fixture.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(url => !url.pathname.endsWith('/login'));
    await page.goto(saved.boardUrl);
    await page.waitForFunction(id => Meteor.userId() === id, saved.alice);
    await expect(page.locator('.board-canvas')).toBeVisible();
    await expect(page.locator('.minicard-title').filter({ hasText: 'After live update' })).toBeVisible();
    for (const type of ['attachment', 'avatar']) {
      const response = await context.request.get(saved[type].url);
      expect(response.ok()).toBe(true);
      expect(await response.body()).toEqual(Buffer.from(saved[`${type}Bytes`], 'base64'));
    }
  } finally { await context.close(); }
});
