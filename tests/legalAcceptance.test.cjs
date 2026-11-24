'use strict';

// WP-8 (docs/Compliance/README.md): versioned acceptance of the terms and the
// privacy notice. The decision is pure (models/lib/legalAcceptance.js); the
// gate that enforces it over DDP is server/requireLegalAcceptance.js.
// Run: node --test tests/legalAcceptance.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const A = require('../models/lib/legalAcceptance');
const L = require('../models/lib/legalPages');

const DOCS = [
  { _id: 'terms', enabled: true, requireAcceptance: true, version: 3 },
  { _id: 'privacy', enabled: true, requireAcceptance: true, version: 1 },
  { _id: 'cookies', enabled: true, requireAcceptance: true, version: 5 },
  { _id: 'imprint', enabled: true, requireAcceptance: true, version: 2 },
];

test('only published terms and privacy pages that require it are to be accepted, at their current version', () => {
  assert.deepEqual(A.requiredAcceptances(DOCS), [{ page: 'terms', version: 3 }, { page: 'privacy', version: 1 }]);
  assert.deepEqual(A.requiredAcceptances([{ _id: 'terms', enabled: false, requireAcceptance: true, version: 3 }]), [], 'unpublished');
  assert.deepEqual(A.requiredAcceptances([{ _id: 'terms', enabled: true, version: 3 }]), [], 'not required');
  assert.deepEqual(A.requiredAcceptances(null), []);
});

test('an account has accepted a page when it accepted this version or a later one', () => {
  const required = A.requiredAcceptances(DOCS);
  assert.deepEqual(A.missingAcceptances({}, required), required);
  const user = { legalAcceptances: { terms: { version: 3 }, privacy: { version: 1 } } };
  assert.deepEqual(A.missingAcceptances(user, required), []);
  // A new version is asked for again.
  assert.deepEqual(A.missingAcceptances({ legalAcceptances: { terms: { version: 2 }, privacy: { version: 1 } } }, required),
    [{ page: 'terms', version: 3 }]);
  assert.deepEqual(A.missingAcceptances({ legalAcceptances: { terms: { version: '3' } } }, [{ page: 'terms', version: 3 }]),
    [{ page: 'terms', version: 3 }], 'a version that is not a number is no acceptance');
});

test('accepting records the current version and the moment; nothing else is accepted', () => {
  const now = new Date('2026-11-24T10:00:00Z');
  const required = [{ page: 'terms', version: 3 }];
  assert.deepEqual(A.acceptanceSet(required, [{ page: 'terms', version: 3 }], now),
    { 'legalAcceptances.terms': { version: 3, at: now } });
  // Negative: an old version - a text the browser showed before it changed.
  assert.throws(() => A.acceptanceSet(required, [{ page: 'terms', version: 2 }]), /legal-page-changed/);
  // Negative: a page that does not require acceptance, or a made-up one -
  // no field of the account can be written through this.
  assert.throws(() => A.acceptanceSet(required, [{ page: 'privacy', version: 1 }]), /legal-acceptance-not-required/);
  assert.throws(() => A.acceptanceSet(required, [{ page: 'isAdmin', version: 1 }]), /legal-acceptance-not-required/);
  assert.throws(() => A.acceptanceSet(required, 'terms'), /legal-acceptance-invalid/);
});

test('requiring acceptance is saved for the terms and privacy only, and is not a new version', () => {
  const first = L.pageUpdate({ _id: 'terms' }, { enabled: true, title: 'T', body: 'x', requireAcceptance: true });
  assert.equal(first.requireAcceptance, true);
  const again = L.pageUpdate({ _id: 'terms', ...first }, { enabled: true, title: 'T', body: 'x', requireAcceptance: false });
  assert.equal(again.version, first.version);
  assert.equal(L.pageUpdate({ _id: 'cookies' }, { requireAcceptance: true }).requireAcceptance, false);
  assert.equal(L.publicPage({ _id: 'imprint', enabled: true, requireAcceptance: true }).requireAcceptance, false);
});

test('the stamp changes with any required version', () => {
  assert.notEqual(A.requirementStamp([{ page: 'terms', version: 1 }]), A.requirementStamp([{ page: 'terms', version: 2 }]));
  assert.equal(A.requirementStamp([]), '');
});

// The allowlist is what an account that has not accepted can still reach. A
// board method on it would make the gate pointless.
test('negative: an account that has not accepted cannot call a board, card or admin method', () => {
  for (const name of ['copyBoard', 'createBoard', 'moveCard', 'archiveBoard', 'saveLegalPage', 'getLegalPagesForAdmin', 'setPassword', 'removeUser']) {
    assert.ok(!A.ALLOWED_METHODS.has(name), name);
  }
  for (const name of A.ALLOWED_METHODS) {
    assert.doesNotMatch(name, /(?<!dash)board|card|list|swimlane|checklist|comment|attachment|admin|setting/i, name);
  }
  // What the account needs to get past the dialog, and the steps before it.
  for (const name of ['acceptLegalPages', 'getLegalAcceptanceRequirement', 'getLegalPages', 'logout', 'enableUser2fa', 'changePassword']) {
    assert.ok(A.ALLOWED_METHODS.has(name), name);
  }
});

test('the gate wraps every method and publication, and refuses until accepted', () => {
  const gate = read('server/requireLegalAcceptance.js');
  assert.match(gate, /if \(ALLOWED_METHODS\.has\(name\) \|\| methods\[name\]\[WRAPPED\]\) continue;/);
  assert.match(gate, /if \(await mustAccept\(this\)\) throw refuse\(\);/);
  assert.match(gate, /if \(await mustAccept\(this\)\) \{\s*this\.ready\(\);/, 'a publication sends nothing');
  assert.match(gate, /deferArgumentAudit\(args\);/, 'audit-argument-checks still sees the handler check its arguments');
  assert.match(gate, /cached\.stamp === stamp/, 'a new version is asked for at once, not after the cache minute');
  assert.match(gate, /if \(missing\) missing = missingAcceptances\(user, await refreshRequiredAcceptances\(\)\)\.length > 0;/,
    'a refusal re-reads the requirement first, so one turned off elsewhere blocks nobody');
  assert.match(read('server/imports.js'), /import '\/server\/requireLegalAcceptance';/);
  assert.match(read('server/methods/legalPages.js'), /refreshRequiredAcceptances\(\)/, 'a save applies at once');
  // acceptLegalPages checks its argument and only writes acceptanceSet's $set.
  const accept = gate.slice(gate.indexOf('async acceptLegalPages('), gate.indexOf('const WRAPPED'));
  assert.match(accept, /check\(accepted, \[Match\.ObjectIncluding\(\{ page: String, version: Match\.Integer \}\)\]\);/);
  assert.match(accept, /updateAsync\(this\.userId, \{ \$set \}\)/);
});

test('a sign-up that ticked the checkbox has accepted; the box is never stored in the profile', () => {
  const users = read('server/models/users.js');
  assert.match(users, /if \(user\.profile\) delete user\.profile\.acceptLegal;/);
  assert.match(users, /options\.profile\.acceptLegal === true\) \{\s*user\.legalAcceptances = await require\('\/server\/requireLegalAcceptance'\)\.signupAcceptances\(\);/);
  const accounts = read('config/accounts.js');
  assert.match(accounts, /_id: 'acceptLegal',\s*type: 'checkbox',/);
  assert.match(read('client/components/legal/legalAcceptance.jade'), /input#at-field-acceptLegal\(type="checkbox"/);
});

test('the person sees what they accepted, and the administrator where to require it', () => {
  assert.match(read('client/components/users/userHeader.jade'), /\+legalAcceptancesList/);
  assert.match(read('client/components/settings/legalPagesSettings.jade'), /input\.js-legal-require-acceptance\(type="checkbox"/);
  const { INVENTORY } = require('../models/lib/personalDataInventory');
  assert.match(INVENTORY.find(e => e.collection === 'users').purpose, /legalAcceptances/);
});

// Found by tests/playwright/specs/legal-acceptance.e2e.js: the users schema
// (collection2) silently dropped a field it did not know, so every
// acceptance was "saved" and gone. And the global form rules hid native
// checkboxes, so there was nothing to tick.
test('negative: the account schema keeps the acceptances, and the boxes can be seen', () => {
  const users = read('models/users.js');
  assert.match(users, /legalAcceptances: \{[\s\S]{0,400}?type: Object,\s*optional: true,\s*blackbox: true,/);
  const css = read('client/components/legal/legalAcceptance.css');
  // Emergency access's box (P3) shares the same reset.
  assert.match(css, /\.legal-acceptance-page input\[type="checkbox"\],\s*\.legal-page-check input\[type="checkbox"\],\s*\.impersonate-emergency input\[type="checkbox"\],\s*\.attachment-encryption-new input\[type="checkbox"\] \{[^}]*visibility: visible;[^}]*appearance: auto;/);
});
