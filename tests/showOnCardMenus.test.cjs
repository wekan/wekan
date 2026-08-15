'use strict';

// "Show on Card" and "Show on Minicard" are in the menus of the things they are
// about. Run: node tests/showOnCardMenus.test.cjs
//
// The board's Card Settings is a table of twenty-four settings with two
// columns: what a card shows, and what a MINICARD shows. It lived in one place
// only - the right sidebar, Board Settings / Card Settings - four clicks from
// the card whose fields it decides.
//
// It is now also the first entry of the menus of those two things: the card
// menu opens "Show on Card", the minicard menu opens "Show on Minicard". Both
// open the SAME popup with the other column hidden, so there is still one list
// of settings and one set of handlers; a setting added to the table shows up in
// all three places by itself.
//
// Two things ride along:
//   * "Hide minicard label text" moved out of the sidebar and into that table
//     as "Labels text", directly under Labels, checked when the text is shown -
//     which is the default. It is personal - profile, or this browser when
//     there is no user - so it appears in the minicard's view only, it is
//     offered to everybody, and a reader who is not a board admin gets that one
//     row rather than a table of checkboxes the server would refuse.
//   * the sidebar's Activities eye became a caret on the heading, the same
//     control an opened card's sections use.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const sidebarJade = read('client/components/sidebar/sidebar.jade');
const sidebarJs = read('client/components/sidebar/sidebar.js');
const sidebarCss = read('client/components/sidebar/sidebar.css');
const cardJade = read('client/components/cards/cardDetails.jade');
const cardJs = read('client/components/cards/cardDetails.js');
const minicardJs = read('client/components/cards/minicard.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('showOnCardMenus:');

// ── the two menu entries ───────────────────────────────────────────────────

const menuStart = cardJade.indexOf('template(name="cardDetailsActionsPopup")');
const menu = cardJade.slice(menuStart,
  cardJade.indexOf('\ntemplate(name=', menuStart + 1));

test('the entry is the first thing in the menu, with a rule under it', () => {
  const showOn = menu.indexOf('js-show-on-minicard');
  const copyLink = menu.indexOf('js-copy-card-link');
  assert.ok(showOn !== -1 && showOn < copyLink, 'above everything else');
  const lines = menu.split('\n');
  const at = lines.findIndex(line => /a\.js-show-on-card$/.test(line.trim()));
  assert.ok(at !== -1, 'the card entry exists');
  // ...and a plain `hr`, the same separator the rest of this menu uses between
  // its groups.
  const after = lines.slice(at, at + 6).map(line => line.trim());
  assert.ok(after.includes('hr'), 'a rule closes the group');
});

test('which entry depends on which hamburger was clicked', () => {
  assert.ok(/if isMinicardMenu/.test(menu), 'the menu asks where it came from');
  assert.ok(menu.indexOf("{{_ 'show-on-minicard'}}") < menu.indexOf("{{_ 'show-on-card'}}"),
    'minicard menu first in the branch, card menu in the else');
  assert.ok(/setCardMenuSource\('minicard'\)/.test(minicardJs), 'the minicard says so');
  assert.ok(/setCardMenuSource\('card'\)/.test(cardJs), 'and the opened card says so');
  assert.ok(/cardMenuSource\(\) === 'minicard'/.test(cardJs), 'which is what the helper reads');
});

test('the source is not stashed on the card document (negative)', () => {
  // #6479's trap: a field added to a Minimongo document as a data context is
  // gone the next time Blaze re-renders the popup with a fresh copy of it.
  const lib = read('client/lib/cardMenuSource.js');
  assert.ok(/new ReactiveVar\('card'\)/.test(lib), 'a module-level reactive value');
  assert.ok(/#6479/.test(lib), 'and the reason is written down');
});

test('the same permission Board Settings asked, and it is the only way in now', () => {
  // Board Settings offered Card Settings to board admins; the card menu offers
  // the same settings, so it asks the same question.
  assert.ok(/else if currentUser\.isBoardAdmin/.test(menu),
    'the card entry is a board admin\'s');
  const boardMenu = sidebarJade.slice(sidebarJade.indexOf('template(name="boardMenuPopup")'));
  assert.ok(/if currentUser\.isBoardAdmin[\s\S]{0,900}js-outgoing-webhooks/.test(boardMenu),
    'which is the gate that menu uses for what is left in it');
  // And the board-wide entry is gone: every setting in that table is now in the
  // menu of the thing it is about, and a third way to one list is a way for two
  // of them to be forgotten.
  assert.ok(!/js-card-settings/.test(sidebarJade), 'no Card Settings row in the board menu');
  assert.ok(!/Popup\.open\('boardCardSettings'\)/.test(sidebarJs), 'and nothing opens it');
  assert.ok(/template\(name="boardCardSettingsPopup"\)/.test(sidebarJade),
    'the table itself stays - the two menus include it');
});

test('both entries open the popup that already existed', () => {
  assert.ok(/'click \.js-show-on-card': Popup\.open\('showOnCard', \{ titleKey: 'show-on-card' \}\)/
    .test(cardJs), 'Show on Card');
  assert.ok(/'click \.js-show-on-minicard': Popup\.open\('showOnMinicard', \{ titleKey: 'show-on-minicard' \}\)/
    .test(cardJs), 'Show on Minicard');
  // Titled from the keys the app already has, rather than adding a
  // `showOnCardPopup-title` to 147 language files for a phrase they have.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en['show-on-card'] && en['show-on-minicard'], 'both keys exist');
  assert.ok(!en['showOnCardPopup-title'] && !en['showOnMinicardPopup-title'],
    'and no second copy of them was added');
});

// ── the two halves of custom fields, together ──────────────────────────────

test('the card menu has no Custom Fields entry any more (negative)', () => {
  // It had two, then one, and now none: every custom field of the board is
  // listed by the hamburger at the end of the card's own Custom Fields heading,
  // with a tick when it is on this card, a pencil each, and Add custom field.
  // That is where the fields are shown, so it is where they are managed.
  assert.ok(!/js-board-custom-fields/.test(menu), 'no board list entry');
  assert.ok(!/js-custom-fields/.test(menu), 'no picker entry either');
  assert.ok(!/card-edit-custom-fields/.test(menu), 'and none of the old wording');
  const cardJade = read('client/components/cards/cardDetails.jade');
  assert.ok(/menuClass="js-open-custom-fields-settings"/.test(cardJade),
    'the section heading carries it instead');
});

// ── one table, one column at a time ────────────────────────────────────────

test('the two popups include the settings rather than repeating them', () => {
  assert.ok(/template\(name="showOnCardPopup"\)\n\s*\+boardCardSettingsPopup\(side="card"\)/
    .test(sidebarJade), 'Show on Card is the card column of it');
  assert.ok(/\+boardCardSettingsPopup\(side="minicard" card=this\)/.test(sidebarJade),
    'Show on Minicard is the minicard column - with the card, for the two rows '
    + 'that belong to one');
  assert.ok(/form\.board-card-settings\(class=settingsSideClass\)/.test(sidebarJade),
    'and the side is a class on the one form');
});

test('the hidden column is hidden by CSS, not by a second list (negative)', () => {
  // Twenty-four settings written out twice would drift the first time one is
  // added; this is the whole reason for the class.
  assert.ok(/settingsSideClass\(\) \{/.test(sidebarJs), 'the helper exists');
  assert.ok(/data\.side === 'card'\) classes\.push\('show-card-only'\)/.test(sidebarJs), 'card side');
  assert.ok(/data\.side === 'minicard'\) classes\.push\('show-minicard-only'\)/.test(sidebarJs),
    'minicard side');
  assert.ok(/show-card-only \.card-settings-row > \.card-settings-column:nth-child\(2\)/
    .test(sidebarCss), 'the card view hides the minicard column');
  assert.ok(/show-minicard-only \.card-settings-row > \.card-settings-column:nth-child\(1\)/
    .test(sidebarCss), 'and the minicard view hides the card column');
  assert.ok(/show-card-only \.card-settings-row,[\s\S]{0,200}grid-template-columns: 1fr 2fr/
    .test(sidebarCss), 'the remaining two fill the row');
  // Board Settings still shows both columns: no side asked for, no class, so
  // the popup it has always been is unchanged.
  const helper = sidebarJs.slice(sidebarJs.indexOf('settingsSideClass()'));
  assert.ok(/const classes = \[\];/.test(helper) && /classes\.join\(' '\)/.test(helper),
    'and with no side asked for, nothing is hidden');
});

// ── the label text ─────────────────────────────────────────────────────────

test('"Labels text" is a row of the table, right under Labels', () => {
  const table = sidebarJade.slice(sidebarJade.indexOf('template(name="boardCardSettingsPopup")'));
  const labels = table.indexOf('js-field-has-labels-on-minicard');
  const personal = table.indexOf('js-toggle-minicard-label-text');
  const cardNumber = table.indexOf('js-field-has-card-number');
  assert.ok(labels < personal && personal < cardNumber,
    'after Labels and before the row that used to follow it');
  const row = table.slice(personal, cardNumber);
  assert.ok(/i\.fa\.fa-tag/.test(row), 'the Labels icon');
  assert.ok(/i\.fa\.fa-file-text-o/.test(row), 'then the one Description Text uses');
  assert.ok(/\| \{\{_ 'labels'\}\}\n\s+\| \{\{_ 'custom-field-text'\}\}/.test(row),
    "and the name is 'Labels' + 'Text', from keys every language already has");
  const home = sidebarJade.slice(sidebarJade.indexOf("template(name='homeSidebar')"),
    sidebarJade.indexOf('template(name="membersWidget")'));
  assert.ok(!/js-toggle-minicard-label-text/.test(home), 'and it is gone from the sidebar');
});

test('checked means the text is SHOWN, which is the default (negative)', () => {
  // The stored flag is "hidden", so reading it straight through would leave the
  // box unticked for the behaviour a board has out of the box - which reads as
  // a broken checkbox.
  assert.ok(/showsMinicardLabelText\(\) \{\n\s+return !hiddenMinicardLabelText\(\);/.test(sidebarJs),
    'the row asks the opposite of the stored flag');
  const row = sidebarJade.slice(sidebarJade.indexOf('js-toggle-minicard-label-text'));
  assert.ok(/\{\{#if showsMinicardLabelText\}\}fa-check\{\{else\}\}fa-square-o/.test(
    row.slice(0, 600)), 'and is ticked when the text is shown');
  const lib = read('client/lib/minicardLabelText.js');
  assert.ok(/return Boolean\(window\.localStorage\.getItem\('hiddenMinicardLabelText'\)\)/.test(lib),
    'nothing stored means nothing hidden, so a new board shows the text');
});

test('"List title" is the first row, above Received, and is the card\'s own', () => {
  // It was a line in the card's menu reading "Show list on minicard"; it is a
  // checkbox among the other things a minicard can show. The board-wide "Show
  // lists" row further down does every card; this does one.
  const table = sidebarJade.slice(sidebarJade.indexOf('template(name="boardCardSettingsPopup")'));
  const listTitle = table.indexOf('js-toggle-show-list-on-minicard');
  const received = table.indexOf('js-field-has-receiveddate');
  assert.ok(listTitle !== -1 && listTitle < received, 'above Received');
  assert.ok(/if canModifyCard\n\s+\.card-settings-row/.test(table.slice(listTitle - 200, received)),
    'and only for somebody who may change the card - the menu entry\'s permission');
  assert.ok(!/js-toggle-show-list-on-minicard/.test(cardJade),
    'gone from the card menu, not offered in both places');

  // Unchecked by default, which is what the field itself says.
  const model = read('models/cards.js');
  const field = model.slice(model.indexOf('showListOnMinicard: {'), model.indexOf('showChecklistAtMinicard: {'));
  assert.ok(/defaultValue: false/.test(field), 'default unchecked');
  assert.ok(/showsListOnMinicard\(\) \{[\s\S]{0,200}card\.showListOnMinicard/.test(sidebarJs),
    'and the checkbox reads that field');
});

test('the card row acts on the card it was opened for (negative)', () => {
  // A minicard's menu is opened from the BOARD, where there is no "current
  // card" to fall back on - so the card is passed in and re-read from the
  // collection, rather than looked up or used as a stale snapshot.
  assert.ok(/function settingsCard\(\)/.test(sidebarJs), 'one place resolves it');
  assert.ok(/ReactiveCache\.getCard\(passed\._id\)/.test(sidebarJs), 're-read, so a click sticks');
  const handler = sidebarJs.slice(sidebarJs.indexOf("'click .js-toggle-show-list-on-minicard'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/if \(!card\) return;/.test(body),
    'and Board Settings, which has no card, changes nothing');
  assert.ok(/showListOnMinicard: !card\.showListOnMinicard/.test(body), 'it toggles');
});

test('the rows that are not the board\'s show in the minicard view only', () => {
  assert.ok(/\.board-card-settings \.card-settings-row-personal \{\n\s+display: none/.test(sidebarCss),
    'hidden by default - Board Settings and Show on Card are about the board and the card');
  assert.ok(/show-minicard-only \.card-settings-row-personal \{\n\s+display: grid/.test(sidebarCss),
    'and shown in the minicard view');
  const popup = sidebarJade.slice(sidebarJade.indexOf('template(name="showOnMinicardPopup")'),
    sidebarJade.indexOf('template(name="boardCardSettingsPopup")'));
  assert.ok(/\+boardCardSettingsPopup\(side="minicard" personalOnly=true card=this\)/.test(popup),
    'a reader who is not a board admin gets those rows alone');
  assert.ok(/show-personal-only \.card-settings-row:not\(\.card-settings-row-personal\)/
    .test(sidebarCss), 'because the board-wide rows are hidden, not disabled');
  // It is personal: a profile field, or this browser when there is nobody
  // logged in - so gating it on being a board admin would take it from the
  // people it was written for.
  const lib = read('client/lib/minicardLabelText.js');
  assert.ok(/currentUser\.profile \|\| \{\}/.test(lib) && /localStorage/.test(lib),
    'stored per user, and per browser without one');
});

test('one module reads and writes it (negative)', () => {
  // There were three copies, and the minicard's own only ever wrote
  // localStorage - so a logged-in user toggling it from the board set something
  // nothing reads.
  const lib = read('client/lib/minicardLabelText.js');
  assert.ok(/Meteor\.call\('toggleMinicardLabelText'\)/.test(lib),
    'a logged-in user writes the profile');
  assert.ok(/only ever wrote localStorage/.test(lib), 'with the bug it fixes recorded');
  for (const [file, source] of [['sidebar.js', sidebarJs], ['minicard.js', minicardJs]]) {
    assert.ok(/from '\/client\/lib\/minicardLabelText'/.test(source),
      `${file} uses the shared module`);
    assert.ok(!/window\.localStorage\.setItem\('hiddenMinicardLabelText'/.test(source),
      `${file} has no copy of the write`);
  }
});

// ── the sidebar's Activities ───────────────────────────────────────────────

test('the Activities heading is a caret, and the eye is gone', () => {
  const home = sidebarJade.slice(sidebarJade.indexOf("template(name='homeSidebar')"),
    sidebarJade.indexOf('template(name="membersWidget")'));
  assert.ok(/h3\.activity-title\.js-toggle-show-activities\(role="button" tabindex="0"/.test(home),
    'the heading itself is the control');
  assert.ok(/i\.fa\(class="\{\{activitiesCaret\}\}"\)/.test(home), 'with a caret in front of it');
  assert.ok(home.indexOf('{{activitiesCaret}}') < home.indexOf('fa-comment-o'),
    'at the LEFT of the activities icon');
  assert.ok(!/activities-eye-toggle|fa-eye-slash|show-activities'\}\}/.test(home),
    'and no eye, and no "Show activities" text beside it');
  const activitiesCss = read('client/components/activities/activities.css');
  assert.ok(!/activities-eye-toggle/.test(activitiesCss), 'the eye took its styles with it');
});

test('the caret is the same one the card sections use', () => {
  assert.ok(/activitiesCaret\(\) \{[\s\S]{0,200}caretClassFor\(/.test(sidebarJs),
    'from the shared rule');
  assert.ok(/caretClassFor\(isCardSectionOpen\(section\)\)/.test(cardJs),
    'which the card asks too - one direction per language');
});

test('the heading works by keyboard as well as by mouse (negative)', () => {
  assert.ok(/'keydown \.js-toggle-show-activities'/.test(sidebarJs), 'Enter and Space toggle it');
  assert.ok(/event\.key !== 'Enter' && event\.key !== ' '/.test(sidebarJs),
    'and only those two');
  const activitiesCss = read('client/components/activities/activities.css');
  assert.ok(/\.activity-title \{[^}]*cursor: pointer/.test(activitiesCss),
    'while a mouse sees a button');
});

test('the two popups are wide, and lay their rows out in columns', () => {
  // Two dozen settings in one column is a list nobody sees the end of: the
  // answer to "is Description on?" was below the fold. With one checkbox column
  // hidden each row is half as wide as it was, so the width buys columns of
  // rows - which is what turns a list you scroll into a table you read.
  const popupCss = read('client/components/main/popup.css');
  for (const popup of ['showOnCardPopup', 'showOnMinicardPopup']) {
    assert.ok(popupCss.includes(`data-popup='${popup}'`), `${popup} has a width rule`);
  }
  assert.ok(/data-popup='showOnMinicardPopup'\] \{\n\s+width: min\(90vw, 900px\)/.test(popupCss),
    'as wide as the window allows, up to 900px');
  const offset = read('client/lib/popupOffset.js');
  assert.ok(/showOnCardPopup: 900/.test(offset) && /showOnMinicardPopup: 900/.test(offset),
    'and the clamp that places them knows the same width');

  const columns = sidebarCss.slice(sidebarCss.indexOf('.board-card-settings.show-card-only,'));
  const body = columns.slice(0, columns.indexOf('}'));
  assert.ok(/display: grid/.test(body), 'the form itself is the grid');
  assert.ok(/repeat\(auto-fill, minmax\(240px, 1fr\)\)/.test(body),
    'as many columns as fit - one on a narrow window, four on a wide one');
  assert.ok(/align-items: start/.test(body), 'and the rows sit at the top of their cells');
});

test('there is no heading row over the columns (negative)', () => {
  // There used to be one, naming the columns of a ROW: "Show on Card" over the
  // checkbox and "Description" over the name. That is what they labelled, but
  // not what they looked like - the rows flow into as many columns as the window
  // fits, so the two headings sat above the FIRST of three or four columns and
  // read as if they named those. The first also repeated the popup's own title,
  // which is "Show on Card" or "Show on Minicard" already. A row is a checkbox
  // and the name of a setting; it needs no heading, and the rule under one is
  // one more line across a popup that is a list of lines.
  assert.ok(!/card-settings-grid/.test(sidebarCss), 'no heading-row CSS is left');
  assert.ok(!/card-settings-grid/.test(sidebarJade), 'and no heading row in the markup');
  assert.ok(!/h4 \{\{_ 'show-on-card'\}\}/.test(sidebarJade),
    'so the popup does not say its own title twice');
  // Desktop only: below 800px every popup is a full-screen sheet and one column
  // is the right answer.
  const at = sidebarCss.lastIndexOf('@media', sidebarCss.indexOf('.board-card-settings.show-card-only,'));
  assert.ok(/min-width: 801px/.test(sidebarCss.slice(at, at + 60)),
    'and the columns are a desktop rule');
});

console.log(`\nshowOnCardMenus: ${passed} tests passed`);
