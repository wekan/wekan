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
const { validateCreateListParams } = require('../models/lib/createListParams.js');

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

console.log(`\nAll ${passed} createListAfter param tests passed`);
