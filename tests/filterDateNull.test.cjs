'use strict';

// Regression test for #6483: the sidebar "Filter by date" Overdue/past filter
// listed cards that have NO due date.
//
// Cards without a date store the field as null (that is what the noDate filter
// matches: {dueAt: null}). The comparison filters build {$lte: now} etc., and
// under FerretDB and minimongo `$lte` MATCHES null — null sorts before any date
// and neither engine implements MongoDB's type-bracketing — so Overdue selected
// every dateless card. The fix requires a real, non-null value on any
// comparison selector ({...filter, $ne: null}); the noDate filter (null) is
// unchanged.
//
// Run: node tests/filterDateNull.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Mirrors the fixed DateFilter._getMongoSelector transform in client/lib/filter.js.
function dateSelector(filter) {
  if (filter && typeof filter === 'object') {
    return { ...filter, $ne: null };
  }
  return filter;
}

// Minimal matcher that models the FerretDB/minimongo behaviour WITHOUT type
// bracketing: null compares as lower than any date, so `$lte: date` matches
// null. This is the environment that produced the bug; the test proves the fix
// holds even here.
function matches(selector, value) {
  if (selector === null) return value === null; // {field: null}
  const rank = v => (v === null ? -Infinity : v);
  for (const [op, operand] of Object.entries(selector)) {
    switch (op) {
      case '$lte': if (!(rank(value) <= rank(operand))) return false; break;
      case '$gte': if (!(rank(value) >= rank(operand))) return false; break;
      case '$ne':  if (value === operand) return false; break;
      default: throw new Error('unhandled op ' + op);
    }
  }
  return true;
}

const NOW = 1000000;

test('Overdue/past selector excludes cards with no due date (null)', () => {
  const sel = dateSelector({ $lte: NOW });          // "past" filter
  assert.deepStrictEqual(sel, { $lte: NOW, $ne: null });
  assert.strictEqual(matches(sel, null), false);     // dateless card NOT shown
  assert.strictEqual(matches(sel, NOW - 1), true);    // a real overdue date IS shown
  assert.strictEqual(matches(sel, NOW + 1), false);   // a future date is not overdue
});

// Negative control: WITHOUT the fix, the bare {$lte: now} matches null — this is
// exactly the reported bug, and it must NOT be what we ship.
test('NEGATIVE: the unfixed {$lte: now} would have matched a dateless card', () => {
  assert.strictEqual(matches({ $lte: NOW }, null), true);
});

test('range filter (this week/today) also excludes null and keeps in-range dates', () => {
  const sel = dateSelector({ $gte: NOW - 10, $lte: NOW + 10 });
  assert.deepStrictEqual(sel, { $gte: NOW - 10, $lte: NOW + 10, $ne: null });
  assert.strictEqual(matches(sel, null), false);
  assert.strictEqual(matches(sel, NOW), true);
  assert.strictEqual(matches(sel, NOW + 100), false);
});

test('noDate filter (null) is unchanged and still matches dateless cards', () => {
  const sel = dateSelector(null);
  assert.strictEqual(sel, null);
  assert.strictEqual(matches(sel, null), true);
  assert.strictEqual(matches(sel, NOW), false);
});

// Source guard: the real DateFilter must apply the null-exclusion transform, so
// this test cannot pass while the source regresses to `return this._filter`.
test('client/lib/filter.js DateFilter excludes null on comparison selectors', () => {
  const src = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'client/lib/filter.js'),
    'utf8',
  );
  assert.ok(/\{\s*\.\.\.this\._filter,\s*\$ne:\s*null\s*\}/.test(src),
    'DateFilter._getMongoSelector must add $ne: null to object (comparison) selectors');
});

console.log(`\nAll ${passed} filter date-null tests passed`);
