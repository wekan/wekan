'use strict';

// Plain-Node guard for tests/playwright/helpers/auth.js — the login helper every
// browser spec depends on. Run: node tests/playwrightLoginSession.test.cjs
//
// The failure this pins: loginWithToken added a page.addInitScript that removed
// Meteor's three Accounts keys from localStorage, to stop the PREVIOUS session
// resuming and racing the new login (the 33-board-domains "Unexpected userId after
// login"). But an init script runs on EVERY navigation of that page - so the very
// next goto, the one that opens the board the test just logged in for, started with
// no stored session. Every private board answered "Board not found", and the whole
// Chromium run failed inside the fixture ("Test timeout of 60000ms exceeded while
// setting up boardPage") instead of in one spec.
//
// So the clear must be ONE-SHOT: armed for the single page load a login begins on,
// and never again.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const auth = fs.readFileSync(path.join(repoRoot, 'tests/playwright/helpers/auth.js'), 'utf8');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('playwrightLoginSession:');

test('token login seeds the native HttpOnly cookie before navigating', () => {
  const cookie = auth.indexOf("name: 'meteor_login_token'");
  const login = auth.indexOf('Meteor.loginWithToken(tok');
  assert.ok(cookie > 0 && cookie < login,
    'the persistent cookie must exist before login and later navigations');
  assert.match(auth.slice(cookie, login), /httpOnly: true/,
    'browser JavaScript must not be able to read the test credential');
  assert.match(auth.slice(cookie, login), /sameSite: 'Lax'/,
    'the test cookie must use the production cross-site boundary');
});

// The body of the init script passed to page.addInitScript(...).
function initScript() {
  const at = auth.indexOf('page.addInitScript');
  assert.notStrictEqual(at, -1, 'loginWithToken must still disable session resume');
  const end = auth.indexOf('resumeDisabled.add(page)', at);
  assert.notStrictEqual(end, -1, 'the init script is installed once per page');
  return auth.slice(at, end);
}

test('the session clear is conditional, not on every navigation', () => {
  const script = initScript();
  assert.ok(/getItem\(armKey\) !== '1'\)\s*return/.test(script),
    'the init script must return early unless the one-shot flag is armed - '
    + 'otherwise it logs the test out on every goto, including the board it just logged in for');
  assert.ok(/removeItem\(armKey\)/.test(script),
    'and disarm it, so exactly ONE page load starts without a session');
  for (const key of ['Meteor.loginToken', 'Meteor.loginTokenExpires', 'Meteor.userId']) {
    assert.ok(script.includes(key), `it still clears ${key} when armed`);
  }
});

test('it clears nothing else - other specs read localStorage', () => {
  // Board view, list widths and the settings specs all live in localStorage. A
  // clear() here would pass this file and break them.
  const script = initScript();
  assert.ok(!/localStorage\.clear\(/.test(script), 'must not wipe localStorage wholesale');
  const removed = [...script.matchAll(/removeItem\(([^)]+)\)/g)].map(m => m[1].trim());
  assert.deepStrictEqual(
    removed.filter(r => !r.startsWith("'Meteor.") && r !== 'armKey'), [],
    'only the three Accounts keys and the flag itself may be removed');
});

test('the flag is armed and reloaded BEFORE the login, on the sign-in page', () => {
  const iGoto = auth.indexOf("page.goto(`${BASE_URL}/sign-in`");
  const iArm = auth.indexOf('setItem(armKey', iGoto);
  const iReload = auth.indexOf('page.reload(', iArm);
  const iLogin = auth.indexOf('Meteor.loginWithToken(tok', iReload);
  assert.ok(iGoto > 0, 'login starts at /sign-in');
  assert.ok(iArm > iGoto, 'the flag is armed once the origin storage is reachable');
  assert.ok(iReload > iArm, 'and the page is reloaded so the flag takes effect before any app script');
  assert.ok(iLogin > iReload, 'the token login happens on that fresh load');
});

test('openBoard is what the fixture times out in, so it must still retry and report', () => {
  assert.ok(/did not render any lists/.test(auth),
    'openBoard must fail with a message naming the board, not a bare timeout');

  // A FAILED NAVIGATION is retried too, not only a board that did not render:
  // WebKit answers "WebKit encountered an internal error" now and then under the
  // load of a three-browser run, and a throw from page.goto used to escape the
  // retry loop that exists for exactly that - one flaky navigation failed a test
  // with four attempts left.
  const at = auth.indexOf('async function openBoard');
  const fn = auth.slice(at, auth.indexOf('\n}', at));
  assert.ok(/try \{[\s\S]*?await page\.goto\([\s\S]*?\} catch \(error\) \{/.test(fn),
    'the navigation is attempted inside the loop, not around it');
  assert.ok(/continue;/.test(fn), 'and a failed one moves to the next attempt');
  assert.ok(/last navigation error/.test(fn),
    'so the two failure modes can be told apart afterwards');
});


test('the final navigation waits for the expected resumed user', () => {
  const at = auth.indexOf('await page.goto(BASE_URL', auth.indexOf('async function loginWithToken'));
  const tail = auth.slice(at, auth.indexOf('async function loginWithCredentials'));
  assert.ok(/waitForMeteor\(page\)[\s\S]*page\.waitForFunction\(/.test(tail),
    'the app global must load before checking the resumed Accounts identity');
  assert.ok(/Meteor\.userId\(\) === expectedId/.test(tail),
    'loginWithToken must not return while the final navigation is still anonymous');
  assert.ok(/userId,[\s\S]*timeout: 15_000/.test(tail),
    'the expected id is passed to a bounded wait so a real resume failure surfaces');
});

console.log(`\n${passed} tests passed`);
