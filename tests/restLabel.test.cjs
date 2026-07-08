'use strict';

// Plain-Node unit test (no Meteor) for the REST board-label input helper.
// Run: node tests/restLabel.test.cjs
//
// Regression guard for #5510 (adding a board label via the REST API fails with an
// internal server error / timeout). The old PUT /api/boards/:boardId/labels handler
// only responded inside `if (hasOwnProperty(req.body, 'label'))`, so a body without a
// `label` key produced NO response and the request hung; and a body where `label` was
// a bare string produced name === undefined / color === undefined and pushed a
// schema-invalid label. buildBoardLabel must always return a definite outcome:
// a valid { ok:true, name, color } doc for good input, or { ok:false, status:400, ... }
// for bad input — never throwing, never leaving the caller without something to send.

const assert = require('assert');
const { buildBoardLabel, DEFAULT_LABEL_COLOR } = require('../models/lib/restLabel');

// A representative slice of LABEL_COLORS (config/const.js ALLOWED_COLORS).
const COLORS = ['white', 'green', 'yellow', 'orange', 'red', 'blue'];

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- documented success contract (must be unchanged) ------------------------
test('valid { name, color } object builds the expected label doc', () => {
  const r = buildBoardLabel({ name: 'Bug', color: 'red' }, COLORS);
  assert.deepStrictEqual(r, { ok: true, name: 'Bug', color: 'red' });
});

// --- missing color is defaulted, not rejected/thrown ------------------------
test('object with a name but no color defaults the color sensibly', () => {
  const r = buildBoardLabel({ name: 'Bug' }, COLORS);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.name, 'Bug');
  assert.strictEqual(r.color, DEFAULT_LABEL_COLOR);
  assert.ok(COLORS.includes(r.color), 'defaulted color must be an allowed color');
});

test('empty-string color is treated as absent and defaulted', () => {
  const r = buildBoardLabel({ name: 'Bug', color: '' }, COLORS);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.color, DEFAULT_LABEL_COLOR);
});

// --- the exact reported payload: { "label": "labelName" } -------------------
test('#5510: bare string label is taken as the name (no throw, valid doc)', () => {
  const r = buildBoardLabel('labelName', COLORS);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.name, 'labelName');
  assert.strictEqual(r.color, DEFAULT_LABEL_COLOR);
});

// --- missing label / empty body: rejected cleanly, never a hang -------------
test('#5510: missing label (undefined) is rejected with 400, not left to hang', () => {
  const r = buildBoardLabel(undefined, COLORS);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.status, 400);
  assert.ok(typeof r.error === 'string' && r.error.length > 0);
});

test('null label is rejected with 400', () => {
  const r = buildBoardLabel(null, COLORS);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.status, 400);
});

// --- explicit but unknown color is rejected, not silently stored ------------
test('unknown color is rejected with 400', () => {
  const r = buildBoardLabel({ name: 'Bug', color: 'chartreuse' }, COLORS);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.status, 400);
  assert.ok(/chartreuse/.test(r.error));
});

// --- non-string/non-object label is rejected -------------------------------
test('numeric label value is rejected with 400', () => {
  const r = buildBoardLabel(42, COLORS);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.status, 400);
});

// --- nothing ever throws ----------------------------------------------------
test('never throws for a range of odd inputs', () => {
  const inputs = [undefined, null, '', 'x', 0, 42, true, [], {}, { color: 'red' }];
  inputs.forEach(v => {
    assert.doesNotThrow(() => buildBoardLabel(v, COLORS));
    const r = buildBoardLabel(v, COLORS);
    assert.ok(r && typeof r.ok === 'boolean', 'result must always have a boolean ok');
  });
});

console.log(`\n${passed} tests passed.`);
