'use strict';

// Plain-Node unit test (no Meteor) for the board card-search query builder.
// Run: node tests/cardSearch.test.cjs
//
// Regression guard for #5680 ("How can I search for numbers in user-defined
// fields?"): number and currency custom fields store their value as a JS Number,
// but the search only matched custom fields with a regex, and a Mongo/Minimongo
// regex never matches numeric values — so searching a custom-field number found
// nothing. buildCardSearchOr() must add an exact numeric-equality clause for
// plain-number terms while leaving the string regex clauses intact, and must NOT
// add one for non-numeric terms.

const assert = require('assert');
const {
  parseNumericSearchTerm,
  buildCardSearchOr,
} = require('../models/lib/cardSearch');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// A tiny Minimongo-like matcher so we can assert the built $or actually selects
// (or rejects) representative card documents — closer to real behavior than just
// eyeballing the query shape.
function clauseMatches(clause, card) {
  if (clause.title) return clause.title.test(card.title || '');
  if (clause.description) return clause.description.test(card.description || '');
  if (clause.customFields) {
    const cond = clause.customFields.$elemMatch.value;
    const fields = card.customFields || [];
    return fields.some(f => {
      if (cond instanceof RegExp) {
        return typeof f.value === 'string' && cond.test(f.value);
      }
      return f.value === cond; // exact (numeric) equality
    });
  }
  return false;
}
const orMatches = (or, card) => or.some(c => clauseMatches(c, card));

// --- parseNumericSearchTerm --------------------------------------------------
test('parseNumericSearchTerm parses integers and decimals', () => {
  assert.strictEqual(parseNumericSearchTerm('2025001'), 2025001);
  assert.strictEqual(parseNumericSearchTerm('123'), 123);
  assert.strictEqual(parseNumericSearchTerm('123.45'), 123.45);
});

test('parseNumericSearchTerm accepts a comma decimal separator', () => {
  assert.strictEqual(parseNumericSearchTerm('123,00'), 123);
  assert.strictEqual(parseNumericSearchTerm('123,45'), 123.45);
});

test('parseNumericSearchTerm rejects non-plain-numbers', () => {
  // things Number() would otherwise coerce, plus mixed text
  ['', '   ', 'abc', '123abc', '1 2', '0x1f', '1e3', 'NaN', '12,00 €'].forEach(t => {
    assert.strictEqual(parseNumericSearchTerm(t), null, `should reject ${JSON.stringify(t)}`);
  });
});

test('parseNumericSearchTerm tolerates non-string input', () => {
  assert.strictEqual(parseNumericSearchTerm(123), null);
  assert.strictEqual(parseNumericSearchTerm(null), null);
  assert.strictEqual(parseNumericSearchTerm(undefined), null);
});

// --- buildCardSearchOr: POSITIVE --------------------------------------------
test('#5680: a numeric custom field is matched by a number term', () => {
  const or = buildCardSearchOr('2025001');
  const card = { title: 'Invoice', customFields: [{ value: 2025001 }] };
  assert.ok(orMatches(or, card), 'card with numeric custom field should match');
});

test('#5680: a currency custom field (123) matches search "123"', () => {
  const or = buildCardSearchOr('123');
  const card = { title: 'X', customFields: [{ value: 123 }] };
  assert.ok(orMatches(or, card));
});

test('#5680: comma-typed term "123,00" matches numeric value 123', () => {
  const or = buildCardSearchOr('123,00');
  const card = { title: 'X', customFields: [{ value: 123 }] };
  assert.ok(orMatches(or, card));
});

test('string custom fields still match via regex (unchanged behavior)', () => {
  const or = buildCardSearchOr('123');
  const card = { title: 'X', customFields: [{ value: '123,00 €' }] };
  assert.ok(orMatches(or, card));
});

test('title and description still match via regex', () => {
  const or = buildCardSearchOr('hello');
  assert.ok(orMatches(or, { title: 'Say HELLO there' }));
  assert.ok(orMatches(or, { description: 'a hello world card' }));
});

test('the numeric clause is only appended for numeric terms', () => {
  assert.strictEqual(buildCardSearchOr('2025001').length, 4); // + numeric clause
  assert.strictEqual(buildCardSearchOr('hello').length, 3); // no numeric clause
});

// --- buildCardSearchOr: NEGATIVE --------------------------------------------
test('a different number does NOT match (exact equality, not substring)', () => {
  const or = buildCardSearchOr('202');
  const card = { title: 'X', customFields: [{ value: 2025001 }] };
  assert.ok(!orMatches(or, card), '202 must not match 2025001');
});

test('numeric term does not match a numeric field of a different value', () => {
  const or = buildCardSearchOr('124');
  const card = { title: 'X', customFields: [{ value: 123 }] };
  assert.ok(!orMatches(or, card));
});

test('regex clause never matches a numeric field value', () => {
  // Only the string-regex clauses (no numeric term) — a numeric field must not
  // be matched by a regex, which is the exact #5680 bug.
  const or = buildCardSearchOr('hello');
  const card = { customFields: [{ value: 123 }] };
  assert.ok(!orMatches(or, card));
});

test('non-numeric term against a numeric-only card finds nothing', () => {
  const or = buildCardSearchOr('abc');
  const card = { title: 'Numbers', customFields: [{ value: 2025001 }] };
  assert.ok(!orMatches(or, card));
});

console.log(`\n${passed} tests passed`);
