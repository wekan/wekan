'use strict';

// Plain-Node unit test (no Meteor) for the LDAP username slugifier.
// Run: node tests/ldapUsernameSlug.test.cjs
//
// Regression guard for #4653 ("LDAP-sync: wekan-username not correctly
// generated if ldap-username has hyphen"). With LDAP_UTF8_NAMES_SLUGIFY on,
// sync.js slugified the username via limax(text, { separator: '.' }); limax
// turns every non-alphanumeric run — hyphens included — into '.', so
// "p.parta-partb" became "p.parta.partb" and the user could no longer log in.
// slugifyPreservingHyphens() must keep hyphens while still transliterating each
// segment.

const assert = require('assert');
const {
  slugifyPreservingHyphens,
} = require('../packages/wekan-ldap/server/usernameSlug');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// A stand-in for limax(part, { separator: '.' }): lowercases, and turns runs of
// non-alphanumerics (spaces, dots, etc.) into '.' — WITHOUT special-casing the
// hyphen, exactly like limax. The helper is responsible for protecting hyphens.
const fakeLimax = part =>
  String(part).toLowerCase().replace(/[^0-9a-z]+/g, '.');

// --- POSITIVE ---------------------------------------------------------------
test('hyphen in the username is preserved (the #4653 case)', () => {
  assert.strictEqual(
    slugifyPreservingHyphens('p.parta-partb', fakeLimax),
    'p.parta-partb',
  );
});

test('multiple hyphens are all preserved', () => {
  assert.strictEqual(
    slugifyPreservingHyphens('a-b-c', fakeLimax),
    'a-b-c',
  );
});

test('UTF-8 characters within a segment are still transliterated', () => {
  // fakeLimax lowercases; a real limax would also strip accents. The point is
  // per-segment slugification still runs.
  assert.strictEqual(
    slugifyPreservingHyphens('John-Doe', fakeLimax),
    'john-doe',
  );
});

test('plain username without hyphen is unchanged', () => {
  assert.strictEqual(slugifyPreservingHyphens('jdoe', fakeLimax), 'jdoe');
});

// --- NEGATIVE: the exact #4653 regression must not reappear -----------------
test('NEGATIVE: hyphen must NOT be turned into a dot', () => {
  const out = slugifyPreservingHyphens('p.parta-partb', fakeLimax);
  assert.ok(out.includes('-'), 'the hyphen must survive');
  assert.notStrictEqual(out, 'p.parta.partb');
});

test('NEGATIVE: a naive whole-string slug (dots for hyphens) is what we avoid', () => {
  // Demonstrate the old, broken behavior for contrast: slugifying the WHOLE
  // string collapses the hyphen to a dot. The helper must not do this.
  const brokenWholeString = fakeLimax('p.parta-partb'); // -> 'p.parta.partb'
  assert.strictEqual(brokenWholeString, 'p.parta.partb');
  assert.notStrictEqual(
    slugifyPreservingHyphens('p.parta-partb', fakeLimax),
    brokenWholeString,
  );
});

test('NEGATIVE: disallowed characters are still stripped from segments', () => {
  // Slash is not an allowed username char and must be removed, but hyphens stay.
  assert.strictEqual(
    slugifyPreservingHyphens('a/b-c/d', part => part),
    'ab-cd',
  );
});

test('NEGATIVE: missing transliterate fn does not throw (identity fallback)', () => {
  assert.doesNotThrow(() => slugifyPreservingHyphens('a-b'));
  assert.strictEqual(slugifyPreservingHyphens('a-b'), 'a-b');
});

console.log(`\n${passed} tests passed`);
