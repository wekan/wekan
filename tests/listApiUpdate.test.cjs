'use strict';

// Plain-Node unit test (no Meteor) for the pure helper behind #5396:
// editing a list's title/color via the REST API
// (PUT /api/boards/:boardId/lists/:listId), like cards can be edited.
// Run: node tests/listApiUpdate.test.cjs
//
// The endpoint feeds the request body through buildListPutUpdate() together
// with the injected color normalizer (normalizeListColor on the server). The
// helper must: accept a title (truncated at 1000 chars) and a valid color
// (named palette color OR '#rrggbb' hex), REJECT an unknown color with a clear
// error (so the endpoint answers 4xx instead of storing None), and keep the
// existing starred/wipLimit fields working.

const assert = require('assert');
const { buildListPutUpdate, MAX_TITLE_LENGTH } = require('../models/lib/listApiUpdate');

// Stand-in for models/lists.js normalizeListColor: a small set of named colors
// plus '#rrggbb' hex are allowed; everything else normalizes to '' (rejected).
const NAMED = ['white', 'green', 'red', 'blue', 'silver'];
function normalizeColor(color) {
  if (typeof color !== 'string') return '';
  if (NAMED.includes(color)) return color;
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '';
}

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- title -------------------------------------------------------------------
test('accepts a new list title', () => {
  const { set, error } = buildListPutUpdate({ title: 'Doing' }, normalizeColor);
  assert.strictEqual(error, undefined);
  assert.strictEqual(set.title, 'Doing');
});

test('truncates an over-long title to 1000 chars', () => {
  const { set } = buildListPutUpdate({ title: 'x'.repeat(2000) }, normalizeColor);
  assert.strictEqual(set.title.length, MAX_TITLE_LENGTH);
});

test('ignores an empty title (nothing to set)', () => {
  const { set, error } = buildListPutUpdate({ title: '' }, normalizeColor);
  assert.strictEqual(error, undefined);
  assert.ok(!('title' in set));
});

// --- color: POSITIVE ---------------------------------------------------------
test('accepts a named palette color', () => {
  const { set, error } = buildListPutUpdate({ color: 'green' }, normalizeColor);
  assert.strictEqual(error, undefined);
  assert.strictEqual(set.color, 'green');
});

test('#5514: accepts a custom #rrggbb hex color', () => {
  const { set, error } = buildListPutUpdate({ color: '#a1b2c3' }, normalizeColor);
  assert.strictEqual(error, undefined);
  assert.strictEqual(set.color, '#a1b2c3');
});

// --- color: NEGATIVE (must 4xx, never hang / store None) ---------------------
test('rejects an unknown color with a clear error and no color set', () => {
  const { set, error } = buildListPutUpdate({ color: 'notacolor' }, normalizeColor);
  assert.ok(error, 'an unknown color must produce an error');
  assert.ok(/color/i.test(error));
  assert.strictEqual(set, undefined);
});

test('rejects a malformed hex color', () => {
  const { error } = buildListPutUpdate({ color: '#zzzzzz' }, normalizeColor);
  assert.ok(error);
});

test('a bad color is rejected even when a valid title is also given', () => {
  const { set, error } = buildListPutUpdate({ title: 'ok', color: 'bogus' }, normalizeColor);
  assert.ok(error);
  assert.strictEqual(set, undefined);
});

// --- existing fields keep working -------------------------------------------
test('keeps starred working (including the falsy false value)', () => {
  assert.strictEqual(buildListPutUpdate({ starred: true }, normalizeColor).set.starred, true);
  assert.strictEqual(buildListPutUpdate({ starred: false }, normalizeColor).set.starred, false);
});

test('keeps wipLimit working', () => {
  assert.strictEqual(buildListPutUpdate({ wipLimit: 5 }, normalizeColor).set.wipLimit, 5);
});

test('sets multiple valid fields at once', () => {
  const { set, error } = buildListPutUpdate(
    { title: 'Review', color: 'blue', starred: true },
    normalizeColor,
  );
  assert.strictEqual(error, undefined);
  assert.deepStrictEqual(set, { title: 'Review', color: 'blue', starred: true });
});

// --- empty / no-op body ------------------------------------------------------
test('an empty body yields an empty set and no error (endpoint treats as no-op)', () => {
  const { set, error } = buildListPutUpdate({}, normalizeColor);
  assert.strictEqual(error, undefined);
  assert.deepStrictEqual(set, {});
});

test('a missing body does not throw', () => {
  const { set, error } = buildListPutUpdate(undefined, normalizeColor);
  assert.strictEqual(error, undefined);
  assert.deepStrictEqual(set, {});
});

console.log(`\n${passed} tests passed`);
