'use strict';

// The All Boards Multi-Selection button should look the same as in the Swimlanes
// View (board header): an icon + a text label, with the reset X nested inside the
// button. This guards that parity and that the nested reset stops event propagation
// (otherwise the click bubbles to the activate handler and re-enables it).
//
// Run: node tests/multiSelectionButton.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// The Multi-Selection button was a shared template for two header bars. Both
// bars are gone: All Boards offers Multi-Selection as a sidebar row, and the
// board draws it as an icon in the first header bar. A template shared by
// nobody is not shared, so it was folded back into the one place that draws it.

test('the board draws Multi-Selection as an icon, once', () => {
  const header = read('client/components/boards/boardHeader.jade');
  const buttons = header.slice(header.indexOf('template(name="boardHeaderButtons")'),
    header.indexOf('template(name="boardVisibilityList")'));
  assert.ok(/js-multiselection-activate/.test(buttons), 'the board has the control');
  assert.strictEqual((buttons.match(/js-multiselection-activate/g) || []).length, 1,
    'written once - there is no desktop/mobile copy any more');

  // Icon only, named by a tooltip: the first bar is one row shared with a great
  // deal else, and these are ten controls.
  assert.ok(/i\.fa\.fa-check-square-o/.test(buttons), 'the check-square glyph');
  assert.ok(/title="\{\{#if MultiSelection\.isActive\}\}/.test(buttons),
    'and a tooltip that says which way it goes');
  assert.ok(!/span \{\{#if MultiSelection\.isActive\}\}/.test(buttons),
    'with no visible label');

  // Its ✕ says what it does, and turns Multi-Selection off.
  assert.ok(/js-multiselection-reset\(title="\{\{_ 'multi-selection-off'\}\}"\)/.test(buttons),
    'the reset is named for what it does');

  // All Boards offers the same control as a sidebar row instead.
  assert.ok(/js-all-boards-sidebar-multiselection/.test(
    read('client/components/boards/allBoardsSidebar.jade')),
    'All Boards has it as a sidebar row');
  assert.ok(!fs.existsSync(path.join(repoRoot, 'client/components/boards/headerBarControls.jade')),
    'and the shared template is gone, having no users left');
});

test('the nested reset stops propagation so it does not re-activate', () => {
  // One handler per page, each on the bar that renders its copy: a Blaze event
  // map catches events from the templates inside it.
  for (const js of ['client/components/boards/boardsList.js',
    'client/components/boards/boardHeader.js']) {
    const src = read(js);
    const i = src.indexOf("'click .js-multiselection-reset'");
    assert.notStrictEqual(i, -1, `${js} must handle the reset`);
    assert.ok(/stopPropagation\(\)/.test(src.slice(i, i + 400)),
      `${js}: reset must not bubble to activate`);
  }
});

console.log(`\nAll ${passed} multi-selection button tests passed`);
