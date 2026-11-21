'use strict';

// Regression guard for #5439 ("How to have scrollbar always visible on list?").
// List bodies used overflow-y:auto, so overlay scrollbars (macOS/iOS/Android/
// Firefox) auto-hid. The scrollbar must stay visible across desktop and mobile,
// all browser engines. These tests read the rules in list.css itself: they
// used to drive models/lib/scrollbarCss.js, a copy of the same declarations
// that no stylesheet or script loaded, so the copy could pass while list.css
// changed.
// Run: node tests/scrollbarCss.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const listCss = fs.readFileSync(path.join(ROOT, 'client', 'components', 'lists', 'list.css'), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = listCss.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `${selector} rule exists in list.css`);
  return match[1].replace(/\/\*[\s\S]*?\*\//g, '');
}

const body = rule('.list-body');
const webkit = rule('.list-body::-webkit-scrollbar');

// --- POSITIVE: every engine gets an always-visible scrollbar ----------------
test('reserves and shows the track on all engines (overflow-y: scroll)', () => {
  assert.match(body, /overflow-y:\s*scroll/);
});

test('WebKit/Blink (Chrome, Safari, Edge, mobile) get ::-webkit-scrollbar with width', () => {
  assert.match(webkit, /width:\s*10px/);
  assert.match(rule('.list-body::-webkit-scrollbar-thumb'), /background:\s*rgba/);
  assert.match(rule('.list-body::-webkit-scrollbar-track'), /background:\s*rgba/);
});

test('Firefox / Gecko (desktop + Android) get scrollbar-width + scrollbar-color', () => {
  assert.match(body, /scrollbar-width:\s*thin/);
  assert.match(body, /scrollbar-color:\s*rgba/);
});

test('reserves the gutter so content does not shift when the scrollbar shows', () => {
  assert.match(body, /scrollbar-gutter:\s*stable/);
});

// --- NEGATIVE: none of the hide values may appear (they defeat #5439) --------
test('NEGATIVE: never hides the scrollbar (no scrollbar-width: none)', () => {
  assert.doesNotMatch(body, /scrollbar-width:\s*none/);
});

test('NEGATIVE: WebKit scrollbar is not zero-width or display:none', () => {
  assert.doesNotMatch(webkit, /width:\s*0/);
  assert.doesNotMatch(webkit, /display:\s*none/);
});

test('NEGATIVE: does not fall back to overflow hidden/auto (auto lets it auto-hide)', () => {
  assert.doesNotMatch(body, /overflow-y:\s*(hidden|auto)/);
});

test('NEGATIVE: the unloaded copy of these rules does not come back', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'models', 'lib', 'scrollbarCss.js')));
  assert.doesNotMatch(listCss, /scrollbarCss\.js|alwaysVisibleScrollbarCss/);
});

console.log(`\n${passed} tests passed`);
