'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  SIDEBAR_BACK_CLOSE,
  SIDEBAR_BACK_HOME,
  sidebarBackAction,
} = require('../models/lib/sidebarBackAction');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('#3576: mobile Search back closes the sidebar', () => {
  assert.strictEqual(sidebarBackAction('search', true), SIDEBAR_BACK_CLOSE);
});

test('desktop Search back keeps the sidebar and returns Home', () => {
  assert.strictEqual(sidebarBackAction('search', false), SIDEBAR_BACK_HOME);
});

test('other mobile sidebar views retain their Home transition', () => {
  for (const view of ['archives', 'filter', 'customFields', 'multiselection']) {
    assert.strictEqual(sidebarBackAction(view, true), SIDEBAR_BACK_HOME);
  }
});

test('the close action resets Search before hiding the sidebar', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../client/components/sidebar/sidebar.js'),
    'utf8',
  );
  const handler = source.slice(
    source.indexOf("'click .js-back-home'"),
    source.indexOf("'click .js-shortcuts'"),
  );
  assert.ok(handler.includes('tpl._view.set(defaultView)'));
  assert.ok(handler.includes('tpl.hide()'));
  assert.ok(handler.indexOf('tpl._view.set(defaultView)') < handler.indexOf('tpl.hide()'));
});

console.log(`\nsidebarBackAction: ${passed} tests passed`);
