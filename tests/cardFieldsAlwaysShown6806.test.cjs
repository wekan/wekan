'use strict';

// #6806: a board where nearly every card gets labels, a due date and a
// checklist wanted those fields on a new, EMPTY card, ready to be filled in.
//
// Deliberate change (2026-10-28): this suite used to pin the answer #6806 got
// first - Board Settings / Card's "Show empty" column (cardFieldsAlwaysShown,
// by default the description, attachments and comments) and Card's "Show
// empty fields" (showEmptyCardFields). The maintainer replaced both with the
// simpler rule they were approximating: EVERY opened card shows EVERY field
// its board shows on cards (Show on Card), empty or not. #6806's board now
// gets its labels, due date and checklists on every empty card with no
// setting at all. So the suite pins that rule, plus negatives that the two
// settings, their UI, their handlers, their board methods and their strings
// are gone - while the two schema fields stay, so a board that has them still
// validates. docs/Features/Cards/Card-Fields.md
// Run: node tests/cardFieldsAlwaysShown6806.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const f = require('../models/lib/cardShownFields.js');
const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('cardFieldsAlwaysShown6806:');

const flag = key => CARD_SETTINGS_ROWS.find(r => r.key === key).card.field;

test('the reporter\'s board: labels, due date and checklists on a new, empty card - by default', () => {
  const board = { _id: 'b1', [flag('labels')]: true, [flag('dueDate')]: true, [flag('checklists')]: true };
  const view = f.boardForCard(board);
  for (const key of ['labels', 'dueDate', 'checklists']) assert.ok(f.boardAllows(view, key), key);
  // A board that turned one off still does not show it: the board decides.
  const off = { ...board, [flag('dueDate')]: false };
  assert.ok(!f.boardAllows(f.boardForCard(off), 'dueDate'), 'negative: Show on Card off');
});

test('the legacy settings are ignored: they neither hide nor add a field', () => {
  const board = { _id: 'b1', [flag('labels')]: true, [flag('dueDate')]: false,
    cardFieldsAlwaysShown: ['dueDate'], showEmptyCardFields: false };
  const view = f.boardForCard(board);
  assert.strictEqual(view, board, 'nothing to take away');
  assert.ok(f.boardAllows(view, 'labels'), 'labels shown although not in the old list');
  assert.ok(!f.boardAllows(view, 'dueDate'), 'negative: the old list does not turn a field on');
});

test('the schema keeps both fields (old boards validate); no method writes them', () => {
  const boards = read('models/boards.js');
  assert.match(boards, /cardFieldsAlwaysShown: \{[\s\S]{0,200}type: Array,\n\s+optional: true,/);
  assert.match(boards, /'cardFieldsAlwaysShown\.\$': \{\n\s+type: String,\n\s+allowedValues: CARD_SHOWN_FIELD_KEYS,/);
  assert.match(boards, /showEmptyCardFields: \{ type: Boolean, defaultValue: false \},/);
  assert.ok(!/async setCardFieldAlwaysShown|async setShowEmptyCardFields/.test(boards), 'negative: the setters are gone');
  assert.ok(!/\$set: \{[^}]*(cardFieldsAlwaysShown|showEmptyCardFields)/.test(boards), 'negative: nothing writes them');
});

test('negative: no client code reads, writes or draws them', () => {
  for (const file of ['client/components/sidebar/sidebar.js', 'client/components/sidebar/sidebar.jade',
    'client/components/cards/cardAddFields.js', 'client/components/cards/cardDetails.js',
    'client/components/cards/minicard.js', 'models/lib/cardShownFields.js']) {
    const code = read(file).replace(/^\s*(\/\/|\/\/-).*$/gm, '');
    for (const gone of ['cardFieldsAlwaysShown', 'showEmptyCardFields', 'setCardFieldAlwaysShown', 'setShowEmptyCardFields',
      'js-card-always-show', 'js-show-empty-card-fields', 'card-show-empty-fields', 'card-settings-show-empty',
      'boardAlwaysShows', 'boardShowsEmptyFields', 'settingsSideClass']) {
      assert.ok(!code.includes(gone), `${file} still has ${gone}`);
    }
  }
  const css = read('client/components/sidebar/sidebar.css') + read('client/components/cards/cardAddFields.css');
  assert.ok(!/card-always-show|card-show-empty-fields|show-empty-fields/.test(css), 'negative: their CSS is gone');
});

test('Card\'s hamburger keeps only what is not a field: Ask for a reason and the Draggable table', () => {
  // 2026-10-28: a hamburger's content opens in a panel under its line
  // (cardSettingsInlinePanel), not in the cardSettingsSectionPopup popup.
  const jade = read('client/components/sidebar/sidebar.jade');
  const start = jade.indexOf('template(name="cardSettingsInlinePanel")');
  assert.ok(start > 0, 'the panel template exists');
  const menu = jade.slice(start, jade.indexOf('\ntemplate(', start + 1));
  assert.match(menu, /if sectionIsGeneral\n\s+\/\/- What is not a field\.\n\s+div\.check-div\.card-settings-board-option\.card-settings-ask-move-reason/);
  assert.match(menu, /if sectionIsGeneral\n\s+\+boardDragSettings\(section="card"\)/);
});

test('Card Settings lists the sections in each pane\'s side\'s order', () => {
  // 2026-10-28: Card is no longer the topmost section. The opened card draws
  // Card Settings' sections in their order, so the table's (and the card's
  // default) order starts with Labels, which the opened card always showed
  // first; and each pane (Minicard, Card) lists its own side's order.
  const js = read('client/components/sidebar/sidebar.js');
  assert.match(js, /cardSettingsSections\.orderedSections\(cardSettingsSections\.SECTIONS,\n\s+board && board\[cardSettingsSections\.SECTION_ORDER_FIELD\[side\]\], side\)/);
  // Card is kept even with no row on the shown side: its hamburger holds what
  // is not a field.
  assert.match(js, /\.filter\(section => section\.rows\.length \|\| section\.flagRow\n\s+\|\| cardSettingsSections\.SECTIONS\.find\(s => s\.id === section\.id\)\?\.general\);/);
  const sections = require('../models/lib/cardSettingsSections.js');
  assert.strictEqual(sections.SECTIONS[0].id, 'labels');
  assert.strictEqual(sections.sectionOrder(undefined)[0], 'labels');
  assert.strictEqual(sections.sectionOrder(undefined, 'minicard')[0], 'scrum');
  assert.ok(sections.SECTIONS.find(s => s.id === 'card').general, 'Card still holds what is not a field');
});

test('the removed strings are gone from every language, and the earlier names too', () => {
  const dir = path.join(root, 'imports/i18n/data');
  for (const file of fs.readdirSync(dir)) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const gone of ['card-settings-show-empty', 'card-settings-show-empty-fields', 'card-settings-this-card',
      'card-settings-show-when-empty', 'card-settings-always-show']) {
      assert.ok(!(gone in data), `negative: ${file} has no ${gone} left`);
    }
  }
});

console.log(`cardFieldsAlwaysShown6806: ${passed} passed`);
