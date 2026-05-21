'use strict';

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

/**
 * Login a Playwright page using a MongoDB resume token instead of the login form.
 * This avoids UI flakiness and rate-limiting, and works even when the login page
 * has rendering issues (one of the bugs we're testing separately).
 */
async function loginWithToken(page, userId, token) {
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'commit' });
  await waitForMeteor(page);

  const result = await page.evaluate(
    async ({ tok, expectedId }) =>
      new Promise(resolve => {
        Meteor.loginWithToken(tok, err => {
          resolve({ error: err ? (err.reason || err.message) : null, userId: Meteor.userId() });
        });
      }),
    { tok: token, expectedId: userId },
  );

  if (result.error) throw new Error(`Token login failed: ${result.error}`);
  if (result.userId !== userId) throw new Error(`Unexpected userId after login: ${result.userId}`);

  await page.goto(BASE_URL, { waitUntil: 'commit' });
}

/** Login using the actual username/password form (tests the login UI). */
async function loginWithCredentials(page, username, password) {
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'commit' });
  await page.fill('[name="username"]', username);
  await page.fill('[name="password"]', password);
  await page.click('[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/sign-in'), { timeout: 20_000 });
}

async function logout(page) {
  await page.evaluate(() => Meteor.logout());
  await page.waitForURL(url => url.pathname.includes('/sign-in'), { timeout: 10_000 });
}

async function waitForMeteor(page) {
  await page.waitForFunction(
    () =>
      typeof Meteor !== 'undefined' &&
      typeof Meteor.subscribe !== 'undefined',
    { timeout: 30_000 },
  );
}

/** Navigate to a board and wait for it to render lists. */
async function openBoard(page, boardId, slug) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.goto(`${BASE_URL}/b/${boardId}/${slug}`, { waitUntil: 'commit' });
    const hasList = await page
      .locator('.js-list:not(.js-list-composer)')
      .first()
      .waitFor({ timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (hasList) return;
    await page.waitForTimeout(1_000);
  }
  throw new Error(`Board ${boardId} did not render any lists`);
}

module.exports = { loginWithToken, loginWithCredentials, logout, waitForMeteor, openBoard };
