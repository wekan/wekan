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
const { parseSync } = require('@swc/core');

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

test('navigation resumes through the native HttpOnly cookie', () => {
  assert.match(auth, /name: 'meteor_login_token'/,
    'the helper must persist its seeded credential without Local Storage');
  assert.match(auth, /httpOnly: true/,
    'the browser context, not page JavaScript, writes the credential');
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

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
}

function tokenName(node) {
  if (node?.type === 'Identifier') return node.value;
  if (node?.type === 'MemberExpression' && node.property.type === 'Identifier') {
    const parent = tokenName(node.object);
    return parent && `${parent}.${node.property.value}`;
  }
  return null;
}

function duplicateTokens(source) {
  const duplicates = [];
  walk(parseSync(source, { syntax: 'ecmascript' }), node => {
    if (node.type !== 'CallExpression' || !/^test(?:\.(?:only|skip))?$/.test(tokenName(node.callee) || '')) return;
    const callback = node.arguments.at(-1)?.expression;
    if (!['ArrowFunctionExpression', 'FunctionExpression'].includes(callback?.type)) return;
    // token -> the set of PAGES it logs in. Logging the SAME page in again
    // with the same token (admin, then user, then admin again; or once per
    // branch of a seed/verify test) is safe: loginWithToken ends the previous
    // session in the client only (first test above), so the shared resume token
    // is never deleted server-side. What breaks is two DIFFERENT pages holding
    // one token, because either may log out and take the other with it. The
    // guard used to count logins per test, which flagged every same-page
    // re-login as well and so could only be satisfied by minting tokens a test
    // did not need; it now counts the distinct pages each token reaches.
    const pages = new Map();
    walk(callback.body, call => {
      if (call.type !== 'CallExpression' || !/^login\w*$/.test(tokenName(call.callee) || '')) return;
      const token = tokenName(call.arguments[2]?.expression);
      if (!token?.endsWith('.token')) return;
      const target = call.arguments[0]?.expression;
      const pageName = tokenName(target) ||
        (target?.span ? `<expr@${target.span.start}>` : '<unknown>');
      if (!pages.has(token)) pages.set(token, new Set());
      pages.get(token).add(pageName);
    });
    for (const [token, set] of pages) if (set.size > 1) duplicates.push(`${token} used for ${set.size} pages in one test`);
  });
  return duplicates;
}

test('parameterized tests have separate token scopes regardless of line layout', () => {
  // The old line-splitting regex merged both SMTP test loops into one test.
  assert.deepStrictEqual(duplicateTokens(`
    for (const scope of ['board', 'card']) test(scope, async () => { await loginWithToken(page, user.id, user.token); });
    for (const reason of ['muted']) test(reason, async () => { await loginWithToken(page, user.id, user.token); });
  `), []);
  assert.deepStrictEqual(duplicateTokens(`test('two pages', async () => {
    await loginWithToken(page, user.id, user.token);
    await loginWithToken(otherPage, user.id, user.token);
  });`), ['user.token used for 2 pages in one test']);
});

test('re-logging the SAME page with its token is allowed; a second page is not', () => {
  // Positive: one page, switched admin -> user -> admin, reuses admin's token.
  assert.deepStrictEqual(duplicateTokens(`test('switch users', async () => {
    await loginWithToken(page, admin.id, admin.token);
    await loginWithToken(page, user.id, user.token);
    await loginWithToken(page, admin.id, admin.token);
  });`), []);
  // Negative: a page from a second context with the same token is still caught,
  // even when the first page re-logs in between.
  assert.deepStrictEqual(duplicateTokens(`test('second context', async () => {
    const second = await (await browser.newContext()).newPage();
    await loginWithToken(page, user.id, user.token);
    await loginWithToken(page, user.id, user.token);
    await loginWithToken(second, user.id, user.token);
  });`), ['user.token used for 2 pages in one test']);
  // And the fix the message recommends passes.
  assert.deepStrictEqual(duplicateTokens(`test('own token', async () => {
    await loginWithToken(page, user.id, user.token);
    await loginWithToken(second, user.id, db.addResumeToken(user.id));
  });`), []);
});

test('no spec logs two pages in with the SAME token', () => {
  const specsDir = path.join(repoRoot, 'tests/playwright/specs');
  const offenders = [];
  for (const file of fs.readdirSync(specsDir).filter(f => f.endsWith('.js'))) {
    const source = fs.readFileSync(path.join(specsDir, file), 'utf8');
    offenders.push(...duplicateTokens(source).map(message => `${file}: ${message}`));
  }
  assert.deepStrictEqual(offenders, [], 'use db.addResumeToken(userId) for the second page');
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
