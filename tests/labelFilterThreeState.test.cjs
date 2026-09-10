'use strict';

// #2886: clicking a label filter chip cycles three states — unfiltered ->
// filter FOR this label (included) -> filter to EXCLUDE this label
// (inverted) -> unfiltered again — instead of the old two-state
// filter/unfilter toggle. This drives the REAL client/lib/filter.js
// (Filter.toggleLabelFilter / Filter.labelIds / Filter.excludedLabelIds /
// Filter._getMongoSelector) under plain `node`, stubbing only the Meteor
// packages it imports (see tests/helpers/meteorStubLoader.mjs), so the
// production cycling and card-matching logic is pinned directly rather than
// reimplemented in the test.
//
// Run: node tests/labelFilterThreeState.test.cjs

const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const { register } = require('node:module');

const loaderUrl = pathToFileURL(
  path.join(__dirname, 'helpers', 'meteorStubLoader.mjs'),
).href;
register(loaderUrl, pathToFileURL(__filename).href);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

(async () => {
  console.log('labelFilterThreeState:');

  const filterUrl = pathToFileURL(
    path.join(__dirname, '..', 'client', 'lib', 'filter.js'),
  ).href;
  const { Filter } = await import(filterUrl);

  test('starts unfiltered for a label neither set has seen', () => {
    Filter.reset();
    assert.equal(Filter.labelIds.isSelected('l1'), false);
    assert.equal(Filter.excludedLabelIds.isSelected('l1'), false);
    assert.equal(Filter.isActive(), false);
  });

  test('1st click: unfiltered -> included (filter FOR the label)', () => {
    Filter.reset();
    Filter.toggleLabelFilter('l1');
    assert.equal(Filter.labelIds.isSelected('l1'), true);
    assert.equal(Filter.excludedLabelIds.isSelected('l1'), false);
    assert.equal(Filter.isActive(), true);
  });

  test('2nd click: included -> excluded (inverted, filter AGAINST the label)', () => {
    Filter.toggleLabelFilter('l1');
    assert.equal(Filter.labelIds.isSelected('l1'), false);
    assert.equal(Filter.excludedLabelIds.isSelected('l1'), true);
    assert.equal(Filter.isActive(), true);
  });

  test('3rd click: excluded -> unfiltered again (back to the start)', () => {
    Filter.toggleLabelFilter('l1');
    assert.equal(Filter.labelIds.isSelected('l1'), false);
    assert.equal(Filter.excludedLabelIds.isSelected('l1'), false);
    assert.equal(Filter.isActive(), false);
  });

  test('the cycle repeats identically a second time around', () => {
    Filter.toggleLabelFilter('l1');
    assert.equal(Filter.labelIds.isSelected('l1'), true);
    Filter.toggleLabelFilter('l1');
    assert.equal(Filter.excludedLabelIds.isSelected('l1'), true);
    Filter.toggleLabelFilter('l1');
    assert.equal(Filter.isActive(), false);
  });

  test('two different labels cycle independently of each other', () => {
    Filter.reset();
    Filter.toggleLabelFilter('l1'); // l1 included
    Filter.toggleLabelFilter('l2'); // l2 included
    Filter.toggleLabelFilter('l2'); // l2 excluded
    assert.equal(Filter.labelIds.isSelected('l1'), true);
    assert.equal(Filter.excludedLabelIds.isSelected('l1'), false);
    assert.equal(Filter.labelIds.isSelected('l2'), false);
    assert.equal(Filter.excludedLabelIds.isSelected('l2'), true);
  });

  // ---- the card-matching predicate (Filter._getMongoSelector) ----

  function selectorMatches(selector, card) {
    // A tiny in-memory evaluator for the shape of selector this suite
    // produces: a top-level $or of plain-field selectors, each field either
    // a literal, {$in: [...]}, {$nin: [...]}, or {$in, $nin} combined (an
    // array field matched by intersection / non-intersection).
    const matchesFieldSelector = (value, fieldSel) => {
      if (fieldSel === null || typeof fieldSel !== 'object') {
        return value === fieldSel;
      }
      const arr = Array.isArray(value) ? value : [value];
      if ('$in' in fieldSel && !arr.some(v => fieldSel.$in.includes(v))) {
        return false;
      }
      if ('$nin' in fieldSel && arr.some(v => fieldSel.$nin.includes(v))) {
        return false;
      }
      return true;
    };
    const matchesClause = clause =>
      Object.entries(clause).every(([field, fieldSel]) => {
        if (field === '_id') {
          return fieldSel.$in.includes(card._id);
        }
        return matchesFieldSelector(card[field], fieldSel);
      });
    if (selector.$or) {
      return selector.$or.some(matchesClause);
    }
    return matchesClause(selector);
  }

  test('excluding a label filters out a card that carries only that label', () => {
    Filter.reset();
    Filter.toggleLabelFilter('l1');
    Filter.toggleLabelFilter('l1'); // -> excluded
    const selector = Filter._getMongoSelector();
    assert.equal(
      selectorMatches(selector, { _id: 'c1', labelIds: ['l1'] }),
      false,
    );
    assert.equal(
      selectorMatches(selector, { _id: 'c2', labelIds: ['l2'] }),
      true,
    );
  });

  test('exclusion wins over inclusion: a card matching an included label ' +
    'is still filtered out if it ALSO carries an excluded label', () => {
    Filter.reset();
    Filter.labelIds.add('l1'); // include l1
    Filter.excludedLabelIds.add('l2'); // exclude l2
    const selector = Filter._getMongoSelector();
    // Has the included label AND the excluded one: exclusion wins.
    assert.equal(
      selectorMatches(selector, { _id: 'c1', labelIds: ['l1', 'l2'] }),
      false,
    );
    // Has only the included label: passes.
    assert.equal(
      selectorMatches(selector, { _id: 'c2', labelIds: ['l1'] }),
      true,
    );
    // Has neither: fails (doesn't match the required inclusion).
    assert.equal(
      selectorMatches(selector, { _id: 'c3', labelIds: [] }),
      false,
    );
  });

  test('an exclude-only filter (no included label) still filters cards ' +
    'carrying the excluded label, and passes every other card', () => {
    Filter.reset();
    Filter.excludedLabelIds.add('l2');
    assert.equal(Filter.isActive(), true);
    const selector = Filter._getMongoSelector();
    assert.equal(
      selectorMatches(selector, { _id: 'c1', labelIds: ['l2'] }),
      false,
    );
    assert.equal(
      selectorMatches(selector, { _id: 'c2', labelIds: ['l1'] }),
      true,
    );
    assert.equal(
      selectorMatches(selector, { _id: 'c3', labelIds: [] }),
      true,
    );
  });

  test('Filter.reset() clears both the included and excluded label sets', () => {
    Filter.labelIds.add('l1');
    Filter.excludedLabelIds.add('l2');
    Filter.reset();
    assert.equal(Filter.labelIds.isSelected('l1'), false);
    assert.equal(Filter.excludedLabelIds.isSelected('l2'), false);
    assert.equal(Filter.isActive(), false);
  });

  console.log(`\nlabelFilterThreeState: ${passed} tests passed`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
