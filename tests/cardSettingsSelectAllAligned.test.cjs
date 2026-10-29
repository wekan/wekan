'use strict';

// Card Settings (Board Settings / Card, and the opened card's Card Settings -
// one template, cardSettingsInline): a row's checkbox starts at its line's
// start; Ask for a reason is the rows' kind of checkbox; the popup is wide
// enough that no row's label is cut. docs/Features/Cards/Card-Settings.md
//
// Deliberate change (2026-10-28): every section's hamburger used to have
// Select all / Select none of the side shown, of On this card and of Show
// empty ('click .js-card-settings-inline-select', selectCardSettingsColumn).
// The maintainer removed On this card and Show empty, and the side's Select
// all / none row with them: a section now has its OWN checkbox left of its
// title (tests/cardSettingsSectionShown.test.cjs). This suite keeps the
// alignment and Ask-for-a-reason checks and pins that the selects are gone.
// Run: node tests/cardSettingsSelectAllAligned.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('cardSettingsSelectAllAligned:');

const jade = read('client/components/sidebar/sidebar.jade');
const popup = jade.slice(jade.indexOf('template(name="boardCardSettingsPopup")')).split('\ntemplate(')[0];
// 2026-10-28: a section's hamburger opens its content in a panel under its
// line (cardSettingsInlinePanel), not the cardSettingsSectionPopup popup.
const sectionMenu = jade.slice(jade.indexOf('template(name="cardSettingsInlinePanel")')).split('\ntemplate(')[0];
const js = read('client/components/sidebar/sidebar.js');
const css = read('client/components/sidebar/sidebar.css');
test('negative: no Select all / Select none anywhere in Card Settings', () => {
  for (const gone of ['js-card-settings-inline-select', 'card-settings-section-menu-select', 'maySelectSide',
    'maySelectThisCard', 'maySelectAlways', 'card-settings-select']) {
    assert.ok(!jade.includes(gone), `jade: ${gone}`);
  }
  for (const gone of ["'click .js-card-settings-inline-select'", 'selectCardSettingsColumn', 'inlineSectionEl',
    "'click .js-card-settings-select'"]) {
    assert.ok(!js.includes(gone), `js: ${gone}`);
  }
  assert.ok(!jade.includes('template(name="cardSettingsSelectButtons")') && !jade.includes('+cardSettingsSelectButtons'));
  assert.ok(!/\.card-settings-select\b|card-settings-section-menu-select/.test(css + read('client/components/cards/cardAddFields.css')), 'their CSS too');
  // The Draggable table in Card's hamburger keeps its own column buttons.
  assert.match(read('client/components/main/boardDragSettings.jade') + read('client/components/main/boardSettingsColumnActions.jade'), /\.board-settings-column-actions\(data-section=section data-column=column\)\n\s+button\.js-set-settings-column\(type="button"/);
  assert.ok(sectionMenu.includes('+boardDragSettings(section="card")'));
});

test('Ask for a reason when moving cards: the rows\' kind of checkbox, first in Card\'s hamburger', () => {
  // Deliberate change: "Show empty fields" above it is gone (2026-10-28), so
  // it is the first thing in Card's hamburger.
  const general = sectionMenu.slice(sectionMenu.indexOf('if sectionIsGeneral'));
  assert.ok(sectionMenu.includes('if sectionIsGeneral'));
  const ask = general.match(/div\.check-div\.card-settings-board-option\.card-settings-ask-move-reason\n\s+a\.flex\.card-ask-move-reason\(class="\{\{#if canModifyBoard\}\}js-ask-move-reason\{\{else\}\}is-disabled\{\{\/if\}\} \{\{#if isAnimating 'askForMoveReason'\}\}is-animating\{\{\/if\}\}" role="checkbox" aria-checked="\{\{#if askForMoveReason\}\}true\{\{else\}\}false\{\{\/if\}\}"\)\n\s+\.materialCheckBox\(class="\{\{#if askForMoveReason\}\}is-checked\{\{\/if\}\}"\)/);
  assert.ok(ask, 'a.flex, materialCheckBox, role and aria-checked');
  assert.ok(!general.includes('card-show-empty-fields'), 'negative: Show empty fields is gone');
  // Negative: no Font Awesome square left for it.
  assert.ok(!/js-ask-move-reason[\s\S]{0,300}fa-square-o/.test(general));
  // The same place: one class gives both the same margin, nothing else differs.
  assert.match(css, /\.card-settings-board-option \{ margin-block-end: 6px; \}/);
  // (The pane's `.card-settings-sections ... is-animating` rule went with
  // the pane: both are in the hamburger popup now, the same markup.)
  assert.ok(!css.includes('.card-settings-sections'), 'negative: no pane-only rule left');
  // Reactive from the board, written by a board admin, animating only when clicked.
  assert.match(js, /askForMoveReason\(\) \{ return ReactiveCache\.getBoard\(Session\.get\('currentBoard'\)\)\?\.askForMoveReason === true; \},/);
  const click = js.slice(js.indexOf("async 'click .js-ask-move-reason'"), js.indexOf("async 'click .js-ask-move-reason'") + 600);
  assert.match(click, /if \(!board \|\| !\(Utils\.canModifyBoard && Utils\.canModifyBoard\(\)\)\) return;\n\s+tpl\.animating\.set\('askForMoveReason'\);/);
  assert.match(click, /await board\.setAskForMoveReason\(board\.askForMoveReason !== true\);/);
  assert.ok(!/toggleClass/.test(click), 'negative: no hand-toggled classes');
});

test('a row\'s cells start at its line\'s start', () => {
  // Deliberate change: there are no column headings to line up any more
  // (the pane's .card-settings-pane-head went with it). What stays is that
  // nothing in a row is centred or right-aligned, and the hamburger's select
  // rows put the column's name and its two buttons on one line.
  assert.ok(!css.includes('.card-settings-pane-head'), 'negative: no column heads left');
  const line = css.slice(css.indexOf('\n.card-settings-line {'), css.indexOf('}', css.indexOf('\n.card-settings-line {')));
  assert.match(line, /display: grid;\n\s+align-items: center;\n\s+justify-items: start;\n\s+text-align: start;/);
  assert.match(css, /\.card-settings-side \{\n\s+display: inline-flex;\n\s+align-items: center;\n\s+justify-content: flex-start;\n\s+justify-self: start;/);
  assert.match(css, /\.card-settings-side > a\.flex \{\n\s+margin: 0;/);
  const table = css.slice(css.indexOf('\n.card-settings-line {'), css.indexOf('.card-field-order-toggle,'));
  assert.ok(table.length > 100, 'the row rules found');
  assert.ok(!/(justify-content|justify-self|justify-items|text-align):\s*(center|end|right|flex-end)/.test(table), 'negative: no centred or right-aligned cell');
});

test('wide enough for every label where the window is', () => {
  // Deliberate change: 600px, about an opened card - Board Settings / Card is
  // the opened card's one column of checklists now, not a menu and a pane of
  // four checkbox columns (1200px). tests/declutterCard6796.test.cjs.
  // Deliberate change (2026-10-28): 1100px - TWO panes of that column side
  // by side, the Minicard's and the Card's, instead of a Show switch.
  assert.match(read('client/lib/popupOffset.js'), /const CARD_SETTINGS_MAX_WIDTH = 1100;/);
  assert.match(read('client/components/main/popup.css'), /\.pop-over\[data-popup='boardCardSettingsPopup'\] \{[^}]*width: min\(96vw, 1100px\) !important;/);
  // A label longer than its column wraps in it instead of being cut.
  assert.match(css, /\.card-settings-line-label \{[^}]*min-width: 0;[^}]*overflow-wrap: anywhere;/);
});

console.log(`cardSettingsSelectAllAligned: ${passed} passed`);
