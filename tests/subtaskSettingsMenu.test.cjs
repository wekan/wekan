'use strict';

// Subtasks Settings is in the menu of the subtask it is about.
// Run: node tests/subtaskSettingsMenu.test.cjs
//
// What subtasks DO on a board - whether they are shown at all, which board and
// list a new one is deposited in, and how a parent is named on a minicard - was
// in Board Settings only: open the sidebar, open the board menu, find Subtasks
// Settings. Somebody who wants to change it is usually looking at a subtask on
// an opened card at the time.
//
// It is under a rule at the bottom of that subtask's own menu now, below the
// things the menu does to the subtask itself, and it is the SAME template Board
// Settings draws - with its own state and handlers, so neither place needs code
// of its own and the two cannot drift.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const sidebarJade = read('client/components/sidebar/sidebar.jade');
const sidebarJs = read('client/components/sidebar/sidebar.js');
const subtasks = read('client/components/cards/subtasks.jade');

const menu = subtasks.slice(subtasks.indexOf('template(name="subtaskActionsPopup")'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('subtaskSettingsMenu:');

test('the settings are their own template, included by both', () => {
  assert.ok(/template\(name="boardSubtaskSettingsBody"\)/.test(sidebarJade),
    'the settings are a template of their own');
  assert.ok(/template\(name="boardSubtaskSettingsPopup"\)\n\s*\+boardSubtaskSettingsBody/
    .test(sidebarJade), 'Board Settings is that template');
  assert.ok(/\+boardSubtaskSettingsBody/.test(menu), 'and so is the subtask menu');
  // One copy of the settings themselves: the deposit board and list, which
  // exist nowhere else. (`js-field-has-subtasks` is not a witness - the Card
  // Settings table has a row of that name for a different thing.)
  const deposit = (sidebarJade.match(/js-field-deposit-board/g) || []).length;
  assert.strictEqual(deposit, 1, 'the deposit board select exists once');
  const body = sidebarJade.slice(sidebarJade.indexOf('template(name="boardSubtaskSettingsBody")'),
    sidebarJade.indexOf('template(name="boardSubtaskSettingsPopup")'));
  assert.ok(/js-field-has-subtasks\(/.test(body), 'and it is the one in this template');
});

test('they sit at the bottom of the menu, under a rule', () => {
  const lines = menu.split('\n');
  const at = lines.findIndex(l => l.includes('+boardSubtaskSettingsBody'));
  assert.ok(at !== -1, 'the settings are in the menu');
  assert.strictEqual(lines[at - 1].trim(), 'hr', 'a rule above them');
  assert.ok(menu.indexOf('js-delete-subtask') < menu.indexOf('+boardSubtaskSettingsBody'),
    'below what the menu does to the subtask itself');
});

test('a board admin only, as in Board Settings (negative)', () => {
  const lines = menu.split('\n');
  const at = lines.findIndex(l => l.includes('+boardSubtaskSettingsBody'));
  assert.strictEqual(lines[at - 2].trim(), 'if currentUser.isBoardAdmin',
    'the rule and the settings are both behind the gate');
  const boardMenu = sidebarJade.slice(sidebarJade.indexOf('template(name="boardMenuPopup")'));
  assert.ok(/if currentUser\.isBoardAdmin[\s\S]{0,900}js-subtask-settings/.test(boardMenu),
    'which is the gate Board Settings uses for the same thing');
});

test('the state and the handlers moved with the markup (negative)', () => {
  // A template included in two places cannot rely on its parent's helpers: they
  // are looked up on the template they are written in.
  assert.ok(/Template\.boardSubtaskSettingsBody\.onCreated/.test(sidebarJs), 'its own state');
  assert.ok(/Template\.boardSubtaskSettingsBody\.helpers/.test(sidebarJs), 'its own helpers');
  assert.ok(/Template\.boardSubtaskSettingsBody\.events/.test(sidebarJs), 'its own handlers');
  assert.ok(!/Template\.boardSubtaskSettingsPopup\./.test(sidebarJs),
    'and the popup that only includes it has none');
});

test('Board Settings still has the entry it always had', () => {
  assert.ok(/js-subtask-settings/.test(sidebarJade), 'the row is still there');
  assert.ok(/'click \.js-subtask-settings': Popup\.open\('boardSubtaskSettings'\)/.test(sidebarJs),
    'and still opens the popup');
});

console.log(`\nsubtaskSettingsMenu: ${passed} tests passed`);
