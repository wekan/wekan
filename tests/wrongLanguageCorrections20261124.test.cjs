'use strict';

// 2026-11-24: Venetian (ve-CC) and Veps (ve-PP) had been filled with Venda
// (ve), and Waray (wa-RR) with Walloon (wa) - the tag's first two letters are
// the same, the languages are not. The WP-6 legal-pages strings, and some
// older ones, were replaced with the language each tag names (CLAUDE.md:
// "A locale file must contain its declared language").
//
// The guard: such a variant file shares no translated value with the base
// file it was confused with, apart from words that really are the same in
// both (listed below with the reason).
// Run: node --test tests/wrongLanguageCorrections20261124.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = tag => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'imports/i18n/data', `${tag}.i18n.json`), 'utf8'));
const en = read('en');

const PAIRS = [
  // "Avatar" is the Venetian word too.
  { tag: 've-CC', confusedWith: 've', same: ['avatars', 'move-scope-avatars'] },
  { tag: 've-PP', confusedWith: 've', same: [] },
  // "E-mail" and "pt." are the same in both; the operator letters are search
  // syntax, not prose, and are left as they are.
  {
    tag: 'wa-RR', confusedWith: 'wa',
    same: ['email', 'board-view-email', 'mailReportTitle', 'workload-points-short',
      'operator-board-abbrev', 'operator-swimlane-abbrev', 'operator-assignee-abbrev'],
  },
];

for (const { tag, confusedWith, same } of PAIRS) {
  test(`${tag} is not written in ${confusedWith}'s language`, () => {
    const data = read(tag);
    const other = read(confusedWith);
    const shared = Object.keys(en).filter(k => data[k] === other[k] && data[k] !== en[k] && !same.includes(k));
    assert.deepEqual(shared, []);
  });
}

test('the legal-pages strings are in Venetian, Veps and Waray, placeholders kept', () => {
  assert.equal(read('ve-CC')['terms-of-use'], 'Condision de doparo');
  assert.equal(read('ve-PP')['terms-of-use'], 'Kävutamižen sändod');
  assert.equal(read('wa-RR')['terms-of-use'], 'Mga kondisyon han paggamit');
  for (const tag of ['ve-CC', 've-PP', 'wa-RR']) {
    assert.match(read(tag)['legal-page-version'], /__version__/, tag);
    assert.notEqual(read(tag)['legal-page-version'], en['legal-page-version'], tag);
  }
});
