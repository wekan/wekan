'use strict';

// #3681 asked for a way to filter cards by who created them: with system
// messages disabled there is no other way to see a card's author, and the
// existing member/assignee filters don't help since the creator may never
// have been added as a member or assignee. `models/cards.js`'s `userId`
// field is the card's author (see its own "should probably be called
// authorId" comment), so `Filter.userId` reuses the exact same `SetFilter`
// shape/API as `Filter.members`/`Filter.assignees` and is keyed the same
// way the schema already names the field - no new filtering engine, no new
// card field. This drives the REAL client/lib/filter.js under plain `node`,
// stubbing only the Meteor packages it imports (see
// tests/helpers/meteorStubLoader.mjs).
//
// Run: node tests/creatorFilter3681.test.cjs

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
  console.log('creatorFilter3681:');

  const filterUrl = pathToFileURL(
    path.join(__dirname, '..', 'client', 'lib', 'filter.js'),
  ).href;
  const { Filter } = await import(filterUrl);

  test('Filter.userId exists and starts inactive, same SetFilter API as members/assignees', () => {
    Filter.reset();
    assert.equal(typeof Filter.userId.toggle, 'function');
    assert.equal(typeof Filter.userId.isSelected, 'function');
    assert.equal(Filter.userId.isSelected('u1'), false);
    assert.equal(Filter.isActive(), false);
  });

  test('toggling a creator id activates the filter and is reflected by isSelected', () => {
    Filter.reset();
    Filter.userId.toggle('u1');
    assert.equal(Filter.userId.isSelected('u1'), true);
    assert.equal(Filter.isActive(), true);
  });

  test('toggling the same creator id again clears it', () => {
    Filter.userId.toggle('u1');
    assert.equal(Filter.userId.isSelected('u1'), false);
    assert.equal(Filter.isActive(), false);
  });

  test('userId is part of the fields Filter.reset() clears', () => {
    Filter.userId.toggle('u1');
    assert.equal(Filter.isActive(), true);
    Filter.reset();
    assert.equal(Filter.userId.isSelected('u1'), false);
    assert.equal(Filter.isActive(), false);
  });

  test('the mongo selector filters by the card document\'s own `userId` field', () => {
    Filter.reset();
    Filter.userId.toggle('creatorA');
    const selector = Filter._getMongoSelector();
    // Same $or-of-plain-field-selectors shape every other Filter field
    // produces (see labelFilterThreeState.test.cjs); assert the literal
    // field name used is `userId`, matching models/cards.js's card-author
    // field, not some new/renamed field.
    const matches = selector.$or.some(
      clause => clause.userId && Array.isArray(clause.userId.$in),
    );
    assert.equal(matches, true);
    const clause = selector.$or.find(
      c => c.userId && Array.isArray(c.userId.$in),
    );
    assert.deepEqual(clause.userId.$in, ['creatorA']);
  });

  test('a card created by the filtered user matches; another creator does not', () => {
    Filter.reset();
    Filter.userId.toggle('creatorA');
    const selector = Filter._getMongoSelector();
    const clause = selector.$or.find(
      c => c.userId && Array.isArray(c.userId.$in),
    );
    const matchesUser = id => clause.userId.$in.includes(id);
    assert.equal(matchesUser('creatorA'), true);
    assert.equal(matchesUser('creatorB'), false);
  });

  console.log(`\ncreatorFilter3681: ${passed} tests passed`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
