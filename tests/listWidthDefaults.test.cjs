'use strict';
(async () => {

// List width is now a single hardcoded constant (models/lib/listWidth.js) -
// every list on every board renders at this width, for every viewer, with
// no per-board, per-list, personal or auto-width customization and no
// drag-resize handle. This replaces the #5659/#5729/#6409 model (personal
// per-user widths, a per-list shared width, a viewer-toggled "same width for
// all lists" mode, a viewer-toggled auto-width mode) at the maintainer's
// request: list width is simply fixed at 240px.
//
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/listWidthDefaults.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { DEFAULT_LIST_WIDTH } = await import('../models/lib/listWidth.js');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('the hardcoded width is 240px', () => {
  assert.strictEqual(typeof DEFAULT_LIST_WIDTH, 'number');
  assert.strictEqual(DEFAULT_LIST_WIDTH, 240);
});

test('there is no per-board, per-list or per-user customization left to export (negative)', () => {
  // Every one of these names belonged to the old model: a personal width per
  // user/list, a per-board "fixed"/"same width for all lists" toggle and
  // value, and a per-board/per-user auto-width toggle.
  const removedNames = [
    'isPersonalListWidth', 'allowsPersonalListWidth',
    'isFixedListWidth', 'getFixedListWidth', 'setFixedListWidth',
    'isAutoWidth', 'toggleAutoWidth', 'effectiveAutoWidth', 'autoWidth',
    'getListWidths', 'setListWidthToStorage', 'getListWidthFromStorage',
  ];
  for (const file of [
    'models/users.js', 'models/boards.js',
    'client/components/lists/list.js', 'client/components/lists/listHeader.js',
  ]) {
    const src = read(file);
    for (const name of removedNames) {
      assert.ok(!src.includes(name), `${file} must not reference ${name}`);
    }
  }
});

test('there is no drag-resize handle for lists any more (negative)', () => {
  const jade = read('client/components/lists/list.jade');
  const js = read('client/components/lists/list.js');
  assert.ok(!/list-resize-handle/.test(jade), 'list.jade has no resize handle element');
  assert.ok(!/initializeListResize|canResizeList/.test(js), 'list.js has no resize wiring');
});

test('the "Set width" list-menu option and its popup are gone (negative)', () => {
  const jade = read('client/components/lists/listHeader.jade');
  const js = read('client/components/lists/listHeader.js');
  assert.ok(!/js-set-list-width/.test(jade), 'no menu item opens it');
  assert.ok(!/setListWidthPopup|listWidthErrorPopup/.test(jade), 'no popup templates remain');
  assert.ok(!/setListWidthPopup/.test(js), 'no popup helpers/events remain');
});

test('the "Set swimlane height" menu option and its popup are gone (negative)', () => {
  const jade = read('client/components/swimlanes/swimlaneHeader.jade');
  const js = read('client/components/swimlanes/swimlaneHeader.js');
  assert.ok(!/js-set-swimlane-height/.test(jade), 'no menu item opens it');
  assert.ok(!/setSwimlaneHeightPopup|swimlaneHeightErrorPopup/.test(jade), 'no popup templates remain');
  assert.ok(!/setSwimlaneHeightPopup/.test(js), 'no popup helpers/events remain');
});

test('client list.js renders every list at the one hardcoded width', () => {
  const src = read('client/components/lists/list.js');
  assert.ok(src.includes("from '/models/lib/listWidth'"), 'imports /models/lib/listWidth');
  assert.match(src, /listWidth\(\)\s*\{\s*return DEFAULT_LIST_WIDTH;/,
    'the listWidth() helper returns the constant directly, unconditionally');
});

console.log(`\n${passed} tests passed`);

})().catch(e => { console.error(e); process.exit(1); });
