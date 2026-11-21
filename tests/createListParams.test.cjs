'use strict';

// Regression test for "save button does nothing when adding a list" — the #6465
// inline composer called createListAfter WITHOUT nextListId, and the server check
// used a non-Optional Match.OneOf for it, so Meteor's `check` threw "Match failed
// [400]" on the missing key. This asserts the param contract accepts exactly the
// shapes the clients send (incl. the composer's, with nextListId omitted), and a
// source guard that the server check uses Match.Optional so omitted keys are allowed.
//
// Run: node tests/createListParams.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
// The pattern the server checks, read from server/models/lists.js and run by
// the rules of Meteor's `check` that it uses: an object pattern rejects a key
// it does not name, and a MISSING key passes only when its sub-pattern is
// Match.Optional. This used to be models/lib/createListParams.js, a hand-made
// copy of the pattern that the server never loaded, so the copy could pass
// while the real check changed.
const OPTIONAL = Symbol('Optional');
const ONE_OF = Symbol('OneOf');
const Match = {
  Optional: pattern => ({ [OPTIONAL]: pattern }),
  OneOf: (...patterns) => ({ [ONE_OF]: patterns }),
};

function matches(value, pattern) {
  if (pattern === String) return typeof value === 'string';
  if (pattern === null) return value === null;
  if (pattern && pattern[OPTIONAL] !== undefined) return value === undefined || matches(value, pattern[OPTIONAL]);
  if (pattern && pattern[ONE_OF]) return pattern[ONE_OF].some(p => matches(value, p));
  if (pattern && typeof pattern === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    for (const key of Object.keys(value)) if (!(key in pattern)) return false;
    return Object.entries(pattern).every(([key, sub]) =>
      (key in value ? matches(value[key], sub) : sub && sub[OPTIONAL] !== undefined));
  }
  throw new Error(`pattern not modelled here: ${String(pattern)}`);
}

function serverPattern(src) {
  const at = src.indexOf('async createListAfter(params)');
  assert.ok(at !== -1, 'createListAfter exists');
  const open = src.indexOf('check(params, {', at);
  assert.ok(open !== -1 && open - at < 600, 'createListAfter checks its params first');
  const close = src.indexOf('\n    });', open);
  // eslint-disable-next-line no-new-func
  return new Function('Match', `return ${src.slice(open + 'check(params, '.length, close + 6)};`)(Match);
}

const PATTERN = serverPattern(fs.readFileSync(path.join(__dirname, '..', 'server/models/lists.js'), 'utf8'));
const validateCreateListParams = params => matches(params, PATTERN);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// The exact object the #6465 inline composer sends (swimlanes.js addListInline):
// note there is NO nextListId key — this is the shape that used to 400.
test('inline composer params (no nextListId) are valid', () => {
  assert.strictEqual(validateCreateListParams({
    title: 'My list',
    boardId: 'board1',
    swimlaneId: 'swim1',
    afterListId: 'list1',
    type: 'list',
  }), true);
});

test('inline composer with null afterListId / undefined swimlaneId is valid', () => {
  assert.strictEqual(validateCreateListParams({
    title: 'My list',
    boardId: 'board1',
    swimlaneId: undefined, // Session miss + no data context
    afterListId: null, // empty-board case
    type: 'list',
  }), true);
});

test('the old add-list form params (all six keys) are valid', () => {
  assert.strictEqual(validateCreateListParams({
    title: 'My list',
    boardId: 'board1',
    swimlaneId: 'swim1',
    afterListId: 'list1',
    nextListId: 'list2',
    type: 'template-list',
  }), true);
});

test('bare minimum (title + boardId only) is valid', () => {
  assert.strictEqual(validateCreateListParams({ title: 'x', boardId: 'b' }), true);
});

// --- negatives ---
test('missing title or boardId is invalid', () => {
  assert.strictEqual(validateCreateListParams({ boardId: 'b' }), false);
  assert.strictEqual(validateCreateListParams({ title: 'x' }), false);
});

test('non-string required fields are invalid', () => {
  assert.strictEqual(validateCreateListParams({ title: 'x', boardId: null }), false);
  assert.strictEqual(validateCreateListParams({ title: 5, boardId: 'b' }), false);
});

test('wrong-typed optional id (number/object) is invalid', () => {
  assert.strictEqual(validateCreateListParams({ title: 'x', boardId: 'b', swimlaneId: 5 }), false);
  assert.strictEqual(validateCreateListParams({ title: 'x', boardId: 'b', afterListId: {} }), false);
});

test('unexpected extra key is invalid', () => {
  assert.strictEqual(validateCreateListParams({ title: 'x', boardId: 'b', bogus: 1 }), false);
});

test('non-object params are invalid', () => {
  assert.strictEqual(validateCreateListParams(null), false);
  assert.strictEqual(validateCreateListParams(undefined), false);
  assert.strictEqual(validateCreateListParams('nope'), false);
  assert.strictEqual(validateCreateListParams([]), false);
});

// --- source guard: the server check must use Match.Optional for the omittable keys
//     (a bare Match.OneOf rejects a MISSING key -> the original bug). ---
test('server createListAfter uses Match.Optional for omittable keys', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const src = fs.readFileSync(path.join(repoRoot, 'server/models/lists.js'), 'utf8');
  const i = src.indexOf('async createListAfter(params)');
  assert.ok(i !== -1, 'method exists');
  const block = src.slice(i, i + 500);
  for (const key of ['swimlaneId', 'afterListId', 'nextListId']) {
    assert.ok(new RegExp(`${key}:\\s*Match\\.Optional\\(`).test(block),
      `${key} must be Match.Optional (missing key allowed)`);
  }
});

test('the rules above reproduce the original bug: a bare Match.OneOf rejects a missing key', () => {
  const old = { title: String, boardId: String, nextListId: Match.OneOf(String, null) };
  assert.strictEqual(matches({ title: 'x', boardId: 'b' }, old), false);
  assert.strictEqual(matches({ title: 'x', boardId: 'b', nextListId: null }, old), true);
});

test('the copy of the pattern that the server never loaded is gone', () => {
  assert.ok(!fs.existsSync(path.join(__dirname, '..', 'models/lib/createListParams.js')));
});

console.log(`\nAll ${passed} createListAfter param tests passed`);
