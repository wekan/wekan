'use strict';

// Subtasks Settings is on the Subtasks section, on the opened card.
// Run: node tests/subtaskSettingsMenu.test.cjs
//
// What subtasks DO on a board - whether they are shown at all, which board and
// list a new one is deposited in, and how a parent is named on a minicard - was
// in Board Settings only: open the sidebar, open the board menu, find Subtasks
// Settings. Somebody who wants to change it is looking at the Subtasks section
// of a card at the time.
//
// It is behind a hamburger at the end of that section's heading now - where a
// card and a minicard already keep theirs - and Board Settings no longer offers
// it. The settings themselves are the same template they always were.
//
// The one trap: the heading IS the control that folds the section, so a click
// on the hamburger has to stop there, or opening the menu would close the thing
// it was opened from.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const sidebarJade = read('client/components/sidebar/sidebar.jade');
const sidebarJs = read('client/components/sidebar/sidebar.js');
const cardJade = read('client/components/cards/cardDetails.jade');
const cardJs = read('client/components/cards/cardDetails.js');
const cardCss = read('client/components/cards/cardDetails.css');
const subtasks = read('client/components/cards/subtasks.jade');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('subtaskSettingsMenu:');

test('the Subtasks heading carries a hamburger', () => {
  const header = cardJade.slice(cardJade.indexOf('template(name="cardSectionHeader")'),
    cardJade.indexOf('template(name="editCardTitleForm")'));
  assert.ok(/if menuClass\n\s+a\.card-details-section-menu\(class="\{\{menuClass\}\}"/.test(header),
    'a section may have one, named by the handler that opens it');
  assert.ok(/i\.fa\.fa-navicon/.test(header), 'and it is the hamburger the rest of the card uses');
  assert.ok(/menuClass="js-open-subtasks-settings" menuTitle="subtask-settings"/.test(cardJade),
    'Subtasks asks for one');
  // Custom Fields asks for one too, for the same reason: its settings belong to
  // the section that shows them. tests/customFieldsSectionMenu.test.cjs.
  assert.ok(/menuClass="js-open-custom-fields-settings"/.test(cardJade),
    'and so does Custom Fields');
});

test('it opens the settings, and does not fold the section (negative)', () => {
  const handler = cardJs.slice(cardJs.indexOf("'click .js-open-subtasks-settings'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/Popup\.open\('boardSubtaskSettings'\)\(event\)/.test(body), 'the settings open');
  assert.ok(/event\.stopPropagation\(\)/.test(body),
    'and the click does not reach the heading, which folds the section');
  assert.ok(/event\.preventDefault\(\)/.test(body), 'nor does anything else happen');
});

test('the settings are the same template, in one place', () => {
  assert.ok(/template\(name="boardSubtaskSettingsBody"\)/.test(sidebarJade),
    'the settings are a template of their own');
  assert.ok(/template\(name="boardSubtaskSettingsPopup"\)\n\s*\+boardSubtaskSettingsBody/
    .test(sidebarJade), 'and the popup is that template');
  const deposit = (sidebarJade.match(/js-field-deposit-board/g) || []).length;
  assert.strictEqual(deposit, 1, 'the deposit board select exists once');
  assert.ok(/Template\.boardSubtaskSettingsBody\.onCreated/.test(sidebarJs), 'with its own state');
  assert.ok(!/Template\.boardSubtaskSettingsPopup\./.test(sidebarJs),
    'and the popup that includes it needs no code');
});

test('Board Settings no longer offers it (negative)', () => {
  assert.ok(!/js-subtask-settings/.test(sidebarJade), 'the menu row is gone');
  assert.ok(!/js-subtask-settings/.test(sidebarJs), 'and its handler with it');
});

test('a subtask\'s own menu is about the subtask again (negative)', () => {
  // The settings belong to the section, not to one subtask of it.
  const menu = subtasks.slice(subtasks.indexOf('template(name="subtaskActionsPopup")'));
  assert.ok(!/\+boardSubtaskSettingsBody/.test(menu), 'no settings in the row menu');
  for (const entry of ['js-view-subtask', 'js-go-to-subtask-board', 'js-delete-subtask']) {
    assert.ok(menu.includes(entry), `${entry} is still there`);
  }
});

test('the hamburger sits at the far end, and mirrors (negative)', () => {
  const rule = cardCss.slice(cardCss.indexOf('.card-details-section-menu {') - 200);
  assert.ok(/margin-inline-start: auto/.test(rule.slice(0, 400)),
    'pushed to the end of the row by a LOGICAL margin, so RTL needs no second rule');
  assert.ok(!/margin-left: auto|float: right/.test(rule.slice(0, 400)), 'nothing physical');
});

console.log(`\nsubtaskSettingsMenu: ${passed} tests passed`);
