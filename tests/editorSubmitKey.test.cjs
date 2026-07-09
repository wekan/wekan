'use strict';

// Plain-Node unit test (no Meteor) for the editor submit-key rule.
// Run: node tests/editorSubmitKey.test.cjs
//
// Regression guard for #4236 ("The processing strategy for the enter key is
// different"). The card title textarea submitted on PLAIN Enter, so Enter could
// not insert a new line, while the description textarea (and shared inlinedForm)
// only submit on Ctrl/Cmd+Enter. isSubmitKey() centralizes the rule: submit
// ONLY on Enter + Ctrl/Cmd; plain Enter and Shift+Enter make a newline.

const assert = require('assert');
const { isSubmitKey } = require('../models/lib/editorSubmitKey');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE: only Ctrl/Cmd+Enter submits ----------------------------------
test('Ctrl+Enter submits', () => {
  assert.strictEqual(isSubmitKey({ keyCode: 13, ctrlKey: true }), true);
});

test('Cmd/Meta+Enter submits', () => {
  assert.strictEqual(isSubmitKey({ keyCode: 13, metaKey: true }), true);
});

test('works via event.key === "Enter" too (not just keyCode)', () => {
  assert.strictEqual(isSubmitKey({ key: 'Enter', ctrlKey: true }), true);
});

// --- NEGATIVE: everything else must add a newline, i.e. NOT submit (#4236) ---
test('NEGATIVE: plain Enter does NOT submit (the #4236 fix — it adds a newline)', () => {
  assert.strictEqual(isSubmitKey({ keyCode: 13 }), false);
});

test('NEGATIVE: Shift+Enter does NOT submit', () => {
  assert.strictEqual(isSubmitKey({ keyCode: 13, shiftKey: true }), false);
});

test('NEGATIVE: Ctrl+Shift+Enter still submits (Ctrl wins)', () => {
  assert.strictEqual(isSubmitKey({ keyCode: 13, ctrlKey: true, shiftKey: true }), true);
});

test('NEGATIVE: a non-Enter key never submits, even with Ctrl', () => {
  assert.strictEqual(isSubmitKey({ keyCode: 65, ctrlKey: true }), false);
  assert.strictEqual(isSubmitKey({ key: 'a', metaKey: true }), false);
});

test('NEGATIVE: null / undefined event does not throw and does not submit', () => {
  assert.doesNotThrow(() => isSubmitKey(null));
  assert.strictEqual(isSubmitKey(null), false);
  assert.strictEqual(isSubmitKey(undefined), false);
});

console.log(`\n${passed} tests passed`);
