'use strict';
(async () => {

// Tests for models/lib/cardSortTiebreaker.js (#6511).
//
// "10.27: No cards are shown" — the board rendered no cards, with
// `Error: Bad index in range.removeMember: 0` from `diffQueryOrderedChanges` inside a
// Blaze `{{#each}}`. Cause: the card list is a LIMITED, ordered reactive cursor sorted
// by `{ sort: 1 }`, which has TIES; equal `sort` values order non-deterministically,
// so the ordered diff computes an out-of-range index and the #each throws. Appending a
// unique `_id` key makes the order deterministic.
// Run: node tests/cardSortTiebreaker.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { sortWithIdTiebreaker } = await import('../models/lib/cardSortTiebreaker.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

check('object sort gets an _id tiebreaker appended (last)', () => {
  assert.deepStrictEqual(sortWithIdTiebreaker({ sort: 1 }), { sort: 1, _id: 1 });
  assert.deepStrictEqual(sortWithIdTiebreaker({ dueAt: -1 }), { dueAt: -1, _id: 1 });
});

check('an existing _id key is left untouched (idempotent)', () => {
  assert.deepStrictEqual(sortWithIdTiebreaker({ sort: 1, _id: 1 }), { sort: 1, _id: 1 });
  assert.deepStrictEqual(sortWithIdTiebreaker({ _id: -1 }), { _id: -1 });
  // Applying twice is a no-op.
  assert.deepStrictEqual(
    sortWithIdTiebreaker(sortWithIdTiebreaker({ sort: 1 })),
    { sort: 1, _id: 1 });
});

check('array sort form gets an [_id, asc] tiebreaker', () => {
  assert.deepStrictEqual(sortWithIdTiebreaker([['sort', 'asc']]), [['sort', 'asc'], ['_id', 'asc']]);
  assert.deepStrictEqual(sortWithIdTiebreaker(['sort']), ['sort', ['_id', 'asc']]);
  // existing _id (either form) is left alone
  assert.deepStrictEqual(sortWithIdTiebreaker([['_id', 'asc']]), [['_id', 'asc']]);
  assert.deepStrictEqual(sortWithIdTiebreaker(['_id']), ['_id']);
});

check('no / invalid sort becomes a deterministic { _id: 1 }', () => {
  assert.deepStrictEqual(sortWithIdTiebreaker(null), { _id: 1 });
  assert.deepStrictEqual(sortWithIdTiebreaker(undefined), { _id: 1 });
});

// ── source guards: the limited card cursors use the tiebreaker ─────────────────
check('listBody cardsWithLimit tiebreaks the sort before observing', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'client', 'components', 'lists', 'listBody.js'), 'utf8');
  assert.ok(/from '\/models\/lib\/cardSortTiebreaker'/.test(src), 'imports the helper');
  const at = src.indexOf('cardsWithLimit(');
  const body = src.slice(at, at + 1800);
  assert.ok(/sortBy = sortWithIdTiebreaker\(sortBy\)/.test(body),
    'the limited card cursor sort gets an _id tiebreaker');
});

check('the server card window tiebreaks its limited sort too', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'publications', 'cardsWindow.js'), 'utf8');
  assert.ok(/sortWithIdTiebreaker\(sort \|\| \{ sort: 1 \}\)/.test(src),
    'the published window sort is made deterministic');
});

console.log(`\ncardSortTiebreaker: ${passed} checks passed`);

})().catch(e => { console.error(e); process.exit(1); });