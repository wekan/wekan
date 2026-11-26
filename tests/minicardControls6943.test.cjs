'use strict';
// #6943: the two controls at the top of every minicard - the collapse caret
// and the card actions menu (☰) - can each be hidden in Board Settings / Card
// (section Card, Show on Minicard) and for the whole WeKan in the Admin Panel
// (Visibility / Features, the card fields), and the minicard's content then
// takes their place.
// Run: node tests/minicardControls6943.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const { CARD_SETTINGS_ROWS, rowsForSide } = require('../models/lib/cardSettingsRows');
const { SECTIONS, sectionFieldsOn } = require('../models/lib/cardSettingsSections');
const { CARD_FIELD_KEYS, applyCardFieldVisibility } = require('../models/lib/cardFieldVisibility');
const { boardForMinicard } = require('../models/lib/cardShownFields');

const CONTROLS = { collapse: 'allowsMinicardCollapse', minicardMenu: 'allowsMinicardMenu' };
const row = key => CARD_SETTINGS_ROWS.find(r => r.key === key);

test('both controls are rows of Show on Minicard, in section Card, next to each other', () => {
  for (const [key, field] of Object.entries(CONTROLS)) {
    assert.equal(row(key).minicard.field, field, key);
  }
  assert.equal(row('minicardMenu').minicard.flag, true);
  assert.equal(row('minicardMenu').minicard.default, true, 'a board that never chose keeps its menu');
  assert.deepEqual(row('minicardMenu').label, ['cardDetailsActionsPopup-title'], 'named as the menu is, an existing key');
  assert.equal(row('minicardMenu').card, undefined, 'the opened card keeps its own menu');
  const card = SECTIONS.find(s => s.id === 'card');
  assert.ok(card.keys.includes('collapse') && card.keys.includes('minicardMenu'));
  const inCard = sectionFieldsOn('minicard', [], 'card');
  assert.equal(inCard.indexOf('minicardMenu'), inCard.indexOf('collapse') + 1, 'the menu row follows the caret row');
  assert.ok(rowsForSide('minicard', []).some(r => r.key === 'minicardMenu'));
});

test('the Admin Panel has a tick for each, and unticked the minicard reads it off', () => {
  for (const [key, field] of Object.entries(CONTROLS)) {
    assert.ok(CARD_FIELD_KEYS.includes(key), key);
    const board = { _id: 'b', [field]: true };
    assert.equal(applyCardFieldVisibility(board, { cardFieldStates: { [key]: false } })[field], false, key);
    // Negative: the tick on, or another field unticked, leaves it shown.
    assert.equal(applyCardFieldVisibility(board, { cardFieldStates: { [key]: true } })[field], true, key);
    assert.equal(applyCardFieldVisibility(board, { cardFieldStates: { labels: false } })[field], true, key);
  }
});

test('hiding section Card on the minicard hides both controls too', () => {
  const board = { _id: 'b', allowsMinicardCollapse: true, allowsMinicardMenu: true, cardSettingsHiddenOnMinicard: ['card'] };
  const view = boardForMinicard(board);
  for (const field of Object.values(CONTROLS)) assert.equal(view[field], false, field);
  // Negative: another section hidden leaves them.
  const other = boardForMinicard({ ...board, cardSettingsHiddenOnMinicard: ['labels'] });
  for (const field of Object.values(CONTROLS)) assert.equal(other[field], true, field);
});

test('the minicard draws each control only when its flag allows it', () => {
  const jade = read('client/components/cards/minicard.jade');
  const js = read('client/components/cards/minicard.js');
  assert.match(js, /showCollapseControl\(\) \{ return minicardBoardOf\(this\)\?\.allowsMinicardCollapse !== false; \}/);
  assert.match(js, /showMinicardMenu\(\) \{ return minicardBoardOf\(this\)\?\.allowsMinicardMenu !== false; \}/);
  assert.match(jade, /if showMinicardMenu\n\s+a\.minicard-details-menu-with-handle\.js-open-minicard-details-menu/);
  assert.match(jade, /if showCollapseControl\n\s+a\.fa\.minicard-collapse\.js-collapse-minicard/);
  // Negative: no other place draws the minicard menu unconditionally.
  assert.equal((jade.match(/js-open-minicard-details-menu/g) || []).length, 1);
});

test('with the menu hidden the content takes the corner it kept free', () => {
  const jade = read('client/components/cards/minicard.jade');
  const css = read('client/components/cards/minicard.css');
  assert.match(jade, /class="\{\{#unless showMinicardMenu\}\}minicard-no-menu\{\{\/unless\}\}"/);
  // The title too (#6943 comment 7190880990): its 21px beside the menu.
  assert.match(css, /\.minicard\.minicard-no-menu:not\(\.minicard-with-handle\) \.minicard-labels,\n\.minicard\.minicard-no-menu:not\(\.minicard-with-handle\) \.minicard-custom-fields,\n\.minicard\.minicard-no-menu:not\(\.minicard-with-handle\) \.minicard-title \{\n\s+margin-inline-end: 0;/);
});

// #6943 comment 7190880990: the space at the top of every card was the
// keyboard move buttons' line, and the space between cards two margins.
test('the move buttons take no line of the card, and one margin is the gap between cards', () => {
  const layouts = read('client/components/main/layouts.css');
  const css = read('client/components/cards/minicard.css');
  const header = read('client/components/boards/boardHeader.css');
  const rule = (text, selector) => {
    const at = text.indexOf(selector + ' {');
    assert.ok(at >= 0, selector);
    return text.slice(at, text.indexOf('}', at));
  };
  const group = rule(layouts, '.minicard .minicard-move-buttons.sr-only');
  assert.match(group, /position: absolute !important;/);
  assert.match(group, /width: 0;/);
  assert.match(group, /height: 0;/);
  assert.match(rule(layouts, '.minicard .minicard-move-buttons.sr-only a'), /width: 1px;\s+height: 1px;/);
  // Negative: still reachable - shown while focused, never display: none.
  assert.doesNotMatch(group, /display:\s*none/);
  assert.match(layouts, /\.minicard-move-buttons\.sr-only a:focus,/);
  // Each mode gives the minicard its own bottom margin...
  assert.match(rule(header, '.desktop-mode .minicard'), /margin-bottom: 9px !important;/);
  assert.match(rule(header, '.mobile-mode .minicard'), /margin-bottom: 0\.5rem !important;|font-size/);
  // ...so the wrapper adds none there, whatever the board color says.
  assert.match(css, /body\.desktop-mode \.minicard-wrapper,\nbody\.mobile-mode \.minicard-wrapper \{\n\s+margin-bottom: 0;/);
  // The desktop drag handle (top 28px, 20px) stays inside a card that no
  // longer has the move buttons' line to make it tall enough.
  assert.match(css, /body\.desktop-mode \.minicard\.minicard-with-handle:not\(\.minicard-no-menu\) \{\n\s+min-height: 49px !important;/);
  assert.match(css, /body\.desktop-mode \.minicard\.minicard-with-handle\.minicard-no-menu \.handle \{\n\s+top: 4px;/);
  // A strip with no badge element takes no line.
  assert.match(css, /\.minicard \.badges:not\(:has\(\*\)\) \{\n\s+display: none;/);
});

test('the 24px targets do not make the card taller', () => {
  const css = read('client/components/cards/minicard.css');
  const rule = css.slice(css.indexOf('.minicard .minicard-collapse,\n.minicard .minicard-details-menu-with-handle {'));
  const body = rule.slice(0, rule.indexOf('}'));
  assert.match(body, /min-width: 24px;/);
  assert.match(body, /min-height: 24px;/);
  // 24px tall on a ~16px line: the extra 8px is taken back, 4px above and below.
  assert.match(body, /margin-block: -4px;/);
});

test('the board stores the menu flag, and a member may change it', () => {
  assert.match(read('models/boards.js'), /allowsMinicardMenu: \{ type: Boolean, optional: true \}/);
  assert.match(read('models/lib/wekanBoardFields.js'), /'allowsMinicardMenu'/);
  assert.match(read('server/models/boards.js'), /^ {2}'allowsMinicardMenu',$/m);
});
