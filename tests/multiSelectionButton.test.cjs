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

// The activate-button subtree in each template (from js-multiselection-activate up
// to the next sibling at the button's indent).
function multiSelBlock(jade) {
  const i = jade.indexOf('js-multiselection-activate');
  assert.ok(i !== -1, 'has a multi-selection activate button');
  return jade.slice(i, i + 800);
}

test('All Boards button matches the Swimlanes View: icon + text label + nested reset', () => {
  const boards = multiSelBlock(read('client/components/boards/boardsList.jade'));
  const header = multiSelBlock(read('client/components/boards/boardHeader.jade'));

  for (const [name, blk] of [['All Boards', boards], ['Swimlanes View', header]]) {
    assert.ok(/i\.fa\.fa-check-square-o/.test(blk), `${name}: check-square icon`);
    // a text label span with the multi-selection wording (not an icon-only button)
    assert.ok(/span \{\{#if [\w.]+\.isActive\}\}\{\{_ 'multi-selection-on'\}\}\{\{else\}\}\{\{_ 'multi-selection'\}\}/.test(blk),
      `${name}: text label`);
    // reset nested inside, using the thin X icon
    assert.ok(/js-multiselection-reset/.test(blk) && /fa-times-thin/.test(blk), `${name}: nested reset with fa-times-thin`);
  }

  // NEGATIVE guard: the old icon-only wrapper / fat X must be gone from All Boards.
  const raw = read('client/components/boards/boardsList.jade');
  const seg = raw.slice(raw.indexOf('js-multiselection-activate'), raw.indexOf('js-multiselection-activate') + 400);
  assert.ok(!/span\.emoji-icon\s*\n\s*i\.fa\.fa-check-square-o/.test(seg), 'no emoji-icon wrapper around the check icon');
});

test('the nested reset stops propagation so it does not re-activate', () => {
  const js = read('client/components/boards/boardsList.js');
  const i = js.indexOf("'click .js-multiselection-reset'");
  assert.ok(i !== -1, 'reset handler exists');
  const body = js.slice(i, i + 400);
  assert.ok(/stopPropagation\(\)/.test(body), 'reset stops propagation (does not bubble to activate)');
});

console.log(`\nAll ${passed} multi-selection button tests passed`);
