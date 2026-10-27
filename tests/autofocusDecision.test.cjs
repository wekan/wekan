'use strict';

// client/lib/autofocus.js focuses an [autofocus] element that a re-render
// added. It focused the LAST [autofocus] anywhere in the document, decided 50
// ms early, and selected its text - so on the import page, typing the
// attachment token after pasting a Jira export moved focus to the JSON, all of
// it selected, and the token replaced it ("Your text is not valid JSON",
// import-attachment-auth.e2e.js). The decision is client/lib/autofocusDecision.js.
// Run: node tests/autofocusDecision.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { autofocusTarget, isTyping } = require('../client/lib/autofocusDecision');

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
const el = (tagName, extra = {}) => ({ tagName, isConnected: true, focus() {}, ...extra });
const body = el('BODY');

test('a popup or form that opens gets its field focused', () => {
  const popupField = el('INPUT');
  assert.strictEqual(autofocusTarget([popupField], body, body), popupField, 'nothing focused yet');
  assert.strictEqual(autofocusTarget([popupField], el('BUTTON'), body), popupField, 'the button that opened it');
  assert.strictEqual(autofocusTarget([popupField], el('A'), body), popupField, 'the link that opened it');
});

test('the newest added element wins', () => {
  const older = el('INPUT'); const newer = el('TEXTAREA');
  assert.strictEqual(autofocusTarget([older, newer], body, body), newer);
});

test('negative: focus is never taken from a field being typed in', () => {
  const pastedJson = el('TEXTAREA');
  const tokenField = el('INPUT');
  assert.strictEqual(autofocusTarget([pastedJson], tokenField, body), null, 'the import page');
  assert.strictEqual(autofocusTarget([pastedJson], el('TEXTAREA'), body), null);
  assert.strictEqual(autofocusTarget([pastedJson], el('SELECT'), body), null);
  assert.strictEqual(autofocusTarget([pastedJson], el('DIV', { isContentEditable: true }), body), null);
});

test('a field the re-render removed, a disabled or read-only one, is not being typed in', () => {
  const composer = el('TEXTAREA');
  assert.strictEqual(autofocusTarget([composer], el('TEXTAREA', { isConnected: false }), body), composer,
    'the add-card composer replaced by a new one after Enter');
  assert.strictEqual(isTyping(el('INPUT', { disabled: true }), body), false);
  assert.strictEqual(isTyping(el('INPUT', { readOnly: true }), body), false);
});

test('negative: nothing added, or only elements already gone, focuses nothing', () => {
  assert.strictEqual(autofocusTarget([], body, body), null);
  assert.strictEqual(autofocusTarget([el('INPUT', { isConnected: false })], body, body), null);
  const already = el('INPUT');
  assert.strictEqual(autofocusTarget([already], already, body), null);
});

test('autofocus.js decides when the focus happens, from what was added', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'client/lib/autofocus.js'), 'utf8');
  assert.match(src, /setTimeout\(\(\) => \{\s*const el = autofocusTarget\(added, document\.activeElement, document\.body\);/);
  assert.doesNotMatch(src.replace(/^\s*\/\/.*$/gm, ''), /elements\[elements\.length - 1\]/, 'not the last [autofocus] of the whole document');
});

console.log(`\nautofocusDecision: ${passed} passed`);
