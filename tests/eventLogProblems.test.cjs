'use strict';

// Unit + negative tests for newProblemsSelector (#6520): the Admin Panel →
// Problems "new problems" count must count actual problems, not the severity:
// 'info' rows the CPU stream writes when a spike is mitigated and when it ends.
// Counting those made an idle server report "57 new problems".
//
// Run: node tests/eventLogProblems.test.cjs

const assert = require('assert');
const { newProblemsSelector } = require('../models/lib/eventLogProblems.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('eventLogProblems:');

test('excludes info-severity rows from the count', () => {
  const sel = newProblemsSelector('cpu');
  assert.deepStrictEqual(sel.severity, { $ne: 'info' });
});

test('scopes to the requested stream', () => {
  assert.strictEqual(newProblemsSelector('cpu').stream, 'cpu');
  assert.strictEqual(newProblemsSelector('security').stream, 'security');
});

test('an acknowledgment time limits the count to newer events', () => {
  const at = new Date('2026-07-01T00:00:00Z');
  assert.deepStrictEqual(newProblemsSelector('cpu', at).at, { $gt: at });
});

test('no acknowledgment time means no `at` clause (count everything unseen)', () => {
  const sel = newProblemsSelector('cpu');
  assert.ok(!('at' in sel), 'must not add an at filter when there is no ack');
  // A falsy ack time is ignored, not turned into { $gt: undefined }.
  assert.ok(!('at' in newProblemsSelector('cpu', null)));
  assert.ok(!('at' in newProblemsSelector('cpu', 0)));
});

// The `$ne` semantics are the whole point: Mongo `{ $ne: 'info' }` matches
// documents where `severity` is missing, so an unclassified event still counts as
// a possible problem rather than being silently dropped.
test('the selector shape counts info-less rows but not info rows (documented $ne semantics)', () => {
  const match = (doc) => {
    const sev = doc.severity;
    // Emulate Mongo $ne: true when the field is absent OR not equal to 'info'.
    return sev === undefined ? true : sev !== 'info';
  };
  assert.strictEqual(match({ severity: 'info' }), false, 'info row is NOT a problem');
  assert.strictEqual(match({ severity: 'high' }), true, 'high row IS a problem');
  assert.strictEqual(match({ severity: 'medium' }), true, 'medium row IS a problem');
  assert.strictEqual(match({}), true, 'unclassified row still counts');
});

console.log(`\n${passed} tests passed`);
