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
    ({ tok, expectedId }) =>
      new Promise(resolve => {
        Meteor.loginWithToken(tok, err => {
          if (err) {
            resolve({ error: err.reason || err.message, userId: Meteor.userId() });
            return;
          }
          // Meteor.userId() can lag the loginWithToken callback (the reactive
          // login state updates a tick later), which made the assertion below
          // flaky ("Unexpected userId after login"). Poll until it settles on the
          // expected id, or give up after a short timeout so a genuine mismatch
          // still surfaces.
          const deadline = Date.now() + 5000;
          const tick = () => {
            const uid = Meteor.userId();
            if (uid === expectedId || Date.now() > deadline) {
              resolve({ error: null, userId: uid });
            } else {
              setTimeout(tick, 50);
            }
          };
          tick();
        });
      }),
    { tok: token, expectedId: userId },
  );

  if (result.error) throw new Error(`Token login failed: ${result.error}`);
  if (result.userId !== userId) throw new Error(`Unexpected userId after login: ${result.userId}`);

  await page.goto(BASE_URL, { waitUntil: 'commit' });
  // Wait until the app bundle (and the Meteor global) has executed on the
  // landing page, so tests that immediately call Meteor.call via page.evaluate
  // don't hit "Meteor is not defined" before the bundle loads.
  await waitForMeteor(page);
}

/** Login using the actual username/password form (tests the login UI). */
async function loginWithCredentials(page, username, password) {
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'commit' });

  const usernameField = page.locator(
    '#at-field-username_and_email, [name="username"], [name="at-field-username_and_email"], input[placeholder*="Username"]',
  ).first();
  const passwordField = page.locator(
    '#at-field-password, [name="password"], [name="at-field-password"], input[type="password"]',
  ).first();

  await usernameField.fill(username);
  await passwordField.fill(password);
  await page.getByRole('button', { name: 'Sign In' }).first().click();

  const redirected = await page
    .waitForURL(url => !url.pathname.includes('/sign-in'), { timeout: 20_000 })
    .then(() => true)
    .catch(() => false);

  if (!redirected) {
    const loggedIn = await page
      .waitForFunction(() => typeof Meteor !== 'undefined' && !!Meteor.userId(), {
        timeout: 10_000,
      })
      .then(() => true)
      .catch(() => false);

    if (!loggedIn) {
      throw new Error('Credential login did not redirect and Meteor.userId() is empty');
    }

    await page.goto(BASE_URL, { waitUntil: 'commit' });
  }
}

async function logout(page) {
  await page.evaluate(
    () =>
      new Promise(resolve => {
        Meteor.logout(() => resolve(true));
      }),
  );

  const isLoggedOut = await page
    .waitForFunction(
      () => typeof Meteor !== 'undefined' && !Meteor.userId(),
      { timeout: 10_000 },
    )
    .then(() => true)
    .catch(() => false);

  if (!isLoggedOut) {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'commit' });
  }
}

async function waitForMeteor(page) {
  await page.waitForFunction(
    () =>
      typeof Meteor !== 'undefined' &&
      typeof Meteor.subscribe !== 'undefined',
    // 2nd arg is the (unused) page-function argument; the timeout MUST be the
    // 3rd arg. Passing { timeout } as the 2nd arg silently falls back to the
    // config actionTimeout (15s), which is too short for WebKit-in-Docker under
    // the full parallel "Run ALL tests" load. Generous: the client bundle is
    // large and slower browsers can take a while to execute it even after
    // globalSetup warms the server. See global-setup.js.
    undefined,
    { timeout: 60_000 },
  );
}

/** Navigate to a board and wait for it to render lists. */
async function openBoard(page, boardId, slug) {
  // Up to 5 attempts so the slowest browser (WebKit) survives the contention
  // of the 3-browser parallel run against a single shared dev server.
  for (let attempt = 1; attempt <= 5; attempt++) {
    await page.goto(`${BASE_URL}/b/${boardId}/${slug}`, { waitUntil: 'commit' });
    const hasList = await page
      .locator('.js-list:not(.js-list-composer)')
      .first()
      .waitFor({ timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (hasList) return;
    await page.waitForTimeout(1_000);
  }
  throw new Error(`Board ${boardId} did not render any lists`);
}

module.exports = { loginWithToken, loginWithCredentials, logout, waitForMeteor, openBoard };
