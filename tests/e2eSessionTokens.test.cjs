'use strict';

// One seeded test user has ONE resume token, and Meteor's logout deletes it
// server-side - for every session that shares it.
// Run: node tests/e2eSessionTokens.test.cjs
//
// That is not a theory. Driven against a running WeKan over DDP, with a token
// seeded exactly as tests/playwright/helpers/db.js seeds one:
//
//   session A: ok               tokens: [CfgBWImyytla]
//   session B: ok               tokens: [CfgBWImyytla]   <- two sessions, one token: fine
//   after B logged out          tokens: []               <- logout removed the SHARED token
//   session C (same token): ERROR You've been logged out by the server. Please log in again.
//
// The last line is how the copy-link test of 02-cards-open-view - the only one
// that logs a SECOND page in - failed in chromium, firefox AND webkit in the
// same run, having passed for a month. Two rules follow, and this suite is
// where they are written down.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const pw = f => fs.readFileSync(path.join(repoRoot, 'tests/playwright', f), 'utf8');
const auth = pw('helpers/auth.js');
const db = pw('helpers/db.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('e2eSessionTokens:');

test('logging a page in never logs the OTHER pages out', () => {
  // loginWithToken ends the previous session in the CLIENT (drop the three
  // Accounts keys, reload) instead of calling Meteor.logout(), which is a
  // server call that deletes the token every page of the test is using.
  const fn = auth.slice(auth.indexOf('async function loginWithToken'),
    auth.indexOf('async function loginWithCredentials'))
    .replace(/^\s*\/\/.*$/gm, '');   // the comment there EXPLAINS the old call
  assert.ok(!/Meteor\.logout\(/.test(fn),
    'loginWithToken must not call Meteor.logout(): it deletes the shared resume token');
  assert.ok(/localStorage\.removeItem\('Meteor\.loginToken'\)/.test(auth),
    'it ends the session by clearing the stored one');
});

test('the logout helper is still there for the test that tests logging out', () => {
  // 05-admin-users logs out and then logs in with a PASSWORD, which is the
  // real thing a user does. Removing logout() to be safe would delete that
  // coverage; it is only login-by-token that must not use it.
  assert.ok(/async function logout\(page\)/.test(auth), 'the helper exists');
  assert.ok(/Meteor\.logout\(/.test(auth), 'and it really logs out');
  const spec = pw('specs/05-admin-users.e2e.js');
  assert.ok(/await logout\(page\)/.test(spec) && /loginWithCredentials/.test(spec),
    'and the spec that uses it logs back in with credentials, not with the token');
});

test('a second page gets a token of its own', () => {
  assert.ok(/function addResumeToken\(userId\)/.test(db),
    'db.addResumeToken adds another token to an existing user');
  assert.ok(/\$push:[^\n]*services\.resume\.loginTokens/.test(db),
    'by pushing it, so the first page keeps the one it is using');
  assert.ok(/\n  addResumeToken,/.test(db), 'and it is exported');
});

test('no spec logs two pages in with the SAME token', () => {
  // Two real browsers have two tokens. Sharing one means anything that ends
  // one session ends the other, which is the failure above.
  const specsDir = path.join(repoRoot, 'tests/playwright/specs');
  const offenders = [];
  for (const file of fs.readdirSync(specsDir).filter(f => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(specsDir, file), 'utf8');
    // Per test body: how many logins name the same `<something>.token`.
    for (const body of src.split(/\n\s*test\(/)) {   // any indent: tests nest in describes
      const tokens = (body.match(/login\w*\([^,]+,\s*[^,]+,\s*([\w.]+\.token)\b/g) || [])
        .map(m => m.slice(m.lastIndexOf(' ') + 1));
      const counts = {};
      tokens.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
      Object.entries(counts).forEach(([t, n]) => {
        if (n > 1) offenders.push(`${file}: ${t} used for ${n} logins in one test`);
      });
    }
  }
  assert.deepStrictEqual(offenders, [],
    'use db.addResumeToken(userId) for the second page');
});

test('the copy-link test opens its second tab the way a client renders', () => {
  // It used to wait for `networkidle` and then for the card. The card is
  // rendered when the subscriptions land, which is not a network event the
  // browser can be idle about - so on a loaded machine the wait ended before
  // the card existed and the test failed on an empty page.
  const spec = pw('specs/02-cards-open-view.e2e.js');
  assert.ok(/addResumeToken\(board\.owner\.id\)/.test(spec),
    'the new tab logs in with its own token');
  assert.ok(!/newPage\.goto\([^)]*networkidle/.test(spec),
    'and does not wait for networkidle to decide the card is there');
  assert.ok(/waitForMeteor\(newPage\)/.test(spec),
    'it waits for the client instead');
});

console.log(`\ne2eSessionTokens: ${passed} tests passed`);
