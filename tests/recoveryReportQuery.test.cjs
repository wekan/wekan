'use strict';

// Unit tests for the #6492 recovery report search selector (models/lib/recoveryReportQuery.js).
//
// Run: node tests/recoveryReportQuery.test.cjs

const assert = require('assert');
const { recoveryReportQuery, searchRegex } = require('../models/lib/recoveryReportQuery');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('recoveryReportQuery:');

test('empty term matches everything (no filter)', () => {
  assert.deepStrictEqual(recoveryReportQuery(''), {});
  assert.deepStrictEqual(recoveryReportQuery(null), {});
  assert.deepStrictEqual(recoveryReportQuery(undefined), {});
});

test('a term searches type / detail / db (case-insensitive)', () => {
  const q = recoveryReportQuery('backup');
  assert.ok(Array.isArray(q.$or) && q.$or.length === 3, 'must be an $or over three fields');
  const fields = q.$or.map(c => Object.keys(c)[0]).sort();
  assert.deepStrictEqual(fields, ['db', 'detail', 'type']);
  assert.ok(q.$or.every(c => Object.values(c)[0] instanceof RegExp), 'each is a regex');
  assert.ok(q.$or[0].type.test('BACKUP-created'), 'case-insensitive');
});

test('NEGATIVE — regex metacharacters are escaped (matched literally)', () => {
  const re = searchRegex('a.*b');
  assert.ok(re.test('a.*b'), 'the literal string matches');
  assert.ok(!re.test('axxb'), 'the metacharacters must NOT act as a wildcard');
});

console.log(`\n${passed} tests passed`);
