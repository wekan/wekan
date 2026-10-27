'use strict';

// Card Settings (Board Settings / Card, and the opened card's + Add): every
// pane's field table has Select all / Select none under each column's
// heading; headings and the cells under them start at the same x; the popup is
// wide enough that no row's label is cut. docs/Features/Cards/Card-Fields.md
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
const js = read('client/components/sidebar/sidebar.js');
const css = read('client/components/sidebar/sidebar.css');
const handler = js.slice(js.indexOf("async 'click .js-card-settings-select'"), js.indexOf("'keydown .js-card-settings-select'"));

test('Select all and Select none under every column heading, for who may change it', () => {
  const head = popup.slice(popup.indexOf('.card-settings-pane-head'), popup.indexOf('each row in sectionSettingsRows'));
  for (const column of ['minicard', 'card', 'always']) {
    assert.match(head, new RegExp(`if canModifyBoard\\n\\s+\\+cardSettingsSelectButtons\\(column="${column}"\\)`), column);
  }
  // On this card is drawn only for who may change the card (settingsCardId).
  assert.match(head, /if settingsCardId\n\s+span\.card-settings-side-head\.card-settings-side-head-this\n\s+span \{\{_ 'card-settings-this-card'\}\}\n\s+\+cardSettingsSelectButtons\(column="this"\)/);
  assert.strictEqual((head.match(/\+cardSettingsSelectButtons/g) || []).length, 4, 'one pair per column');
  const buttons = jade.slice(jade.indexOf('template(name="cardSettingsSelectButtons")')).split('\ntemplate(')[0];
  // The Draggable table's buttons: real buttons in its container, so the same
  // white text on the theme's colour (forms.css button,
  // boardSettingsColumnActions.css) - and keyboard use comes with them.
  assert.match(buttons, /span\.board-settings-column-actions\.card-settings-select\n/);
  assert.match(buttons, /button\.js-card-settings-select\(type="button" data-column="\{\{column\}\}" data-value="all"\) \{\{_ 'select-all'\}\}/);
  assert.match(buttons, /button\.js-card-settings-select\(type="button" data-column="\{\{column\}\}" data-value="none"\) \{\{_ 'select-none'\}\}/);
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
  assert.match(handler, /await board\.setCardFieldAlwaysShown\(keysOf\('\.js-card-always-show'\), on\);/);
  // Negative: a personal row, a disabled cell and one already as asked are left alone.
  assert.match(handler, /\.filter\(cell => !cell\.classList\.contains\('card-settings-row-personal'\)\)/);
  assert.match(handler, /\.filter\(toggle => toggle && !toggle\.classList\.contains\('is-disabled'\) && isOn\(toggle\) !== on\);/);
  // Scrum rows are one write, or a revision conflict fails all but the first.
  assert.match(handler, /await Meteor\.callAsync\('scrum\.configure', board\._id, \{ visibility: scrum \}, board\.scrumRevision \|\| 0\);/);
  assert.match(handler, /cells\.filter\(t => !t\.classList\.contains\('js-scrum-field-toggle'\)\)\.forEach\(toggle => toggle\.click\(\)\);/);
  assert.ok(!/js-scrum-field-toggle'\)\)\.forEach\(toggle => toggle\.click/.test(handler.replace("!t.classList.contains('js-scrum-field-toggle'))", '')), 'negative: no Scrum row clicked one by one');
});

test('Ask for a reason when moving cards: the same checkbox, in the same place, as Show empty fields', () => {
  const general = popup.slice(popup.indexOf('if openSettingsSectionIsGeneral'));
  const showEmpty = general.match(/div\.check-div\.card-settings-board-option\.card-settings-show-empty-fields\n\s+a\.flex\.card-show-empty-fields\(class="\{\{#if canModifyBoard\}\}js-show-empty-card-fields\{\{else\}\}is-disabled\{\{\/if\}\} \{\{#if isAnimating 'showEmptyCardFields'\}\}is-animating\{\{\/if\}\}" role="checkbox" aria-checked="\{\{#if showEmptyCardFields\}\}true\{\{else\}\}false\{\{\/if\}\}"\)\n\s+\.materialCheckBox\(class="\{\{#if showEmptyCardFields\}\}is-checked\{\{\/if\}\}"\)/);
  const ask = general.match(/div\.check-div\.card-settings-board-option\.card-settings-ask-move-reason\n\s+a\.flex\.card-ask-move-reason\(class="\{\{#if canModifyBoard\}\}js-ask-move-reason\{\{else\}\}is-disabled\{\{\/if\}\} \{\{#if isAnimating 'askForMoveReason'\}\}is-animating\{\{\/if\}\}" role="checkbox" aria-checked="\{\{#if askForMoveReason\}\}true\{\{else\}\}false\{\{\/if\}\}"\)\n\s+\.materialCheckBox\(class="\{\{#if askForMoveReason\}\}is-checked\{\{\/if\}\}"\)/);
  assert.ok(showEmpty && ask, 'both: a.flex, materialCheckBox, role and aria-checked');
  assert.ok(general.indexOf(showEmpty[0]) < general.indexOf(ask[0]), 'right under it');
  // Negative: no Font Awesome square left for it.
  assert.ok(!/js-ask-move-reason[\s\S]{0,300}fa-square-o/.test(general));
  // The same place: one class gives both the same margin, nothing else differs.
  assert.match(css, /\.card-settings-board-option \{ margin-block-end: 6px; \}/);
  assert.match(css, /\.card-settings-sections \.card-show-empty-fields\.is-animating \.materialCheckBox,\n\.card-settings-sections \.card-ask-move-reason\.is-animating \.materialCheckBox \{ transition: 0\.2s; \}/);
  // Reactive from the board, written by a board admin, animating only when clicked.
  assert.match(js, /askForMoveReason\(\) \{ return ReactiveCache\.getBoard\(Session\.get\('currentBoard'\)\)\?\.askForMoveReason === true; \},/);
  const click = js.slice(js.indexOf("async 'click .js-ask-move-reason'"), js.indexOf("'click .js-card-field-order-up'"));
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

test('a heading and its cells start at the same x', () => {
  // The bug: the heading line had the smaller font, and its em columns were
  // narrower than the rows' - each heading drifted left of its column.
  const headRule = css.slice(css.indexOf('.card-settings-pane-head {'), css.indexOf('}', css.indexOf('.card-settings-pane-head {')));
  assert.ok(!/font-size/.test(headRule), 'negative: no font-size on the heading line itself');
  assert.match(css, /\.card-settings-pane-head > span \{\n\s+font-size: calc\(12px \* var\(--wekan-ui-font-scale, 1\)\);/);
  // Every item starts at its column's start edge.
  // (The card's list: Show on Card, Show empty, the field.)
  assert.match(css, /grid-template-columns: 9em 8em minmax\(10em, 1fr\);\n\s+column-gap: 14px;\n\s+align-items: center;\n[\s\S]{0,200}justify-items: start;\n\s+text-align: start;/);
  assert.match(css, /\.card-settings-side \{\n\s+display: inline-flex;\n\s+align-items: center;\n\s+justify-content: flex-start;\n\s+justify-self: start;/);
  assert.match(css, /\.card-settings-side > a\.flex \{\n\s+margin: 0;/);
  // Negative: nothing centres or right-aligns a cell of the table.
  // (The position number keeps text-align: end inside its own min-width, so
  // 9 and 19 line up - that is within a cell, not the cell's place.)
  const table = css.slice(css.indexOf('.card-settings-pane-head,\n.card-settings-line {'), css.indexOf('/* One side of the same popup'))
    .replace(/\.card-settings-position \{[^}]*\}/, '');
  assert.ok(!/(justify-content|justify-self|justify-items|text-align):\s*(center|end|right|flex-end)/.test(table), 'negative: no centred or right-aligned cell');
});

test('wide enough for every label where the window is', () => {
  assert.match(read('client/lib/popupOffset.js'), /const CARD_SETTINGS_MAX_WIDTH = 1200;/);
  assert.match(read('client/components/main/popup.css'), /\.pop-over\[data-popup='boardCardSettingsPopup'\] \{[^}]*width: min\(96vw, 1200px\) !important;/);
  // A label longer than its column wraps in it instead of being cut.
  assert.match(css, /\.card-settings-line-label \{[^}]*min-width: 0;[^}]*overflow-wrap: anywhere;/);
});

console.log(`cardSettingsSelectAllAligned: ${passed} passed`);
