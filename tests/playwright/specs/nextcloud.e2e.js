const { test, expect } = require('@playwright/test');
const url = process.env.WEKAN_NEXTCLOUD_URL;
const state = process.env.WEKAN_NEXTCLOUD_STORAGE_STATE;

test.describe('Nextcloud ExApp through real HaRP', () => {
  test.skip(!url || !state, 'Requires deployed Nextcloud/HaRP and a signed-in browser storage state');
  test('Nextcloud sign-in, WebSocket DDP, and reconnect retain the same WeKan identity', async ({ browser }) => {
    const context = await browser.newContext({ storageState: state });
    const page = await context.newPage();
    const sockets = [];
    page.on('websocket', socket => sockets.push(socket.url()));
    try {
      await page.goto(url);
      await page.waitForFunction(() => window.Meteor?.userId() && window.Meteor.status().connected);
      const id = await page.evaluate(() => window.Meteor.userId());
      expect(id).toMatch(/^nc-/);
      await expect.poll(() => sockets.some(value => value.includes('/sockjs/'))).toBe(true);
      await page.evaluate(() => window.Meteor.disconnect());
      await page.evaluate(() => window.Meteor.reconnect());
      await page.waitForFunction(expected => window.Meteor.status().connected && window.Meteor.userId() === expected, id);
      await page.reload();
      await page.waitForFunction(expected => window.Meteor.userId() === expected, id);
    } finally { await context.close(); }
  });
  test('anonymous browser cannot obtain a WeKan session', async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(url);
      expect(await page.evaluate(() => window.Meteor?.userId() || null)).toBeNull();
    } finally { await context.close(); }
  });
});
