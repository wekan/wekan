'use strict';
// Invoked by the Bun release's Linux job against its isolated database.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.BUN_PLAYWRIGHT_MODULE || './playwright/node_modules/@playwright/test');

module.exports = async function bunBrowserSmoke(url) {
  const browser = await chromium.launch({
    ...(process.env.BUN_CHROMIUM_PATH ? { executablePath: process.env.BUN_CHROMIUM_PATH } : {}),
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${url}/sign-up`);
    await page.locator('.auth-layout').first().waitFor({ state: 'visible', timeout: 60000 });
    await page.waitForFunction(() => window.Meteor?.status().connected, null, { timeout: 60000 });
    const denied = await page.evaluate(async () => {
      try {
        await Meteor.callAsync('createBoardWithInitialSwimlanes', { title: 'Denied', slug: 'denied' });
        return null;
      } catch (error) { return error.error; }
    });
    assert.equal(denied, 'not-authorized');
    const username = `bun-smoke-${Date.now()}`;
    // WeKan intentionally forbids Meteor's raw createUser RPC; use its UI.
    await page.locator('#at-field-username').fill(username);
    await page.locator('#at-field-email').fill(`${username}@example.invalid`);
    await page.locator('#at-field-password').fill('Bun-smoke-Password-123!');
    await page.locator('#at-field-password_again').fill('Bun-smoke-Password-123!');
    await page.locator('#at-btn').click();
    await page.waitForFunction(() => !!Meteor.userId());
    const boardId = await page.evaluate(() => Meteor.callAsync('createBoardWithInitialSwimlanes', {
      title: 'Bun Smoke Board', slug: 'bun-smoke-board', permission: 'private', type: 'board',
      swimlanes: [{ title: 'Default', sort: 0, type: 'swimlane' }],
    }));
    assert.equal(typeof boardId, 'string');
    await page.goto(`${url}/b/${boardId}/bun-smoke-board`);
    await page.locator('.board-wrapper').first().waitFor({ state: 'visible', timeout: 60000 });
    assert((await page.locator('.header-page-title').first().innerText()).includes('Bun Smoke Board'));
    assert.deepEqual(errors, []);
    console.log('Bun Chromium signup, board creation and anonymous rejection passed');
  } finally {
    await browser.close();
  }
};
