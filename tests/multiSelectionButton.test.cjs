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

// The Multi-Selection button is ONE template now, headerBarControls.jade, which
// both bars include. Parity used to be a thing to check, because there were two
// copies of the markup and they had already drifted - the tooltip on the ✕
// differed. It is now structural, so this checks the structure: one definition,
// both users, and the definition still icon + label + nested reset.
const controls = read('client/components/boards/headerBarControls.jade');
const block = controls.slice(controls.indexOf('template(name="headerMultiSelectionButton")'));

test('the button is defined once, and the board header includes it', () => {
  // It was written for TWO bars, and it still is one template - but All Boards
  // has no header bar any more, so the board is the only user left. All Boards
  // offers Multi-Selection as a sidebar ROW, which is where this restructure
  // puts a control. Kept shared because the board's bar is next to be emptied.
  const header = read('client/components/boards/boardHeader.jade');
  assert.ok(/\+headerMultiSelectionButton\(isActive=MultiSelection\.isActive\)/.test(header),
    'the board header includes the shared button, with its own isActive');
  assert.ok(!/js-multiselection-activate/.test(header),
    'and does not write the button out again');

  const boards = read('client/components/boards/boardsList.jade');
  assert.ok(!/\+headerMultiSelectionButton/.test(boards),
    'All Boards has no header bar to include it in');
  const sidebar = read('client/components/boards/allBoardsSidebar.jade');
  assert.ok(/js-all-boards-sidebar-multiselection/.test(sidebar),
    'it offers Multi-Selection as a sidebar row instead');
});

test('and it is an icon + a text label with the reset nested inside', () => {
  assert.ok(/i\.fa\.fa-check-square-o/.test(block), 'check-square icon');
  assert.ok(/span \{\{#if isActive\}\}\{\{_ 'multi-selection-on'\}\}\{\{else\}\}\{\{_ 'multi-selection'\}\}/.test(block),
    'a text label, not an icon-only button');
  assert.ok(/js-multiselection-reset/.test(block) && /fa-times-thin/.test(block),
    'nested reset with the thin ✕');
  // NEGATIVE: the old icon-only wrapper / fat ✕.
  assert.ok(!/span\.emoji-icon\s*\n\s*i\.fa\.fa-check-square-o/.test(block),
    'no emoji-icon wrapper around the check icon');
  // The ✕ turns Multi-Selection OFF; it used to say "Clear filter" on the board
  // header, which is what a different control does.
  assert.ok(/js-multiselection-reset\(title="\{\{_ 'multi-selection-off'\}\}"\)/.test(block),
    'and its tooltip names what it does');
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
