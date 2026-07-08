'use strict';

// Plain-Node unit test (no Meteor) for the Organization setting
// "Automatically add users with the domain name".
// Run: node tests/orgAutoAddByDomain.test.cjs
//
// Regression guard for #5351: an org can store an email domain in
// `orgAutoAddUsersWithDomainName`, but nothing at sign-up ever read it, so a
// user whose email domain matched an org was never auto-added. These tests pin
// the pure matching decision the sign-up hook now uses.

const assert = require('assert');
const {
  emailDomain,
  normalizeOrgDomain,
  orgsToAutoAddForEmail,
} = require('../models/lib/orgAutoAddByDomain');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- emailDomain -------------------------------------------------------------
test('emailDomain lower-cases and trims the part after @', () => {
  assert.strictEqual(emailDomain('Alice@Example.COM'), 'example.com');
  assert.strictEqual(emailDomain('  bob@sub.example.com  '), 'sub.example.com');
});

test('emailDomain returns "" for missing/invalid emails', () => {
  assert.strictEqual(emailDomain(''), '');
  assert.strictEqual(emailDomain('no-at-sign'), '');
  assert.strictEqual(emailDomain(undefined), '');
  assert.strictEqual(emailDomain(null), '');
});

// --- normalizeOrgDomain ------------------------------------------------------
test('normalizeOrgDomain trims, lower-cases and drops a leading @', () => {
  assert.strictEqual(normalizeOrgDomain('  @Example.COM '), 'example.com');
  assert.strictEqual(normalizeOrgDomain('example.com'), 'example.com');
  assert.strictEqual(normalizeOrgDomain(''), '');
  assert.strictEqual(normalizeOrgDomain(undefined), '');
});

// --- orgsToAutoAddForEmail: POSITIVE ----------------------------------------
test('#5351: matches the org whose domain equals the email domain (case-insensitive)', () => {
  const orgs = [
    { _id: 'o1', orgAutoAddUsersWithDomainName: 'Example.com' },
    { _id: 'o2', orgAutoAddUsersWithDomainName: 'other.com' },
  ];
  assert.deepStrictEqual(orgsToAutoAddForEmail('USER@example.COM', orgs), ['o1']);
});

test('tolerates an org domain configured with a leading @', () => {
  const orgs = [{ _id: 'o1', orgAutoAddUsersWithDomainName: '@example.com' }];
  assert.deepStrictEqual(orgsToAutoAddForEmail('user@example.com', orgs), ['o1']);
});

test('multiple orgs sharing the domain are all returned', () => {
  const orgs = [
    { _id: 'o1', orgAutoAddUsersWithDomainName: 'example.com' },
    { _id: 'o2', orgAutoAddUsersWithDomainName: 'example.com' },
    { _id: 'o3', orgAutoAddUsersWithDomainName: 'nope.com' },
  ];
  assert.deepStrictEqual(orgsToAutoAddForEmail('user@example.com', orgs), [
    'o1',
    'o2',
  ]);
});

// --- orgsToAutoAddForEmail: NEGATIVE ----------------------------------------
test('does NOT match a different domain', () => {
  const orgs = [{ _id: 'o1', orgAutoAddUsersWithDomainName: 'example.com' }];
  assert.deepStrictEqual(orgsToAutoAddForEmail('user@other.com', orgs), []);
});

test('does NOT match a subdomain (exact domain only)', () => {
  const orgs = [{ _id: 'o1', orgAutoAddUsersWithDomainName: 'example.com' }];
  assert.deepStrictEqual(
    orgsToAutoAddForEmail('user@mail.example.com', orgs),
    [],
  );
  // And the reverse: a subdomain-configured org must not catch the bare domain.
  const orgs2 = [
    { _id: 'o1', orgAutoAddUsersWithDomainName: 'mail.example.com' },
  ];
  assert.deepStrictEqual(orgsToAutoAddForEmail('user@example.com', orgs2), []);
});

test('an empty / unset org domain matches nothing (never matches everyone)', () => {
  const orgs = [
    { _id: 'o1', orgAutoAddUsersWithDomainName: '' },
    { _id: 'o2', orgAutoAddUsersWithDomainName: '   ' },
    { _id: 'o3' },
    { _id: 'o4', orgAutoAddUsersWithDomainName: null },
  ];
  assert.deepStrictEqual(orgsToAutoAddForEmail('user@example.com', orgs), []);
});

test('a user with no / invalid email is added to nothing', () => {
  const orgs = [{ _id: 'o1', orgAutoAddUsersWithDomainName: 'example.com' }];
  assert.deepStrictEqual(orgsToAutoAddForEmail('', orgs), []);
  assert.deepStrictEqual(orgsToAutoAddForEmail('bogus', orgs), []);
  assert.deepStrictEqual(orgsToAutoAddForEmail(undefined, orgs), []);
});

test('non-array / empty orgs input yields nothing', () => {
  assert.deepStrictEqual(orgsToAutoAddForEmail('user@example.com', []), []);
  assert.deepStrictEqual(orgsToAutoAddForEmail('user@example.com', null), []);
});

test('the same org id is never returned twice (no duplicate membership)', () => {
  const orgs = [
    { _id: 'o1', orgAutoAddUsersWithDomainName: 'example.com' },
    { _id: 'o1', orgAutoAddUsersWithDomainName: 'EXAMPLE.com' },
  ];
  assert.deepStrictEqual(orgsToAutoAddForEmail('user@example.com', orgs), ['o1']);
});

console.log(`\n${passed} tests passed`);
