'use strict';

// #6688: every section of the opened card and every element of the minicard
// has a Board Settings / Card toggle - and the popup lists them in the order
// the card and the minicard show them, with arrows to change that order.
//
// Flowtime, Pomodoro, Stickers, Location (the four the issue names), plus
// Dependencies, Vote, Planning Poker, Text Notes and the activity history on
// the card, and the dependencies / stickers / comment-count / vote / poker
// badges on the minicard, rendered UNCONDITIONALLY: a board that did not use
// them had no way to hide them. Each now has an `allows*` board field
// (default true, so nothing an existing board shows disappears), a setter, a
// row, a click handler, and a gate in the card or minicard template.
//
// The popup is the opened card's Card Settings (cardSettingsInline): "Show"
// picks Show on Minicard or Show on Card, and each section lists that side's
// rows `[checkbox] icon label`, in that side's own board order. The rows are not hand-written: the
// template draws them from models/lib/cardSettingsRows.js in the order
// models/lib/cardFieldOrder.js resolves - the SAME source cardDetails.jade
// and minicard.jade render from. So the order check here is no longer "the
// popup's rows follow the template" (there are no rows in the popup to read)
// but "the layout's DEFAULT order is the order the templates render in when
// nothing is stored" - derived from cardDetails.jade and minicard.jade, so a
// section added to a template without a place in the layout fails here.
//
// Static wiring test (no Meteor runtime). Run: node tests/cardSettingsCoverage.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardSettingsCoverage:');

const sidebarJade = read('client/components/sidebar/sidebar.jade');
const sidebarJs = read('client/components/sidebar/sidebar.js');
const sidebarCss = read('client/components/sidebar/sidebar.css');
const cardJade = read('client/components/cards/cardDetails.jade');
const minicardJade = read('client/components/cards/minicard.jade');
const minicardJs = read('client/components/cards/minicard.js');
const boardsModel = read('models/boards.js');
const serverBoards = read('server/models/boards.js');
const permissions = read('server/permissions/boards.js');
const upgradeSteps = read('server/lib/schemaUpgradeSteps.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const {
  CARD_LAYOUT, MINICARD_LAYOUT, DEFAULT_CARD_ORDER, DEFAULT_MINICARD_ORDER, DEFAULT_CARD_FIELD_ORDER,
} = require('../models/lib/cardFieldOrder');
const { CARD_SETTINGS_ROWS, rowsForSide } = require('../models/lib/cardSettingsRows');

// The popup template, from its line to the next template.
const popupStart = sidebarJade.indexOf('template(name="boardCardSettingsPopup")');
assert.ok(popupStart !== -1, 'boardCardSettingsPopup found');
const popupEnd = sidebarJade.indexOf('\ntemplate(name=', popupStart + 1);
const popup = sidebarJade.slice(popupStart, popupEnd);
// Board Settings / Card is Card Settings (a deliberate change): the popup is
// `+cardSettingsInline` - since 2026-10-28 the only Card Settings,
// and its rows are drawn by cardSettingsInline / cardSettingsInlineSection.
// What this suite asked of the popup's own template it asks of those.
const inlineTpl = template(sidebarJade, 'cardSettingsInline');
const inlineSection = template(sidebarJade, 'cardSettingsInlineSection');
const settingsUi = [popup, inlineTpl, inlineSection].join('\n');

const cardRows = CARD_SETTINGS_ROWS.filter(r => r.card);
const minicardRows = CARD_SETTINGS_ROWS.filter(r => r.minicard);
const cardFields = cardRows.map(r => r.card.field);
const minicardFields = minicardRows.map(r => r.minicard.field);
const allFields = [...cardFields, ...minicardFields];

function template(src, name) {
  const at = src.indexOf(`template(name="${name}")`);
  assert.ok(at !== -1, `template ${name} exists`);
  const next = src.indexOf('\ntemplate(name=', at + 1);
  return src.slice(at, next === -1 ? undefined : next);
}
const gatesOf = src => [...src.matchAll(/currentBoard\.(allows[A-Za-z]+)/g)].map(m => m[1]);
const dedupe = list => list.filter((v, i) => list.indexOf(v) === i);

// ── the fields that were missing ─────────────────────────────────────────────

// 2026-10-28: Dependencies and Text notes are fields of Card and Attachments
// (Card Settings' sections), not groups of their own: their gate is their
// item there.
const NEW_CARD_FIELDS = {
  allowsStickers: { row: 'js-field-has-stickers', gate: 'card-details-item-stickers' },
  allowsLocation: { row: 'js-field-has-location', gate: 'card-details-item-location' },
  allowsDependencies: { row: 'js-field-has-dependencies', gate: 'card-details-item-dependencies' },
  allowsFlowtime: { row: 'js-field-has-flowtime', gate: 'card-details-item-flow' },
  allowsPomodoro: { row: 'js-field-has-pomodoro', gate: 'card-details-item-pomodoro' },
  allowsVote: { row: 'js-field-has-vote', gate: 'if getVoteQuestion' },
  allowsPoker: { row: 'js-field-has-poker', gate: 'if getPokerQuestion' },
  allowsTextNotes: { row: 'js-field-has-text-notes', gate: 'card-details-item-text-notes' },
  allowsActivities: { row: 'js-field-has-activities', gate: 'section="activities"' },
};
const NEW_MINICARD_FIELDS = {
  allowsStickersOnMinicard: { row: 'js-field-has-stickers-on-minicard', helper: 'showStickersOnMinicard', gate: 'minicard-stickers' },
  allowsDependenciesOnMinicard: { row: 'js-field-has-dependencies-on-minicard', helper: 'showDependenciesOnMinicard', gate: 'minicard-dependencies' },
  allowsCommentCountOnMinicard: { row: 'js-field-has-comment-count-on-minicard', helper: 'showCommentCountOnMinicard', gate: 'badge-comment' },
  allowsVoteOnMinicard: { row: 'js-field-has-vote-on-minicard', helper: 'showVoteOnMinicard', gate: 'title=getVoteQuestion' },
  allowsPokerOnMinicard: { row: 'js-field-has-poker-on-minicard', helper: 'showPokerOnMinicard', gate: 'title=getPokerQuestion' },
};
// allowsActivities predates this - it is in the schema with default true and
// had a click handler; it just gated nothing and its row was commented out.
const BRAND_NEW = [...Object.keys(NEW_CARD_FIELDS), ...Object.keys(NEW_MINICARD_FIELDS)]
  .filter(f => f !== 'allowsActivities');

test('every new field is in the Boards schema with defaultValue true (nothing an existing board shows disappears)', () => {
  for (const field of [...Object.keys(NEW_CARD_FIELDS), ...Object.keys(NEW_MINICARD_FIELDS)]) {
    const m = boardsModel.match(new RegExp(`${field}: \\{[^}]*?defaultValue: (true|false)`));
    assert.ok(m, `${field} declared in models/boards.js`);
    assert.strictEqual(m[1], 'true', `${field} defaults to true`);
  }
});

test('every new field has a setter, is an API card-setting key and a healed true-default', () => {
  for (const field of BRAND_NEW) {
    const setter = `setAllows${field.slice('allows'.length)}`;
    assert.ok(boardsModel.includes(`async ${setter}(${field})`), `${setter} exists`);
    assert.ok(serverBoards.includes(`'${field}'`), `${field} in BOARD_CARD_SETTING_KEYS`);
    assert.ok(upgradeSteps.includes(`'${field}'`), `${field} in BOARD_ALLOWS_TRUE_DEFAULTS`);
  }
});

test('the opened card gates each new section on its board field', () => {
  for (const [field, { gate }] of Object.entries(NEW_CARD_FIELDS)) {
    const gateAt = cardJade.indexOf(gate);
    assert.ok(gateAt !== -1, `${gate} is in cardDetails.jade`);
    const before = cardJade.slice(Math.max(0, gateAt - 900), gateAt);
    assert.ok(before.includes(`if currentBoard.${field}`), `${gate} sits under if currentBoard.${field}`);
  }
});

test('the minicard gates each new badge on its board field through a helper that defaults to true', () => {
  for (const [field, { helper, gate }] of Object.entries(NEW_MINICARD_FIELDS)) {
    const gateAt = minicardJade.indexOf(gate);
    assert.ok(gateAt !== -1, `${gate} is in minicard.jade`);
    const before = minicardJade.slice(Math.max(0, gateAt - 300), gateAt);
    assert.ok(before.includes(`if ${helper}`), `${gate} sits under if ${helper}`);
    assert.ok(new RegExp(`${helper}\\(\\) \\{[^}]*getMinicardFlag\\(board, '${field}', null, true\\)`).test(minicardJs),
      `${helper} reads ${field} with a true default and no card-side fallback`);
  }
});

test('Board Settings / Card has a row and a click handler for each new field', () => {
  for (const [field, { row }] of Object.entries({ ...NEW_CARD_FIELDS, ...NEW_MINICARD_FIELDS })) {
    const entry = CARD_SETTINGS_ROWS.find(r => (r.card && r.card.toggle === row) || (r.minicard && r.minicard.toggle === row));
    assert.ok(entry, `${row} row in the table`);
    const spec = entry.card && entry.card.toggle === row ? entry.card : entry.minicard;
    assert.strictEqual(spec.field, field, `the ${row} checkbox reads ${field}`);
    assert.ok(sidebarJs.includes(`'click .${row}'`), `click handler for .${row}`);
    assert.ok(new RegExp(`\\$set: \\{ ${field}: `).test(sidebarJs), `the handler writes ${field}`);
    assert.ok(new RegExp(`^  ${field}\\(\\) \\{`, 'm').test(sidebarJs), `helper ${field}() for the checkbox`);
  }
});

test('the four the issue names - Flowtime, Pomodoro, Stickers, Location - are all covered (negative: none is unconditional)', () => {
  for (const marker of ['card-details-item-flow', 'card-details-item-pomodoro',
    'card-details-item-stickers', 'card-details-item-location']) {
    const at = cardJade.indexOf(marker);
    const lines = cardJade.slice(0, at).split('\n');
    const line = lines[lines.length - 1];
    const indent = line.length - line.trimStart().length;
    // The nearest shallower line above must be a board gate, not a fold state
    // or the order loop's `if $eq field`.
    let parent = null;
    for (let i = lines.length - 2; i >= 0; i--) {
      const l = lines[i];
      if (!l.trim() || l.trim().startsWith('//')) continue;
      if (l.length - l.trimStart().length < indent) { parent = l.trim(); break; }
    }
    assert.match(parent, /^if currentBoard\.allows/, `${marker}'s parent is a board gate, not "${parent}"`);
  }
});

// ── coverage: everything the card and minicard show has a row ────────────────

test('every board gate of the opened card has a "Show on Card" row', () => {
  for (const g of dedupe(gatesOf(cardJade))) {
    assert.ok(cardFields.includes(g), `card gate ${g} has a row`);
  }
});

test('every board gate of the minicard has a "Show on Minicard" row', () => {
  const helperFields = [...minicardJs.matchAll(/getMinicardFlag\(board, '(allows[A-Za-z]+)'/g)].map(m => m[1]);
  const direct = [...minicardJs.matchAll(/board\??\.(allows[A-Za-z]+OnMinicard)/g)].map(m => m[1]);
  for (const g of dedupe([...helperFields, ...direct, ...gatesOf(minicardJade)])) {
    if (g === 'allowsCardSortingByNumber') continue; // the card-side half of the sort badge's pair
    assert.ok(minicardFields.includes(g), `minicard gate ${g} has a row`);
  }
});

test('every NEW row is read by the card or the minicard (negative: no dead toggle)', () => {
  const readAnywhere = [cardJade, minicardJade, minicardJs].join('\n');
  for (const f of [...Object.keys(NEW_CARD_FIELDS), ...Object.keys(NEW_MINICARD_FIELDS)]) {
    assert.ok(readAnywhere.includes(f), `${f} is read by a template`);
  }
});

test('every row has a checkbox helper, a click handler, existing label keys and icons', () => {
  for (const row of CARD_SETTINGS_ROWS) {
    assert.ok(Array.isArray(row.icons) && row.icons.length > 0, `${row.key} has an icon`);
    for (const k of row.label) assert.ok(en[k], `${row.key}: i18n key ${k} exists`);
    for (const side of ['card', 'minicard']) {
      const spec = row[side];
      if (!spec) continue;
      // Deliberate change (2026-10-28): a card's OWN row (`needsCard`, List
      // title) is never drawn in Card Settings any more - Card Settings is
      // Board Settings / Card, with no card - so it has no helper or handler
      // there; the card sets it in its own menu (cardDetails.js).
      if (spec.needsCard) {
        assert.match(sidebarJs, /\.filter\(row => !row\[side\]\.needsCard\)/, 'never drawn in Card Settings');
        assert.ok(!sidebarJs.includes(`'click .${spec.toggle}'`), `negative: no dead handler for .${spec.toggle}`);
        continue;
      }
      // A Scrum row's checkbox is its Scrum visibility flag, read by the row
      // builder itself; the others have a helper of their own.
      if (spec.scrum) assert.match(sidebarJs, /checked: spec\.scrum \? currentBoard\?\.scrum\?\.visibility\?\.\[spec\.scrum\] === true/);
      // A plain flag row reads the board field, or its declared default.
      else if (spec.flag) {
        assert.equal(typeof spec.default, 'boolean', `${row.key}/${side} declares its default`);
        assert.match(sidebarJs, /: spec\.flag \? \(typeof currentBoard\?\.\[spec\.field\] === 'boolean' \? currentBoard\[spec\.field\] : spec\.default\) === true/);
        assert.match(boardsModel, new RegExp(`\\b${spec.field}: \\{`), `${spec.field} in the schema`);
        // A side that is new is off until chosen: no schema default turns it on.
        if (spec.default === false) assert.ok(!boardsModel.includes(`${spec.field}: { type: Boolean, defaultValue: true }`), `${spec.field} is off until chosen`);
      }
      else assert.ok(new RegExp(`^  ${spec.field}\\(\\) \\{`, 'm').test(sidebarJs), `helper ${spec.field}() (${row.key}/${side})`);
      assert.ok(sidebarJs.includes(`'click .${spec.toggle}'`), `click handler for .${spec.toggle}`);
    }
  }
});

// ── the popup: the opened card's Card Settings ───────────────────────────────
// docs/Features/Cards/Card-Settings.md. Deliberate change: Board
// Settings / Card used to be the Admin Panel's left menu and a right pane of
// two lists (Show on Card, Show on Minicard) with column heads. It is now the
// opened card's own template, cardSettingsInline: "Show" radios pick the side
// (Show on Minicard / Show on Card), and every section is a checklist of that
// side's rows, each list in that side's own order and reordered by drag and
// drop - so both sides' orders are still independent, one shown at a time.
//
// Deliberate change (2026-10-28): BOTH sides are shown at once, as two panes -
// the Minicard pane first, the Card pane after it - two instances of the one
// template cardSettingsInline, each with its own fixed side. The Show radios
// are gone: there is nothing to switch.

test('Board Settings / Card is two cardSettingsInline panes, one per side, each section a checklist of its rows', () => {
  // Since 2026-10-28 it is the ONLY Card Settings: the opened card has none.
  assert.deepStrictEqual([...popup.matchAll(/\+cardSettingsInline\(side="(\w+)"\)/g)].map(m => m[1]), ['minicard', 'card']);
  assert.ok(!cardJade.includes('cardSettingsInline'), 'negative: not on the opened card');
  // Negative: the old menu-and-pane layout is gone.
  // (`card-settings-pane-head` is a name again since 2026-10-28: each side's
  // pane has a header line with its caret and title - not the Admin Panel
  // style column heads it named before.)
  for (const gone of ['+leftMenu(settingsMenuItems)', '+paneTitle(settingsPaneTitle)', 'card-settings-list-card',
    'card-settings-list-minicard', 'sectionCardRows', 'sectionMinicardRows', 'card-settings-pane-head-cell']) {
    assert.ok(!sidebarJade.includes(gone), `negative: ${gone} is gone`);
  }
  // Both sides are reachable at once: no Show radios (negative).
  assert.ok(!sidebarJade.includes('js-card-settings-show-side'), 'negative: no Show radio left');
  assert.ok(!sidebarJs.includes('js-card-settings-show-side'), 'negative: nor its handler');
  // Each pane's side is the one boardCardSettingsPopup gave it.
  assert.match(sidebarJs, /const side = Template\.currentData\(\) && Template\.currentData\(\)\.side;\n\s+this\.showSide = new ReactiveVar\(side === 'minicard' \? 'minicard' : 'card'\);/);
  assert.match(inlineTpl, /each section in inlineSections\n\s+\+cardSettingsInlineSection\(section=section side=showSide\)/);
  // One sortable list per section, of the side shown.
  assert.match(inlineSection, /\.card-settings-inline-items\.js-card-field-order-sortable\(data-side="\{\{side\}\}"\)\n\s+each row in section\.rows/);
  // The line is what the handlers read: data-key and data-side on the row class.
  // data-side is the ROW's own, not the section's argument: switching Show
  // then moves each row (keyed by _id) with its side, instead of relabelling
  // the rows where they stand a flush before they reorder.
  assert.strictEqual((inlineSection.match(/\.card-settings-line\.card-settings-inline-item\.js-card-field-order-row\(class="\{\{#if row\.personal\}\}card-settings-row-personal\{\{\/if\}\} \{\{#if row\.positioned\}\}is-positioned\{\{\/if\}\}" data-key="\{\{row\.key\}\}" data-side="\{\{row\.side\}\}"\)/g) || []).length, 1);
  assert.match(sidebarJs, /return \{ \.\.\.row, _id: row\.key, menu, hasMenu:/, 'each row is keyed, so Blaze moves it rather than reusing it by index');
  // A row: the side's checkbox, then the field; On this card and Show empty
  // are in its hamburger (the pane's columns of the same name are gone).
  assert.match(inlineSection, /\+cardSettingsSideToggle\(row=row\)\n\s+\+cardSettingsRowLabel\(row=row\)\n\s+if row\.hasMenu/);
  const toggle = sidebarJade.slice(sidebarJade.indexOf('template(name="cardSettingsSideToggle")')).split('\ntemplate(')[0];
  assert.match(toggle, /a\.flex\.card-field-order-toggle\(class="\{\{#if row\.writable\}\}\{\{row\.toggle\}\}\{\{else\}\}is-disabled\{\{\/if\}\} \{\{#if row\.checked\}\}is-checked\{\{\/if\}\} \{\{#if row\.animating\}\}is-animating\{\{\/if\}\}"/);
  // The same animated checkbox as "On this card".
  assert.match(toggle, /a\.flex\.card-field-order-toggle\([^\n]*\n\s+\.materialCheckBox\(class="\{\{#if row\.checked\}\}is-checked\{\{\/if\}\}"\)/);
  // Each list from the one builder the two lists always used, in its side's order.
  assert.match(sidebarJs, /return buildCardSettingsRows\(side, data\)\n\s+\.filter\(built => keys\.has\(built\.key\)\)/);
  assert.match(sidebarJs, /side === 'card' \? CARD_LAYOUT : MINICARD_LAYOUT/);
  assert.match(sidebarJs, /side === 'card' \? currentBoard\?\.cardFieldOrder : currentBoard\?\.minicardFieldOrder/);
  assert.match(sidebarJs, /rowsForSide\(side, order\)/);
  // (The checkbox just clicked is read once per redraw, for the rows and for the
  // section checkboxes alike.)
  assert.match(sidebarJs, /const animating = tpl\.animating\.get\(\);[\s\S]{0,600}const rows = sectionRowsOf\(section\.id, data, side, animating\)/);
  // Negative: the one-side views of the old popup (show-card-only /
  // show-minicard-only, hiding the other list) are gone with it - Show is the
  // one way to pick a side.
  assert.ok(!/show-card-only|show-minicard-only/.test(sidebarCss + sidebarJs), 'negative: no CSS-hidden second list');
  // Every row of the table is in exactly one section.
  const { SECTIONS } = require('../models/lib/cardSettingsSections');
  const keys = SECTIONS.flatMap(sec => sec.keys);
  assert.deepStrictEqual([...keys].sort(), CARD_SETTINGS_ROWS.map(r => r.key).sort());
  assert.strictEqual(new Set(keys).size, keys.length);
});

test('rows reorder by drag and drop and the keyboard, in the list as shown; a row with no place is not dragged', () => {
  const label = sidebarJade.slice(sidebarJade.indexOf('template(name="cardSettingsRowLabel")')).split('\ntemplate(')[0];
  // Deliberate change (user request): with drag handles on only the handle
  // drags, so the label is a handle only while they are off
  // (tests/cardSettingsOnCard.test.cjs pins the negative).
  assert.match(label, /span\.card-settings-line-label\(class="\{\{#if row\.draggable\}\}\{\{#unless row\.showDragHandles\}\}js-card-field-order-handle card-field-order-drag-label\{\{\/unless\}\}\{\{\/if\}\}"/);
  assert.match(label, /if row\.draggable\n\s+if row\.showDragHandles\n\s+a\.flex\.card-field-order-move\.card-field-order-handle\.js-card-field-order-handle\(href="#" draggable="false" role="button" tabindex="0" title="\{\{_ 'drag-to-reorder'\}\}"/);
  assert.ok(en['drag-to-reorder']);
  // Dragged by a board admin, a row that has a place of its own.
  assert.match(sidebarJs, /draggable: writable && built\.positioned,/);
  assert.match(sidebarJs, /const positioned = !spec\.after && isMovableKey\(layout, row\.key\);/);
  // ownListOnly: a row dropped on another section goes back (deliberate,
  // user request) - the rows are one list per section now.
  assert.match(sidebarJs, /reorderOnDrop\(this\.\$\(list\), \{\n\s+ownListOnly: true,\n\s+items: '> \.js-card-field-order-row\.is-positioned', handle: '\.js-card-field-order-handle',/);
  assert.match(sidebarJs, /drop: \(key, keys\) => placeInListOrder\(list\.dataset\.side, key, keys\),/);
  // The keyboard: one row up or down IN THE LIST, placed the same way as a drop.
  assert.match(sidebarJs, /'keydown \.js-card-field-order-handle'\(evt\) \{\s*const direction = ARROW_KEYS\[evt\.key\];\s*if \(direction\) moveCardSettingsRow\(evt, direction\);/);
  assert.match(sidebarJs, /const ARROW_KEYS = \{ ArrowUp: 'up', ArrowDown: 'down' \};/);
  const move = sidebarJs.slice(sidebarJs.indexOf('function moveCardSettingsRow'), sidebarJs.indexOf('// The handlers of Card Settings:'));
  assert.ok(move.length > 0 && move.length < 2000, 'moveCardSettingsRow found');
  assert.match(move, /placeInListOrder\(list\.dataset\.side, rowEl\.dataset\.key, keys\);/);
  // Negative: the arrows and their numbers are gone, and nothing moves by
  // the side's whole order behind the list's back.
  assert.ok(!/js-card-field-order-up|js-card-field-order-down|card-settings-position|sidePosition/.test(settingsUi + sidebarJs + sidebarCss));
  assert.ok(!/moveKey\(/.test(sidebarJs), 'negative: no one-step move in the whole order');
});

test('every locale has the column heading keys', () => {
  const dir = path.join(repoRoot, 'imports/i18n/data');
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'))) {
    const json = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    // ('card-settings-this-card', On this card, was removed 2026-10-28.)
    for (const k of ['show-on-card', 'show-on-minicard']) {
      assert.ok(typeof json[k] === 'string' && json[k].length > 0, `${file} has ${k}`);
    }
  }
});

test('no hand-written row is left in the popup (negative: the table is the single source)', () => {
  // The popup is cardSettingsInline now: its templates are read too.
  assert.ok(!settingsUi.includes('js-field-has-'), 'no js-field-has-* in the template');
  assert.ok(!settingsUi.includes('//div.check-div'), 'no dead commented-out rows');
  assert.ok(!sidebarJade.includes('cardFieldOrderRows'), 'the old separate arrow list is gone');
});

// ── a drop moves ONE side, through the board's admin-only setters ──────────

// The drop's placement, from sidebar.js itself, run against the real layout.
const fieldOrder = require('../models/lib/cardFieldOrder');
const dropTargetIndex = (() => {
  const src = sidebarJs.slice(sidebarJs.indexOf('function dropTargetIndex('), sidebarJs.indexOf('// `keys`: the list\'s rows in their new order'));
  return new Function('applyLayoutOrder', 'isMovableKey', `${src}\nreturn dropTargetIndex;`)(fieldOrder.applyLayoutOrder, fieldOrder.isMovableKey);
})();
// What a list shows after a drop: the side's new order, filtered to the list.
const dropInto = (stored, layout, key, wanted) => {
  const order = fieldOrder.placeKey(stored, key, dropTargetIndex(stored, layout, key, wanted), layout);
  return order.filter(k => wanted.includes(k));
};

test('a dropped row lands where it was dropped in its list, on its own side only', () => {
  const { CARD_LAYOUT, MINICARD_LAYOUT } = fieldOrder;
  // Date: End dropped first.
  assert.deepStrictEqual(dropInto(undefined, CARD_LAYOUT, 'endDate', ['endDate', 'receivedDate', 'startDate', 'dueDate']),
    ['endDate', 'receivedDate', 'startDate', 'dueDate']);
  // Time: since 2026-10-28 a card section of its own (it shared the old Sort
  // group with two of Card's rows) - Pomodoro dropped first goes first, and
  // Card's rows keep their place.
  const time = dropInto(undefined, CARD_LAYOUT, 'pomodoro', ['pomodoro', 'spentTime', 'flowtime']);
  assert.deepStrictEqual(time, ['pomodoro', 'spentTime', 'flowtime']);
  assert.deepStrictEqual(fieldOrder.orderedCardFieldsOf(fieldOrder.placeKey(undefined, 'pomodoro',
    dropTargetIndex(undefined, CARD_LAYOUT, 'pomodoro', ['pomodoro', 'spentTime', 'flowtime']), CARD_LAYOUT), 'card').slice(0, 3),
  ['dependencies', 'cardSortingByNumber', 'showLists'], 'the rows of other sections keep their place');
  // Negative: a row dropped in Date never leaves Date.
  const date = fieldOrder.placeKey(undefined, 'dueDate', dropTargetIndex(undefined, CARD_LAYOUT, 'dueDate', ['dueDate', 'receivedDate', 'startDate', 'endDate']), CARD_LAYOUT);
  assert.deepStrictEqual(fieldOrder.orderedCardFieldsOf(date, 'date'), ['dueDate', 'receivedDate', 'startDate', 'endDate']);
  assert.deepStrictEqual(fieldOrder.orderedCardFieldsOf(date, 'members'), fieldOrder.orderedCardFieldsOf(undefined, 'members'));
  // A dropped last row goes last.
  assert.deepStrictEqual(dropInto(undefined, CARD_LAYOUT, 'receivedDate', ['startDate', 'dueDate', 'endDate', 'receivedDate']),
    ['startDate', 'dueDate', 'endDate', 'receivedDate']);
  // The minicard's own order, the card's untouched.
  const mini = dropInto(undefined, MINICARD_LAYOUT, 'endDate', ['endDate', 'receivedDate', 'startDate', 'dueDate']);
  assert.deepStrictEqual(mini, ['endDate', 'receivedDate', 'startDate', 'dueDate']);
  // Negative: a pinned header stays first - Description's text dropped above
  // its Title (the section's heading) does not pass it. (Labels is not pinned
  // since 2026-10-28: the card's section heading is its own, so Stickers may
  // lead.)
  const desc = fieldOrder.placeKey(undefined, 'descriptionText', dropTargetIndex(undefined, CARD_LAYOUT, 'descriptionText', ['descriptionText', 'descriptionTitle']), CARD_LAYOUT);
  assert.strictEqual(fieldOrder.orderedCardFieldsOf(desc, 'description')[0], 'descriptionTitle');
  const labels = fieldOrder.placeKey(undefined, 'stickers', dropTargetIndex(undefined, CARD_LAYOUT, 'stickers', ['stickers', 'labels', 'location']), CARD_LAYOUT);
  assert.strictEqual(fieldOrder.orderedCardFieldsOf(labels, 'labels')[0], 'stickers');
  // Negative: a list of one row has nowhere to go.
  assert.strictEqual(dropTargetIndex(undefined, CARD_LAYOUT, 'vote', ['vote']), -1);
  // Through the board's setters, the side the list says; nothing written when nothing moved.
  const place = sidebarJs.slice(sidebarJs.indexOf('function placeInListOrder('), sidebarJs.indexOf('function moveCardSettingsRow'));
  assert.ok(place.length > 0 && place.length < 2000, 'placeInListOrder found');
  assert.match(place, /if \(!board \|\| !\(Utils\.canModifyBoard && Utils\.canModifyBoard\(\)\)\) return;/);
  assert.match(place, /if \(order\.join\(' '\) === applyLayoutOrder\(stored, layout\)\.join\(' '\)\) return;/);
  assert.match(place, /if \(side === 'minicard'\) board\.setMinicardFieldOrder\(order\);\n\s+else board\.setCardFieldOrder\(order\);/);
  assert.ok(!/\$set: \{ (cardFieldOrder|minicardFieldOrder): /.test(sidebarJs), 'the popup never writes the order itself (negative)');
});

test('the setters normalise what they store, the schema holds both orders, and only a board admin may write them', () => {
  assert.match(boardsModel, /async setCardFieldOrder\(order\) \{[\s\S]*?\$set: \{ cardFieldOrder: applyCardOrder\(order\) \}/);
  assert.match(boardsModel, /async setMinicardFieldOrder\(order\) \{[\s\S]*?\$set: \{ minicardFieldOrder: applyMinicardOrder\(order\) \}/);
  assert.match(boardsModel, /minicardFieldOrder: \{[\s\S]*?type: Array,\s*optional: true/);
  assert.match(boardsModel, /'minicardFieldOrder\.\$': \{\s*type: String/);
  assert.match(boardsModel, /cardFieldOrder: \{[\s\S]*?type: Array,\s*optional: true/);
  // Boards.update is allowed to a board admin (or site admin) and nobody else.
  assert.match(permissions, /Boards\.allow\(\{[\s\S]*?update: allowIsBoardAdminOrSiteAdmin/);
  // Only an admin drags a row, and only an admin's board checkboxes are
  // live: anybody else gets them disabled (their own rows excepted).
  assert.match(sidebarJs, /draggable: writable && built\.positioned,/);
  assert.match(sidebarJs, /writable: writable \|\| Boolean\(built\.personal\),/);
});

// ── order: the layouts' defaults ARE the templates' order ───────────────────

// 2026-10-28: the opened card and the minicard draw Card Settings' sections,
// so what the templates are checked against is one loop over the section ids
// and, inside each section template, its fields in the order of its rows in
// Card Settings (cardSettingsSections.sectionFieldsOn) - no longer the
// templates read top to bottom as the default flat order.
const cardSettingsSections = require('../models/lib/cardSettingsSections');
const SECTION_TEMPLATE = id => (id === 'comments' ? 'cardCommentsSection'
  : `cardFieldSection${id.charAt(0).toUpperCase()}${id.slice(1)}`);

test('the opened card draws every Card Settings section through its template, in one loop', () => {
  const main = template(cardJade, 'cardDetails');
  const leftAt = main.indexOf('.card-details-left');
  const header = gatesOf(main.slice(0, leftAt));
  const gateToKey = Object.fromEntries(cardRows.filter(r => !r.card.after).map(r => [r.card.field, r.key]));
  assert.deepStrictEqual(CARD_LAYOUT.head, header.map(g => gateToKey[g]).filter(Boolean),
    'the title bar draws the head, outside the loop');
  const loop = main.slice(main.indexOf('each section in orderedCardFieldSections'), main.indexOf('.card-details-right'));
  const drawn = [...loop.matchAll(/if \$eq section "([A-Za-z]+)"\n\s+\+([A-Za-z]+)/g)].map(m => [m[1], m[2]]);
  assert.deepStrictEqual(drawn.map(d => d[0]), cardSettingsSections.SECTION_IDS, 'every section, in the table order');
  for (const [id, name] of drawn) {
    assert.strictEqual(name, SECTION_TEMPLATE(id), `${id} through +${name}`);
    assert.ok(cardJade.includes(`template(name="${name}")`), `${name} is its own template`);
  }
  assert.deepStrictEqual(DEFAULT_CARD_FIELD_ORDER, CARD_LAYOUT.sections.map(sec => sec.key));
  // The activities are the right column's, fixed.
  assert.ok(CARD_LAYOUT.tail.includes('activities') && main.slice(main.indexOf('.card-details-right')).includes('allowsActivities'));
});

test('inside a card section the fields render through its ordered*Fields loop, in Card Settings\' row order', () => {
  const loops = { labels: 'orderedLabelsFields', date: 'orderedDateFields', members: 'orderedMembersFields',
    card: 'orderedCardFields', time: 'orderedTimeFields', scrum: 'orderedScrumFields',
    checklists: 'orderedChecklistsFields', attachments: 'orderedAttachmentsFields' };
  const gateToKey = Object.fromEntries(cardRows.filter(r => !r.card.after).map(r => [r.card.field, r.key]));
  const js = read('client/components/cards/cardDetails.js');
  for (const [section, helper] of Object.entries(loops)) {
    const name = SECTION_TEMPLATE(section);
    const tpl = template(cardJade, name);
    assert.ok(tpl.includes(`each field in ${helper}`), `${name} loops ${helper}`);
    const placed = [...tpl.matchAll(/if \$eq field "([A-Za-z]+)"/g)].map(m => m[1]);
    const rows = cardSettingsSections.sectionFieldsOn('card', DEFAULT_CARD_ORDER, section);
    // Which branch comes first in the template does not decide anything - the
    // loop draws them in Card Settings' order - but each is a row of THIS
    // section, once (negative: no field drawn outside its section).
    assert.deepStrictEqual([...placed].sort(), rows.filter(f => placed.includes(f)).sort(), `${name} places only its own rows`);
    assert.strictEqual(new Set(placed).size, placed.length, `${name} places each field once`);
    // Every positioned field of the section has its place in the template.
    for (const f of CARD_LAYOUT.sections.find(s => s.key === section).fields) {
      assert.ok(placed.includes(f), `${name} draws ${f}`);
    }
    // The gates keep their fields: each `if $eq field` is followed by its gate.
    for (const m of tpl.matchAll(/if \$eq field "([A-Za-z]+)"\n\s+if currentBoard\.(allows[A-Za-z]+)/g)) {
      assert.strictEqual(gateToKey[m[2]], m[1], `${m[2]} gates field ${m[1]}`);
    }
    assert.ok(js.includes(`'${helper}'`), `${helper} is registered globally (each section is its own template)`);
  }
});

test('the minicard draws Card Settings\' sections, grouped, every field once in its kind\'s container', () => {
  const { DATE_FIELDS, BADGE_FIELDS, BLOCK_FIELDS } = require('../models/lib/minicardGroups');
  const body = minicardJade.slice(minicardJade.indexOf('each group in minicardGroups'));
  const part = (from, to) => body.slice(body.indexOf(from), to ? body.indexOf(to) : undefined);
  const fieldsIn = text => [...text.matchAll(/if \$eq field "([A-Za-z]+)"/g)].map(m => m[1]);
  assert.deepStrictEqual(fieldsIn(part('if group.dates', 'else if group.badges')).sort(), [...DATE_FIELDS].sort());
  assert.deepStrictEqual(fieldsIn(part('else if group.badges', '\n        else\n')).sort(), [...BADGE_FIELDS].sort());
  assert.deepStrictEqual(fieldsIn(part('\n        else\n')).sort(), [...BLOCK_FIELDS].sort());
  // Every positioned minicard field is drawn by one of them.
  for (const f of MINICARD_LAYOUT.sections.flatMap(sec => sec.fields)) {
    assert.ok([...DATE_FIELDS, ...BADGE_FIELDS, ...BLOCK_FIELDS].includes(f), `${f} has a container`);
  }
  // The head - the title row and the cover under it - is fixed.
  assert.deepStrictEqual(MINICARD_LAYOUT.head, ['dueComplete', 'cardNumber', 'cover']);
  assert.ok(minicardJade.indexOf('if showCardNumber') < minicardJade.indexOf('each group in minicardGroups'));
  assert.ok(minicardJade.indexOf('.minicard-cover') < minicardJade.indexOf('each group in minicardGroups'));
  const gateToKey = Object.fromEntries(minicardRows.map(r => [r.minicard.field, r.key]));
  // Every helper/gate under an `if $eq field` belongs to that field's row.
  for (const m of body.matchAll(/if \$eq field "([A-Za-z]+)"\n\s+if (show[A-Za-z]+|currentBoard\.allows[A-Za-z]+)/g)) {
    const gate = m[2].replace('currentBoard.', '');
    const field = minicardFields.find(f => f === gate || f === gate.replace(/^show/, 'allows') || f === `${gate.replace(/^show/, 'allows')}OnMinicard`);
    if (field) assert.strictEqual(gateToKey[field], m[1], `${m[2]} gates ${m[1]}`);
  }
  assert.ok(DEFAULT_MINICARD_ORDER.length === new Set(DEFAULT_MINICARD_ORDER).size);
});

test('minicard-only rows sit beside the row they belong with', () => {
  const rows = rowsForSide('minicard', DEFAULT_MINICARD_ORDER).map(r => r.key);
  const idx = k => rows.indexOf(k);
  assert.strictEqual(idx('labelText'), idx('labels') + 1, 'Labels text right under Labels');
  assert.strictEqual(idx('labelTextPersonal'), idx('labelText') + 1, 'the personal override right under it');
  assert.strictEqual(idx('listTitle'), idx('showLists') + 1, 'List title right under Show lists');
  assert.ok(idx('commentCount') !== -1 && idx('commentCount') < idx('comments'),
    'Comment count is a badge with its own place, above the comment preview');
  const personal = CARD_SETTINGS_ROWS.filter(r => r.minicard && r.minicard.personal).map(r => r.key);
  assert.deepStrictEqual(personal, ['labelTextPersonal', 'listTitle']);
  // Deliberate change: there is no personal-only view any more (it hid
  // every row but the personal ones from a non-admin). Everybody gets the
  // same Card Settings; the board's rows are disabled for who may not change
  // the board, and a personal row stays usable (`writable`) - by the class
  // kept on the row. (Select all / none, which also skipped personal rows by
  // that class, was removed 2026-10-28.)
  assert.ok(inlineSection.includes('{{#if row.personal}}card-settings-row-personal{{/if}}'), 'personal rows keep their class');
  assert.match(sidebarJs, /writable: writable \|\| Boolean\(built\.personal\),/);
  assert.ok(!sidebarCss.includes('show-personal-only'), 'negative: no personal-only view hiding rows');
  assert.ok(!sidebarJs.includes('personalOnly'), 'negative: no personal-only mode');
  assert.match(inlineSection, /\.card-settings-line\.card-settings-inline-item\.js-card-field-order-row\(class="\{\{#if row\.personal\}\}card-settings-row-personal\{\{\/if\}\}/);
});

console.log(`\n${passed} passed`);
