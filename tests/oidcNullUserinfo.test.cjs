'use strict';

// #5174: an OIDC login against a provider that refused the request died with
//
//     Error in OAuth Server: Cannot read property 'ocs' of null
//
// which tells the admin nothing about the refusal - the reporter's actual
// problem was a scope the provider did not allow.
//
// Where the null came from: getTokenContent() returns NULL for a token it cannot
// parse (`var content = null; if (token) {...} return content`), and the
// ADFS/B2C branch assigns its result straight into `userinfo`. The next line was
// the Nextcloud hack, `if (userinfo.ocs)`, so the first thing to touch the failed
// response was a property read on null. Every claim read after it had the same
// problem; that line just happened to be first.
//
// The fix is not one null check but the ORDER: the provider's answer is
// validated once, as a whole, before anything reads a field off it, and each
// failure says which step failed and what the provider sent. This pins that
// order, because a later edit that reads a claim earlier would restore the
// original bug without touching the checks.
//
// Run: node tests/oidcNullUserinfo.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'packages/wekan-oidc/oidc_server.js'), 'utf8');

// Comments quote the old broken line on purpose; assertions are about code.
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('oidcNullUserinfo:');

test('getTokenContent can still return null - that is the premise', () => {
  // Not a bug in itself: an unparseable token has no content. The bug was
  // handing that null to code that assumed an object. If this ever stops
  // returning null the guards below are harmless, but the comment above would be
  // describing history.
  const at = code.indexOf('var getTokenContent = function');
  assert.notStrictEqual(at, -1, 'getTokenContent must be there');
  const fn = code.slice(at, code.indexOf('\n}', at));
  assert.ok(/var content = null/.test(fn) && /return content/.test(fn),
    'it returns null when the token cannot be parsed');
});

test('the token response is checked before any field is read off it', () => {
  const tokenCheck = code.indexOf('the token endpoint returned no usable response');
  const firstRead = code.indexOf('token.access_token');
  assert.notStrictEqual(tokenCheck, -1, 'a missing/!object token response must be refused');
  assert.ok(tokenCheck < firstRead,
    'the check has to come BEFORE the first read, or the read throws first');
});

test('a token response with no token in it fails with what the provider sent', () => {
  assert.ok(/neither access_token nor/.test(code),
    'a 200 carrying neither token must be refused explicitly');
  assert.ok(/Object\.keys\(token\)/.test(code),
    'and name the fields that DID come back - keys only, since the values are secrets');
  assert.ok(!/JSON\.stringify\(token\)/.test(code),
    'never dump the whole token response into an error message');
});

test('userinfo is validated before any claim is read', () => {
  const check = code.indexOf('no user information came back from the provider');
  assert.notStrictEqual(check, -1, 'a null/non-object userinfo must be refused');
  // The claim reads: the Nextcloud hack first, then the OAUTH2_*_MAP lookups.
  const ocs = code.indexOf('userinfo.ocs');
  const firstClaim = code.indexOf('userinfo[process.env.OAUTH2_ID_MAP]');
  assert.ok(check < ocs && check < firstClaim,
    'the check must precede BOTH the ocs hack and the claim lookups - the ocs '
    + 'line was only first by accident of ordering');
  // And it must say which branch produced it: the claims-in-access-token path
  // and the userinfo-endpoint path fail for different reasons.
  assert.ok(/claimsInAccessToken/.test(code.slice(check, check + 600)),
    'the message distinguishes the two paths, or it just moves the mystery');
  assert.ok(/OAUTH2_REQUEST_PERMISSIONS/.test(code.slice(check, check + 700)),
    'and points at the scopes, which is what was actually wrong in #5174');
});

test('the ocs and metadata hacks cannot produce an undefined userinfo', () => {
  // Both re-point userinfo at a nested object. `ocs` present but `ocs.data`
  // missing used to set userinfo to undefined and fail on the NEXT line.
  assert.ok(/if \(userinfo\.ocs && userinfo\.ocs\.data\)/.test(code),
    'the Nextcloud hack must check the nested object it unwraps to');
  const hacks = code.indexOf('userinfo.ocs');
  const after = code.slice(hacks, hacks + 800);
  assert.ok(/unwrapped to nothing usable/.test(after),
    'and an unwrap that lands on nothing must be refused right after');
});

test('the B2C email claim is checked before it is indexed', () => {
  const at = code.indexOf('OAUTH2_B2C_ENABLED');
  const branch = code.slice(code.indexOf('OAUTH2_B2C_ENABLED', at + 10));
  assert.ok(/Array\.isArray\(userinfo\.emails\)/.test(branch),
    'userinfo["emails"][0] on a token without the claim is undefined[0]');
  assert.ok(/no "emails" claim/.test(branch),
    'and the failure must say the tenant is not releasing it');
});

test('a missing expires_in does not become NaN', () => {
  assert.ok(/Number\.isFinite\(expiresIn\)/.test(code),
    'parseInt(undefined) is NaN, and NaN in expiresAt propagates silently');
  assert.ok(/expiresIn = 3600/.test(code), 'with the OAuth2 default hour as the fallback');
});

console.log(`\n${passed} tests passed`);
