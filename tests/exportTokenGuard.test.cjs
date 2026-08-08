'use strict';

// CrashBleed — CVE-2026-68901, GHSA-3gcg-g6rf-w2rx (CWE-476): a bad authToken
// crashed the server. https://wekan.fi/hall-of-fame/crashbleed/
//
// The name matters as much as the id: tests/securityRegressionCoverage.test.cjs
// checks the published Hall of Fame list against the tests that guard it, and it
// can only do that for a test that says which vulnerability it belongs to.
//
// The board export REST endpoints look a user up by the login token in
// `?authToken=`. A token that matches nothing makes that lookup answer `undefined`,
// and the next line dereferenced it:
//
//   user = await ReactiveCache.getUser({ 'services.resume.loginTokens.hashedToken': … });
//   adminId = user._id.toString();          // TypeError on an unknown token
//
// The handlers are async and had no try/catch, so the TypeError escaped as an
// unhandled promise rejection — which this app turns into a full process crash (see
// the note in server/ldapGroupSync.js). One crafted GET on a private board took the
// server down for everyone.
//
// It was an INCOMPLETE FIX: models/exportPDF.js and models/exportExcelCard.js already
// had the `if (!user)` guard; three handlers in models/export.js and one in
// models/exportExcel.js were missed. So this test does not check four places by
// hand - it finds EVERY such lookup in the export models and requires a guard on
// each, which is what stops the same hole reopening in a fifth handler.
//
// Run: node tests/exportTokenGuard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const FILES = ['models/export.js', 'models/exportExcel.js', 'models/exportPDF.js',
  'models/exportExcelCard.js'];

console.log('exportTokenGuard:');

test('every token lookup is followed by a null check, in every export model', () => {
  const unguarded = [];
  for (const file of FILES) {
    const src = read(file);
    const lookup = /user = await ReactiveCache\.getUser\(\{\s*'services\.resume\.loginTokens\.hashedToken':[^}]*\}\);/g;
    for (const m of lookup.exec ? [...src.matchAll(lookup)] : []) {
      const after = src.slice(m.index + m[0].length, m.index + m[0].length + 400);
      const line = src.slice(0, m.index).split('\n').length;
      if (!/^\s*if \(!user\) \{/.test(after)) {
        unguarded.push(`${file}:${line}`);
      }
    }
  }
  assert.deepStrictEqual(unguarded, [],
    'a lookup whose result is dereferenced without a guard crashes on an unknown token');
});

test('the guard answers 401 and stops, rather than falling through', () => {
  for (const file of FILES) {
    const src = read(file);
    for (const m of src.matchAll(/if \(!user\) \{([\s\S]{0,700}?)\n\s*\}/g)) {
      const body = m[1];
      assert.ok(/401/.test(body), `${file}: the guard must answer 401`);
      assert.ok(/return;/.test(body), `${file}: and must return, not continue`);
    }
  }
});

test('nothing dereferences the user before the guard', () => {
  // The crash sink itself: `user._id` must never come before the null check.
  for (const file of FILES) {
    const src = read(file);
    let searchFrom = 0;
    for (const m of src.matchAll(/'services\.resume\.loginTokens\.hashedToken'/g)) {
      const rest = src.slice(m.index, m.index + 600);
      const guardAt = rest.indexOf('if (!user)');
      const useAt = rest.indexOf('user._id');
      assert.ok(guardAt !== -1, `${file}: a token lookup with no guard at all`);
      assert.ok(useAt === -1 || guardAt < useAt,
        `${file}: user._id is dereferenced before the guard`);
      searchFrom = m.index;
    }
    assert.ok(searchFrom >= 0);
  }
});

test('every export route body is wrapped, so a throw is a 500 and not a crash', () => {
  // The guards are the fix; this is the net under them. An export handler that
  // throws for any other reason must answer, not take the process with it.
  for (const file of FILES) {
    const src = read(file);
    const routes = [...src.matchAll(/WebApp\.handlers\.get\(/g)].length;
    const wrapped = [...src.matchAll(/safeRoute\(async function/g)].length;
    assert.strictEqual(wrapped, routes,
      `${file}: ${routes} routes, ${wrapped} wrapped`);
    assert.ok(/const \{[^}]*safeRoute[^}]*\} = require\('\/server\/apiMiddleware'\)/.test(src),
      `${file}: must import the wrapper it uses`);
  }
});

test('the wrapper answers 500 once and never throws on its way out', () => {
  const mw = read('server/apiMiddleware.js');
  const fn = mw.slice(mw.indexOf('function safeRoute('));
  assert.ok(/try \{[\s\S]*?await handler\.call\(this, req, res/.test(fn),
    'it awaits the handler inside the try - a returned promise must be awaited, or '
    + 'the rejection escapes anyway');
  assert.ok(/if \(!res\.headersSent\)/.test(fn),
    'a partly-sent response must not be given a second set of headers');
  assert.ok(/catch \(_\)/.test(fn), 'and answering must not throw either');
  assert.ok(/console\.error/.test(fn), 'the failure is logged, not swallowed silently');
  assert.ok(/module\.exports = \{ sendJsonResult, safeRoute \}/.test(mw));
});

test('the two handlers that were already guarded still are', () => {
  // The advisory called this an incomplete fix; these are the two it was incomplete
  // against, and they must not regress while the others are being repaired.
  for (const file of ['models/exportPDF.js', 'models/exportExcelCard.js']) {
    assert.ok(/if \(!user\) \{[\s\S]{0,300}401/.test(read(file)), `${file}: still guarded`);
  }
});

console.log(`\n${passed} tests passed`);
