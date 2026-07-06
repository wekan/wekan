'use strict';

// Plain-Node unit test (no Meteor) for the Admin Panel Domains table paging.
// Run: node tests/domainTablePage.test.cjs
//
// The Domains table now behaves like the Board Table view: only one small page
// is sent to the browser, ordered by a column and filtered by a search term.
// paginateDomains() is the server-side search + sort + slice that backs it.

const assert = require('assert');
const { paginateDomains } = require('../models/lib/domainTablePage');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const rows = [
  { domain: 'gmail.com', count: 5 },
  { domain: 'example.com', count: 12 },
  { domain: 'apple.com', count: 3 },
  { domain: 'zeta.org', count: 12 },
  { domain: 'beta.io', count: 1 },
];
const names = r => r.rows.map(x => x.domain);

// --- Pagination (only a page is returned) -----------------------------------
test('returns only one page and the correct total', () => {
  const r = paginateDomains(rows, { perPage: 2, page: 1, sortField: 'domain', sortDirection: 1 });
  assert.strictEqual(r.total, 5);
  assert.strictEqual(r.totalPages, 3);
  assert.strictEqual(r.rows.length, 2);
});

test('page 2 returns the next slice; page beyond range clamps to the last page', () => {
  // sorted asc: apple.com, beta.io, example.com, gmail.com, zeta.org
  const p2 = paginateDomains(rows, { perPage: 2, page: 2, sortField: 'domain', sortDirection: 1 });
  assert.deepStrictEqual(names(p2), ['example.com', 'gmail.com']);
  const clamped = paginateDomains(rows, { perPage: 2, page: 99, sortField: 'domain', sortDirection: 1 });
  assert.strictEqual(clamped.page, 3);
  assert.strictEqual(clamped.rows.length, 1);
});

// --- Column sorting ----------------------------------------------------------
test('sort by domain ascending / descending', () => {
  const asc = paginateDomains(rows, { perPage: 25, sortField: 'domain', sortDirection: 1 });
  assert.deepStrictEqual(names(asc), ['apple.com', 'beta.io', 'example.com', 'gmail.com', 'zeta.org']);
  const desc = paginateDomains(rows, { perPage: 25, sortField: 'domain', sortDirection: -1 });
  assert.deepStrictEqual(names(desc), ['zeta.org', 'gmail.com', 'example.com', 'beta.io', 'apple.com']);
});

test('sort by count descending, tie-broken by domain name', () => {
  const r = paginateDomains(rows, { perPage: 25, sortField: 'count', sortDirection: -1 });
  // 12/12 tie -> example.com before zeta.org, then 5, 3, 1
  assert.deepStrictEqual(names(r), ['example.com', 'zeta.org', 'gmail.com', 'apple.com', 'beta.io']);
});

test('an unknown sortField falls back to sorting by domain', () => {
  const r = paginateDomains(rows, { perPage: 25, sortField: 'bogus', sortDirection: 1 });
  assert.deepStrictEqual(names(r), ['apple.com', 'beta.io', 'example.com', 'gmail.com', 'zeta.org']);
});

// --- Search ------------------------------------------------------------------
test('search filters by domain substring (case-insensitive) and adjusts total', () => {
  const r = paginateDomains(rows, { perPage: 25, search: 'COM', sortField: 'domain', sortDirection: 1 });
  assert.deepStrictEqual(names(r), ['apple.com', 'example.com', 'gmail.com']);
  assert.strictEqual(r.total, 3);
});

// --- NEGATIVE / edges --------------------------------------------------------
test('a search with no matches returns an empty page and total 0', () => {
  const r = paginateDomains(rows, { perPage: 25, search: 'no-such-domain' });
  assert.deepStrictEqual(r.rows, []);
  assert.strictEqual(r.total, 0);
  assert.strictEqual(r.totalPages, 1);
});

test('non-array / empty input is handled without throwing', () => {
  assert.deepStrictEqual(paginateDomains(undefined).rows, []);
  assert.deepStrictEqual(paginateDomains(null).rows, []);
  const empty = paginateDomains([]);
  assert.strictEqual(empty.total, 0);
  assert.strictEqual(empty.page, 1);
});

test('perPage is clamped to a sane range (>=1, <=200)', () => {
  assert.strictEqual(paginateDomains(rows, { perPage: 0 }).perPage, 25); // 0 -> default
  assert.strictEqual(paginateDomains(rows, { perPage: 9999 }).perPage, 200);
  assert.strictEqual(paginateDomains(rows, { perPage: -5 }).perPage, 25);
});

test('page is never below 1', () => {
  const r = paginateDomains(rows, { perPage: 2, page: -3 });
  assert.strictEqual(r.page, 1);
});

console.log(`\n${passed} tests passed`);
