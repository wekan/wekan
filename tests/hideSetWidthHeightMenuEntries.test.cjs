'use strict';

// List Actions / Set width and Swimlane Actions / Set Swimlane height are
// hidden from their menus: the drag handle still resizes a list or swimlane
// (unless Board Settings / List or Board Settings / Swimlane has locked that),
// and the board-wide fixed-width value now lives in Board Settings / List - a
// menu entry for the same thing was a second place to look for it.
//
// The underlying popups (setListWidthPopup, setSwimlaneHeightPopup) are left
// in place; only the menu entries that opened them are removed. This is a
// static wiring test (no Meteor runtime here).
//
// Run: node tests/hideSetWidthHeightMenuEntries.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('hideSetWidthHeightMenuEntries:');

const listHeaderJade = read('client/components/lists/listHeader.jade');
const swimlaneHeaderJade = read('client/components/swimlanes/swimlaneHeader.jade');

const listMenuStart = listHeaderJade.indexOf('template(name="listActionPopup")');
const listMenu = listHeaderJade.slice(listMenuStart,
  listHeaderJade.indexOf('\ntemplate(name=', listMenuStart + 1));
const swimlaneMenuStart = swimlaneHeaderJade.indexOf('template(name="swimlaneActionPopup")');
const swimlaneMenu = swimlaneHeaderJade.slice(swimlaneMenuStart,
  swimlaneHeaderJade.indexOf('\ntemplate(name=', swimlaneMenuStart + 1));

test('List Actions has no "Set width" entry (negative)', () => {
  assert.ok(!listMenu.includes('js-set-list-width'), 'the entry is gone from the menu');
  assert.ok(!listMenu.includes("{{_ 'set-list-width'}}"), 'and its label with it');
});

test('Swimlane Actions has no "Set Swimlane height" entry (negative)', () => {
  assert.ok(!swimlaneMenu.includes('js-set-swimlane-height'), 'the entry is gone from the menu');
  assert.ok(!swimlaneMenu.includes("{{_ 'set-swimlane-height'}}"), 'and its label with it');
});

test('the underlying popups are untouched - only the menu entries moved', () => {
  assert.ok(listHeaderJade.includes('template(name="setListWidthPopup")'),
    'setListWidthPopup still exists');
  assert.ok(swimlaneHeaderJade.includes('template(name="setSwimlaneHeightPopup")'),
    'setSwimlaneHeightPopup still exists');
  const listHeaderJs = read('client/components/lists/listHeader.js');
  assert.ok(listHeaderJs.includes('Template.setListWidthPopup.helpers'),
    'and its own helpers/events are unchanged');
});

test('removing "Set width" left no dangling hr in List Actions (negative)', () => {
  // The group ("Set width" alone, between two hr) is gone entirely - not left
  // as an hr with nothing under it.
  const lines = listMenu.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length - 1; i += 1) {
    if (lines[i] === 'hr') {
      assert.notStrictEqual(lines[i + 1], 'hr', 'no two hr in a row');
    }
  }
  assert.notStrictEqual(lines[lines.length - 1], 'hr', 'the menu does not end on a bare hr');
});

test('removing "Set Swimlane height" left "Select color" as the only row, gated with its own hr (negative)', () => {
  const lines = swimlaneMenu.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length - 1; i += 1) {
    if (lines[i] === 'hr') {
      assert.notStrictEqual(lines[i + 1], 'hr', 'no two hr in a row');
    }
  }
  // "Select color" is now the only content of its group, so its hr moved
  // inside the same isBoardAdmin check - a non-admin (who cannot select the
  // color either) gets neither the hr nor an empty list.
  const colorAt = lines.findIndex(l => l.includes('js-set-swimlane-color'));
  const lastIfAdmin = lines.slice(0, colorAt).map(l => l).lastIndexOf('if currentUser.isBoardAdmin');
  const lastHr = lines.slice(0, colorAt).lastIndexOf('hr');
  assert.ok(lastIfAdmin !== -1 && lastHr > lastIfAdmin,
    'the hr right before Select color sits inside the isBoardAdmin gate');
});

console.log(`\nhideSetWidthHeightMenuEntries: ${passed} tests passed`);
