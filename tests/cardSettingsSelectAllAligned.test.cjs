'use strict';

// Card Settings (Board Settings / Card, and the opened card's Card Settings -
// one template, cardSettingsInline): every section's hamburger has Select all
// / Select none of each column (the side shown, On this card, Show empty);
// a row's checkbox starts at its line's start; the popup is wide enough that
// no row's label is cut. docs/Features/Cards/Card-Settings-On-Card.md
//
// Deliberate change: Board Settings / Card used to be its own menu-and-pane
// layout with Select all / none under each column HEADING
// (cardSettingsSelectButtons, 'click .js-card-settings-select'). It is now
// the opened card's template, so the selects are the section hamburger's
// (cardSettingsSectionPopup, 'click .js-card-settings-inline-select').
// Run: node tests/cardSettingsSelectAllAligned.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const f = require('../models/lib/cardShownFields.js');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('cardSettingsSelectAllAligned:');

const jade = read('client/components/sidebar/sidebar.jade');
const popup = jade.slice(jade.indexOf('template(name="boardCardSettingsPopup")')).split('\ntemplate(')[0];
const sectionMenu = jade.slice(jade.indexOf('template(name="cardSettingsSectionPopup")')).split('\ntemplate(')[0];
const js = read('client/components/sidebar/sidebar.js');
const css = read('client/components/sidebar/sidebar.css');
// The work of Select all / Select none is one function, shared by the popup's
// column buttons and the section hamburgers of Card Settings on the opened
// card (docs/Features/Cards/Card-Settings-On-Card.md); the popup's click
// handler only gathers the keys of its pane.
const selectFn = js.slice(js.indexOf('async function selectCardSettingsColumn('));
const handler = selectFn.slice(0, selectFn.indexOf('\n}\n'));
const clickAt = js.indexOf("async 'click .js-card-settings-inline-select'");
assert.ok(clickAt !== -1, 'the section hamburger\'s select handler');
const clickHandler = js.slice(clickAt).split('\n  },\n')[0];

test('Select all and Select none for every column, in the section\'s hamburger, for who may change it', () => {
  // The side shown (Show on Minicard / Show on Card) for who may change the
  // board, On this card for who may change the card (only with a card, only
  // on the card side), Show empty for a board admin while Show empty fields
  // is off.
  for (const [gate, column] of [['maySelectSide', '{{side}}'], ['maySelectThisCard', 'this'], ['maySelectAlways', 'always']]) {
    assert.match(sectionMenu, new RegExp(`if ${gate}\\n\\s+li\\.card-settings-section-menu-select\\n\\s+span [^\\n]+\\n\\s+span\\.board-settings-column-actions\\.card-settings-select\\n\\s+button\\.js-card-settings-inline-select\\(type="button" data-column="${column.replace(/[{}]/g, '\\$&')}" data-value="all"\\) \\{\\{_ 'select-all'\\}\\}\\n\\s+button\\.js-card-settings-inline-select\\(type="button" data-column="${column.replace(/[{}]/g, '\\$&')}" data-value="none"\\) \\{\\{_ 'select-none'\\}\\}`), gate);
  }
  assert.strictEqual((sectionMenu.match(/data-value="all"/g) || []).length, 3, 'one pair per column');
  assert.match(js, /maySelectSide\(\) \{ return Boolean\(Utils\.canModifyBoard && Utils\.canModifyBoard\(\)\); \},/);
  assert.match(js, /maySelectThisCard\(\) \{\n\s+const card = settingsCard\(\);\n\s+return this\.side === 'card' && Boolean\(card && Utils\.canModifyCard\(card\)\);/);
  // Negative: the popup's own column buttons are gone, with their template
  // and handler, so there is one way to select.
  assert.ok(!jade.includes('template(name="cardSettingsSelectButtons")') && !jade.includes('+cardSettingsSelectButtons'));
  assert.ok(!/js-card-settings-select\(/.test(jade) && !js.includes("'click .js-card-settings-select'"));
  const buttons = sectionMenu;
  // The Draggable table's buttons: real buttons in its container, so the same
  // white text on the theme's colour (forms.css button,
  // boardSettingsColumnActions.css) - and keyboard use comes with them.
  assert.match(buttons, /span\.board-settings-column-actions\.card-settings-select\n/);
  assert.match(read('client/components/main/boardDragSettings.jade') + read('client/components/main/boardSettingsColumnActions.jade'), /\.board-settings-column-actions\(data-section=section data-column=column\)\n\s+button\.js-set-settings-column\(type="button"/, 'the Draggable buttons are the same kind');
  // Negative: no link-styled select (the first version) and no own colour.
  assert.ok(!/card-settings-select-button|a\.[\w.-]*js-card-settings-select/.test(jade));
  assert.ok(!/\.card-settings-select[^{]*\{[^}]*(background|color|text-decoration)/.test(css));
  // Both labels exist in every language.
  const dir = path.join(root, 'imports/i18n/data');
  for (const file of fs.readdirSync(dir)) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    assert.ok(data['select-all'] && data['select-none'], file);
  }
});

test('the handler: each column as its own checkboxes would set it, gated the same way', () => {
  assert.ok(handler.length > 200, 'found');
  // On this card: one write of the card, through the same rule, with the board.
  assert.match(handler, /if \(!card \|\| !Utils\.canModifyCard\(card\)\) return;/);
  // (The data from shownFieldsOf: a linked card's is its source's.)
  assert.match(handler, /next = cardShownFields\.cardFieldsAfter\(\{ \.\.\.view, \.\.\.next \}, key, on, counts, board\);/);
  assert.match(handler, /await Cards\.updateAsync\(card\._id, \{ \$set: next \}\);/);
  // The board's columns: a board admin only.
  assert.ok(handler.indexOf('if (!(Utils.canModifyBoard && Utils.canModifyBoard())) return;') < handler.indexOf("column === 'always'"));
  assert.match(handler, /await board\.setCardFieldAlwaysShown\(keys, on\);/);
  // The section hamburger gives its section's rows: On this card's and Show
  // empty's from the row table, the side's from the section's checklist.
  assert.match(clickHandler, /const rows = sectionRowsOf\(data\.sectionId, data, 'card', null\);/);
  assert.match(clickHandler, /column === 'this' \? rows\.filter\(r => r\.perCard\)\.map\(r => r\.key\)/);
  assert.match(clickHandler, /column === 'always' \? rows\.filter\(r => r\.alwaysShowable\)\.map\(r => r\.key\)/);
  assert.match(clickHandler, /await selectCardSettingsColumn\(tpl, inlineSectionEl\(data\.sectionId, data\.inPopup\), column, value === 'all', keys\);/);
  // Negative: a personal row, a disabled cell and one already as asked are left alone.
  assert.match(handler, /\.filter\(cell => !cell\.classList\.contains\('card-settings-row-personal'\)\)/);
  assert.match(handler, /\.filter\(toggle => toggle && !toggle\.classList\.contains\('is-disabled'\) && isOn\(toggle\) !== on\);/);
  // Scrum rows are one write, or a revision conflict fails all but the first.
  assert.match(handler, /await Meteor\.callAsync\('scrum\.configure', board\._id, \{ visibility: scrum \}, board\.scrumRevision \|\| 0\);/);
  assert.match(handler, /cells\.filter\(t => !t\.classList\.contains\('js-scrum-field-toggle'\)\)\.forEach\(toggle => toggle\.click\(\)\);/);
  assert.ok(!/js-scrum-field-toggle'\)\)\.forEach\(toggle => toggle\.click/.test(handler.replace("!t.classList.contains('js-scrum-field-toggle'))", '')), 'negative: no Scrum row clicked one by one');
});

test('Ask for a reason when moving cards: the same checkbox, in the same place, as Show empty fields', () => {
  // Deliberate change: under the Card section's hamburger now, not the pane.
  const general = sectionMenu.slice(sectionMenu.indexOf('if sectionIsGeneral'));
  assert.ok(sectionMenu.includes('if sectionIsGeneral'));
  const showEmpty = general.match(/div\.check-div\.card-settings-board-option\.card-settings-show-empty-fields\n\s+a\.flex\.card-show-empty-fields\(class="\{\{#if canModifyBoard\}\}js-show-empty-card-fields\{\{else\}\}is-disabled\{\{\/if\}\} \{\{#if isAnimating 'showEmptyCardFields'\}\}is-animating\{\{\/if\}\}" role="checkbox" aria-checked="\{\{#if showEmptyCardFields\}\}true\{\{else\}\}false\{\{\/if\}\}"\)\n\s+\.materialCheckBox\(class="\{\{#if showEmptyCardFields\}\}is-checked\{\{\/if\}\}"\)/);
  const ask = general.match(/div\.check-div\.card-settings-board-option\.card-settings-ask-move-reason\n\s+a\.flex\.card-ask-move-reason\(class="\{\{#if canModifyBoard\}\}js-ask-move-reason\{\{else\}\}is-disabled\{\{\/if\}\} \{\{#if isAnimating 'askForMoveReason'\}\}is-animating\{\{\/if\}\}" role="checkbox" aria-checked="\{\{#if askForMoveReason\}\}true\{\{else\}\}false\{\{\/if\}\}"\)\n\s+\.materialCheckBox\(class="\{\{#if askForMoveReason\}\}is-checked\{\{\/if\}\}"\)/);
  assert.ok(showEmpty && ask, 'both: a.flex, materialCheckBox, role and aria-checked');
  assert.ok(general.indexOf(showEmpty[0]) < general.indexOf(ask[0]), 'right under it');
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

test('Show empty: Select all and Select none set the whole list at once', () => {
  assert.deepStrictEqual(f.alwaysShownAfter({}, ['labels', 'dueDate'], true), ['dueDate', 'labels', 'descriptionTitle', 'descriptionText', 'attachments', 'comments']);
  assert.deepStrictEqual(f.alwaysShownAfter({}, ['descriptionTitle', 'descriptionText', 'attachments', 'comments'], false), []);
  assert.deepStrictEqual(f.alwaysShownAfter({ cardFieldsAlwaysShown: ['labels'] }, ['nope', '$where'], true), ['labels'], 'negative: unknown keys are not added');
  assert.deepStrictEqual(f.alwaysShownAfter({ cardFieldsAlwaysShown: ['labels'] }, 'dueDate', true), ['dueDate', 'labels'], 'one key still works');
});

test('a row\'s cells start at its line\'s start; a select\'s label and buttons share a line', () => {
  // Deliberate change: there are no column headings to line up any more
  // (the pane's .card-settings-pane-head went with it). What stays is that
  // nothing in a row is centred or right-aligned, and the hamburger's select
  // rows put the column's name and its two buttons on one line.
  assert.ok(!css.includes('.card-settings-pane-head'), 'negative: no column heads left');
  const line = css.slice(css.indexOf('\n.card-settings-line {'), css.indexOf('}', css.indexOf('\n.card-settings-line {')));
  assert.match(line, /display: grid;\n\s+align-items: center;\n\s+justify-items: start;\n\s+text-align: start;/);
  assert.match(css, /\.card-settings-side \{\n\s+display: inline-flex;\n\s+align-items: center;\n\s+justify-content: flex-start;\n\s+justify-self: start;/);
  assert.match(css, /\.card-settings-side > a\.flex \{\n\s+margin: 0;/);
  const table = css.slice(css.indexOf('\n.card-settings-line {'), css.indexOf('.card-settings-select {'));
  assert.ok(table.length > 100, 'the row rules found');
  assert.ok(!/(justify-content|justify-self|justify-items|text-align):\s*(center|end|right|flex-end)/.test(table), 'negative: no centred or right-aligned cell');
  assert.match(read('client/components/cards/cardAddFields.css'), /\.card-settings-section-menu \.card-settings-section-menu-select \{\n\s+display: flex;\n\s+flex-wrap: wrap;\n\s+align-items: center;/);
});

test('wide enough for every label where the window is', () => {
  // Deliberate change: 600px, about an opened card - Board Settings / Card is
  // the opened card's one column of checklists now, not a menu and a pane of
  // four checkbox columns (1200px). tests/declutterCard6796.test.cjs.
  assert.match(read('client/lib/popupOffset.js'), /const CARD_SETTINGS_MAX_WIDTH = 600;/);
  assert.match(read('client/components/main/popup.css'), /\.pop-over\[data-popup='boardCardSettingsPopup'\] \{[^}]*width: min\(96vw, 600px\) !important;/);
  // A label longer than its column wraps in it instead of being cut.
  assert.match(css, /\.card-settings-line-label \{[^}]*min-width: 0;[^}]*overflow-wrap: anywhere;/);
});

console.log(`cardSettingsSelectAllAligned: ${passed} passed`);
