'use strict';

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

/**
 * Login a Playwright page using a MongoDB resume token instead of the login form.
 * This avoids UI flakiness and rate-limiting, and works even when the login page
 * has rendering issues (one of the bugs we're testing separately).
 */
// Pages whose init script has already been installed (see below). A WeakSet, so a
// closed page does not keep anything alive.
const resumeDisabled = new WeakSet();

// The one-shot flag the init script below looks for. It is ARMED just before the
// reload that starts a login, and the init script consumes it, so exactly one page
// load starts without a stored session.
const ARM_KEY = 'wekan-e2e-clear-session';

async function loginWithToken(page, userId, token) {
  // With clientStorage:none, a token login is intentionally memory-only.
  // Navigating to a board creates a new DDP connection, so seed the same
  // HttpOnly cookie a real Meteor login uses before doing the in-memory login.
  // Browser automation can set an HttpOnly cookie through the browser context;
  // page JavaScript cannot read it, which keeps this helper on the production
  // authentication path instead of reintroducing Local Storage credentials.
  await page.context().addCookies([{
    name: 'meteor_login_token',
    value: token,
    url: BASE_URL,
    httpOnly: true,
    sameSite: 'Lax',
  }]);

  // Stop the PREVIOUS session from resuming. Meteor's accounts-base reads
  // localStorage at startup and logs the stored user back in, asynchronously - so
  // on a reload the sequence could be: page loads, our logout check sees no user
  // yet (the resume has not landed), we log the new user in, and THEN the resume
  // completes and puts the OLD user back. The poll below then waits 15s and
  // reports "Unexpected userId after login: <the previous user>", which is the
  // 33-board-domains failure - in WebKit first, then in Chromium, because it is a
  // race and not a browser.
  //
  // Removing exactly the three Accounts keys before any script runs means there is
  // nothing to resume. Everything else in localStorage - board view, list widths,
  // the settings tests rely on - is left alone.
  //
  // ONE-SHOT, and that is the whole point: an init script runs on EVERY navigation
  // of the page, so clearing unconditionally logged the test OUT again the moment
  // it opened the board it had just logged in for - every private board answered
  // "Board not found" and the whole browser suite failed in the fixture. The script
  // therefore clears only when the flag below is armed, and disarms it.
  if (!resumeDisabled.has(page)) {
    await page.addInitScript(armKey => {
      try {
        if (window.localStorage.getItem(armKey) !== '1') return;
        window.localStorage.removeItem(armKey);
        window.localStorage.removeItem('Meteor.loginToken');
        window.localStorage.removeItem('Meteor.loginTokenExpires');
        window.localStorage.removeItem('Meteor.userId');
      } catch (e) { /* a page without storage access is already resume-free */ }
    }, ARM_KEY);
    resumeDisabled.add(page);
  }

  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'commit' });
  // Arm the clear and reload, so the load that this login happens on is the one
  // load with no stored session to resume. (Arming needs the origin's storage,
  // which is why it is done here rather than before the first navigation.)
  await page.evaluate(armKey => {
    try { window.localStorage.setItem(armKey, '1'); } catch (e) { /* no storage, nothing to resume */ }
  }, ARM_KEY);
  await page.reload({ waitUntil: 'commit' });
  await waitForMeteor(page);

  // And wait for any login attempt that is still in flight to finish, so the
  // state we are about to read is settled rather than half-way.
  await page.evaluate(
    () =>
      new Promise(resolve => {
        const deadline = Date.now() + 10000;
        const settle = () => {
          if (typeof Meteor.loggingIn !== 'function' || !Meteor.loggingIn() ||
              Date.now() > deadline) {
            resolve();
          } else {
            setTimeout(settle, 50);
          }
        };
        settle();
      }),
  );

  // Switching users in the same page: end the previous session first and wait
  // for it to be empty. Without this, `Meteor.userId()` can still be the OLD
  // user while the new login is in flight, and the poll below cannot tell "the
  // new login has not landed yet" from "it landed on the wrong user" - it just
  // times out and reports the old id. That is the WebKit failure of
  // 33-board-domains: the admin id was still there when the test switched to
  // the non-admin.
  //
  // It ends the session in the CLIENT, and that is the whole point of this
  // block being what it is. It used to call `Meteor.logout()`, which is a
  // SERVER call: it deletes the resume token from the user document. A seeded
  // test user has exactly one token, shared by every page of the test, so one
  // logout stranded all of them - the next login with that token answered
  //
  //   Token login failed: You've been logged out by the server. Please log in again.
  //
  // which is how 02-cards-open-view's copy-link test (the only one that logs a
  // SECOND page in) failed in all three browsers at once. Dropping the three
  // Accounts keys and reloading leaves the token alone and still gives the page
  // a connection with no user on it.
  const wrongUser = await page.evaluate(
    expectedId => Boolean(Meteor.userId()) && Meteor.userId() !== expectedId,
    userId,
  );
  if (wrongUser) {
    await page.evaluate(armKey => {
      try { window.localStorage.setItem(armKey, '1'); } catch (e) { /* no storage */ }
    }, ARM_KEY);
    await page.reload({ waitUntil: 'commit' });
    await waitForMeteor(page);
    await page.evaluate(
      () =>
        new Promise(resolve => {
          const deadline = Date.now() + 10000;
          const waitEmpty = () => {
            if (!Meteor.userId() || Date.now() > deadline) resolve();
            else setTimeout(waitEmpty, 50);
          };
          waitEmpty();
        }),
    );
  }

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
          // A loaded run (three browsers, WebKit in Docker) can take longer than
          // five seconds to settle the reactive login state.
          const deadline = Date.now() + 15000;
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
  // A navigation starts a new DDP connection. The Meteor global can be ready
  // before Accounts has resumed the token, so wait for the expected identity
  // before returning to a test that may immediately call an authorized method.
  await page.waitForFunction(
    expectedId => typeof Meteor !== 'undefined' && Meteor.userId() === expectedId,
    userId,
    { timeout: 15_000 },
  );
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
  //
  // Bounded by a DEADLINE, not just by the attempt count: five attempts of a
  // 20s wait plus a 1s pause is ~105s, and the test timeout is 60s (see
  // playwright.config.js). The loop could therefore never reach its own error -
  // Playwright killed the whole test first, and what a webkit run reported was
  //
  //     Test timeout of 60000ms exceeded while setting up "boardPage".
  //     Error: page.waitForTimeout: Target page, context or browser has been closed
  //
  // which says nothing about the board. Retrying past the point where the result
  // can still be used is not resilience, it is just a worse error message. The
  // budget leaves room for the rest of the fixture, the first attempt keeps the
  // full generous wait, and later attempts get whatever is left - so a slow
  // board still gets one long look, and a hopeless one fails with the reason.
  const BUDGET_MS = 45_000;
  const MIN_WAIT_MS = 3_000;
  const deadline = Date.now() + BUDGET_MS;
  let lastError = null;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_WAIT_MS) break;
    // The navigation itself can fail, not just the rendering: WebKit answers
    // "WebKit encountered an internal error" now and then under the load of a
    // three-browser run, and a throw here escaped the retry loop that exists for
    // exactly this - one flaky navigation failed a test with four attempts left.
    try {
      await page.goto(`${BASE_URL}/b/${boardId}/${slug}`, { waitUntil: 'commit' });
    } catch (error) {
      lastError = error;
      if (deadline - Date.now() < MIN_WAIT_MS) break;
      await page.waitForTimeout(1_000);
      continue;
    }

    const hasList = await page
      .locator('.js-list:not(.js-list-composer)')
      .first()
      .waitFor({ timeout: Math.min(20_000, Math.max(MIN_WAIT_MS, deadline - Date.now())) })
      .then(() => true)
      .catch(() => false);
    if (hasList) return;
    if (deadline - Date.now() < MIN_WAIT_MS) break;
    await page.waitForTimeout(1_000);
  }

  // Say which of the two it was: a board that never rendered, or a navigation
  // that never succeeded.
  if (lastError) {
    throw new Error(
      `Board ${boardId} could not be opened after 5 attempts; last navigation error: ${lastError.message}`,
    );
  }

  throw new Error(
    `Board ${boardId} did not render any lists within ${BUDGET_MS / 1000}s`,
  );
}

module.exports = { loginWithToken, loginWithCredentials, logout, waitForMeteor, openBoard };
