'use strict';

// Plain-Node unit test (no Meteor) for the always-visible list scrollbar CSS.
// Run: node tests/scrollbarCss.test.cjs
//
// Regression guard for #5439 ("How to have scrollbar always visible on list?").
// List bodies used overflow-y:auto, so overlay scrollbars (macOS/iOS/Android/
// Firefox) auto-hid. The scrollbar must stay visible across desktop and mobile,
// all browser engines. We verify (a) the cross-browser rule builder emits the
// declarations every engine needs and none of the hide values, and (b) the
// actual list.css applies them.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { alwaysVisibleScrollbarCss } = require('../models/lib/scrollbarCss');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const css = alwaysVisibleScrollbarCss('.list-body');

// --- POSITIVE: every engine gets an always-visible scrollbar ----------------
test('reserves and shows the track on all engines (overflow-y: scroll)', () => {
  assert.ok(/overflow-y:\s*scroll/.test(css));
});

test('WebKit/Blink (Chrome, Safari, Edge, mobile) get ::-webkit-scrollbar with width', () => {
  assert.ok(css.includes('.list-body::-webkit-scrollbar'));
  assert.ok(/::-webkit-scrollbar\s*\{[^}]*width:\s*10px/.test(css));
  assert.ok(css.includes('::-webkit-scrollbar-thumb'));
});

test('Firefox / Gecko (desktop + Android) get scrollbar-width + scrollbar-color', () => {
  assert.ok(/scrollbar-width:\s*thin/.test(css));
  assert.ok(/scrollbar-color:\s*rgba/.test(css));
});

test('reserves the gutter so content does not shift when the scrollbar shows', () => {
  assert.ok(/scrollbar-gutter:\s*stable/.test(css));
});

test('the selector is parameterized', () => {
  assert.ok(alwaysVisibleScrollbarCss('.foo').startsWith('.foo {'));
});

// --- NEGATIVE: none of the hide values may appear (they defeat #5439) --------
test('NEGATIVE: never hides the scrollbar (no scrollbar-width: none)', () => {
  assert.ok(!/scrollbar-width:\s*none/.test(css));
});

test('NEGATIVE: WebKit scrollbar is not zero-width or display:none', () => {
  assert.ok(!/::-webkit-scrollbar\s*\{[^}]*width:\s*0/.test(css));
  assert.ok(!/::-webkit-scrollbar\s*\{[^}]*display:\s*none/.test(css));
});

test('NEGATIVE: does not fall back to overflow hidden/auto (auto lets it auto-hide)', () => {
  assert.ok(!/overflow-y:\s*hidden/.test(css));
  assert.ok(!/overflow-y:\s*auto/.test(css));
});

// --- The feature is actually applied to the list body in list.css -----------
test('list.css applies the always-visible scrollbar to .list-body', () => {
  const listCss = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'lists', 'list.css'),
    'utf8',
  );
  // The .list-body block must use overflow-y: scroll (not auto) ...
  const bodyBlock = listCss.match(/\.list-body\s*\{[^}]*\}/);
  assert.ok(bodyBlock, '.list-body block exists');
  assert.ok(/overflow-y:\s*scroll/.test(bodyBlock[0]), '.list-body uses overflow-y: scroll');
  assert.ok(/scrollbar-width:\s*thin/.test(bodyBlock[0]), '.list-body sets scrollbar-width');
  // ... and provide the WebKit pseudo-elements for mobile/desktop WebKit.
  assert.ok(listCss.includes('.list-body::-webkit-scrollbar'), 'webkit scrollbar rule present');
  assert.ok(listCss.includes('.list-body::-webkit-scrollbar-thumb'), 'webkit thumb rule present');
});

test('NEGATIVE: list.css .list-body no longer uses the auto-hiding overflow-y: auto', () => {
  const listCss = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'lists', 'list.css'),
    'utf8',
  );
  const bodyBlock = listCss.match(/\.list-body\s*\{[^}]*\}/)[0];
  assert.ok(!/overflow-y:\s*auto/.test(bodyBlock), '.list-body must not use overflow-y: auto');
});

console.log(`\n${passed} tests passed`);
