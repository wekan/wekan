'use strict';

// #6688: every section of the opened card and every element of the minicard
// has a Board Settings / Card toggle, and the rows of that popup are listed
// in the ORDER the fields appear on the card.
//
// Flowtime, Pomodoro, Stickers, Location (the four the issue names), plus
// Dependencies, Vote, Planning Poker, Text Notes and the activity history on
// the card, and the dependencies / stickers / comment-count / vote / poker
// badges on the minicard, rendered UNCONDITIONALLY: a board that did not use
// them had no way to hide them. Each now has an `allows*` board field
// (default true, so nothing an existing board shows disappears), a setter, a
// row in `boardCardSettingsPopup`, a click handler, and a gate in the card
// or minicard template.
//
// The order check is derived from the templates rather than a hard-coded
// list: the card's gates are read from cardDetails.jade in the order they
// render (header, the reorderable sections in their default order, the fixed
// tail), and the popup's rows must follow that same sequence. The popup
// renders the reorderable sections from the SAME `orderedCardFieldSections`
// source the card uses, so a board's own order applies to both.
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
const cardJade = read('client/components/cards/cardDetails.jade');
const minicardJade = read('client/components/cards/minicard.jade');
const minicardJs = read('client/components/cards/minicard.js');
const boardsModel = read('models/boards.js');
const serverBoards = read('server/models/boards.js');
const upgradeSteps = read('server/lib/schemaUpgradeSteps.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const { DEFAULT_CARD_FIELD_ORDER } = require('../models/lib/cardFieldOrder');

// The popup, from its template line to the card-field-order block after it.
const popupStart = sidebarJade.indexOf('template(name="boardCardSettingsPopup")');
const popupEnd = sidebarJade.indexOf('if canModifyBoard', popupStart);
assert.ok(popupStart !== -1 && popupEnd !== -1, 'boardCardSettingsPopup found');
const popup = sidebarJade.slice(popupStart, popupEnd);

// Every board field a popup checkbox reads, in row order: the `{{#if X}}`
// on an `a.flex.js-field-has-*` / `js-toggle-*` line.
const popupToggleLines = popup.split('\n').filter(l => /a\.flex\.js-(field-has|toggle)-/.test(l));
const fieldOf = line => (line.match(/\{\{#if ([A-Za-z]+)\}\}is-checked/) || [])[1];
const popupFields = popupToggleLines.map(fieldOf).filter(Boolean);

function template(src, name) {
  const at = src.indexOf(`template(name="${name}")`);
  assert.ok(at !== -1, `template ${name} exists`);
  const next = src.indexOf('\ntemplate(name=', at + 1);
  return src.slice(at, next === -1 ? undefined : next);
}
const gatesOf = src => [...src.matchAll(/currentBoard\.(allows[A-Za-z]+)/g)].map(m => m[1]);
const dedupe = list => list.filter((v, i) => list.indexOf(v) === i);

// ── the fields that were missing ─────────────────────────────────────────────

const NEW_CARD_FIELDS = {
  allowsStickers: { row: 'js-field-has-stickers', gate: 'card-details-item-stickers' },
  allowsLocation: { row: 'js-field-has-location', gate: 'card-details-item-location' },
  allowsDependencies: { row: 'js-field-has-dependencies', gate: 'card-details-group-dependencies' },
  allowsFlowtime: { row: 'js-field-has-flowtime', gate: 'card-details-item-flow' },
  allowsPomodoro: { row: 'js-field-has-pomodoro', gate: 'card-details-item-pomodoro' },
  allowsVote: { row: 'js-field-has-vote', gate: 'if getVoteQuestion' },
  allowsPoker: { row: 'js-field-has-poker', gate: 'if getPokerQuestion' },
  allowsTextNotes: { row: 'js-field-has-text-notes', gate: 'section="text-notes"' },
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
    assert.ok(popup.includes(`a.flex.${row}(`), `${row} row in the popup`);
    assert.ok(popup.includes(`{{#if ${field}}}is-checked`), `the ${row} checkbox reads ${field}`);
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
    // The nearest shallower line above must be a board gate, not a fold state.
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
  const gates = dedupe(gatesOf(cardJade));
  // hasAnyAllowsDate is the date-format picker - shown when any date is.
  for (const g of gates) {
    assert.ok(popupFields.includes(g), `card gate ${g} has a popup row`);
  }
});

test('every board gate of the minicard has a "Show on Minicard" row', () => {
  // Helpers in minicard.js that read a board field, plus the direct gates.
  const helperFields = [...minicardJs.matchAll(/getMinicardFlag\(board, '(allows[A-Za-z]+)'/g)].map(m => m[1]);
  const direct = [...minicardJs.matchAll(/board\??\.(allows[A-Za-z]+OnMinicard)/g)].map(m => m[1]);
  const jadeGates = gatesOf(minicardJade);
  for (const g of dedupe([...helperFields, ...direct, ...jadeGates])) {
    if (g === 'allowsCardSortingByNumber') continue; // the card-side half of the sort badge's pair
    assert.ok(popupFields.includes(g), `minicard gate ${g} has a popup row`);
  }
});

test('every NEW popup row is read by the card or the minicard (negative: no dead toggle)', () => {
  // Only the rows this fix added: a few older minicard rows
  // (allowsRequestedByOnMinicard, ...) predate this and are out of its scope.
  const readAnywhere = [cardJade, minicardJade, minicardJs].join('\n');
  for (const f of [...Object.keys(NEW_CARD_FIELDS), ...Object.keys(NEW_MINICARD_FIELDS)]) {
    assert.ok(readAnywhere.includes(f), `${f} is read by a template`);
  }
});

// ── order: the popup lists rows the way the card shows them ─────────────────

test('the popup renders the reorderable sections from the same source as the card', () => {
  assert.ok(popup.includes('each section in orderedCardFieldSections'));
  assert.ok(cardJade.includes('each section in orderedCardFieldSections'));
  for (const key of DEFAULT_CARD_FIELD_ORDER) {
    assert.ok(popup.includes(`if $eq section "${key}"`), `popup has a block for section ${key}`);
  }
  assert.match(sidebarJs, /orderedCardFieldSections\(\) \{[\s\S]*?applyCardFieldOrder\(currentBoard\?\.cardFieldOrder\)/,
    'the popup helper resolves the order with applyCardFieldOrder');
});

test('"Show on Card" rows follow the order the fields appear on the opened card', () => {
  const main = template(cardJade, 'cardDetails');
  const leftAt = main.indexOf('.card-details-left');
  const header = gatesOf(main.slice(0, leftAt));
  const sectionTemplates = {
    labels: ['cardFieldSectionLabels'],
    dates: ['cardFieldSectionDates'],
    members: ['cardFieldSectionMembers', 'cardFieldSectionDependenciesAndSort'],
    customFields: ['cardFieldSectionCustomFields', 'cardFieldSectionVoteAndPoker'],
    description: ['cardFieldSectionDescription'],
  };
  const middle = DEFAULT_CARD_FIELD_ORDER.flatMap(key =>
    sectionTemplates[key].flatMap(name => gatesOf(template(cardJade, name))));
  const tail = gatesOf(main.slice(leftAt));
  const expected = dedupe([...header, ...middle, ...tail]);

  // The card column of the popup, in row order, restricted to the card's gates.
  const cardColumn = popupToggleLines
    .filter(l => !/-on-minicard\(|js-toggle-/.test(l))
    .map(fieldOf)
    .filter(f => expected.includes(f));
  assert.deepStrictEqual(cardColumn, expected,
    'Show on Card rows are in the order the sections render on the card');
});

test('minicard-only rows sit beside the card row they belong with', () => {
  const idx = f => popupFields.indexOf(f);
  assert.strictEqual(idx('allowsLabelText'), idx('allowsLabelsOnMinicard') + 1, 'Labels text right under Labels');
  assert.strictEqual(idx('showsListOnMinicard'), idx('allowsShowListsOnMinicard') + 1, 'List title right under Show lists');
  assert.strictEqual(idx('allowsSwimlaneNameOnMinicard'), idx('showsListOnMinicard') + 1, 'Swimlane right under List title');
  assert.strictEqual(idx('allowsCommentCountOnMinicard'), idx('allowsCommentsOnMinicard') + 1, 'Comment count right under Comments');
});

test('the minicard rows cover the minicard top to bottom (the badges in their rendered order)', () => {
  // The badge strip renders in this order; the popup keeps the card's order,
  // so this only pins that every badge is present, each exactly once.
  const badges = ['allowsDependenciesOnMinicard', 'allowsStickersOnMinicard', 'allowsCommentCountOnMinicard',
    'allowsVoteOnMinicard', 'allowsPokerOnMinicard', 'allowsBadgeAttachmentOnMinicard', 'allowsSubtasksOnMinicard',
    'allowsChecklistCountBadgeOnMinicard', 'allowsCardSortingByNumberOnMinicard'];
  for (const b of badges) {
    assert.strictEqual(popupFields.filter(f => f === b).length, 1, `${b} has exactly one row`);
  }
  const strip = minicardJade.slice(minicardJade.indexOf('.badges'), minicardJade.indexOf('.minicard-description'));
  const helpers = ['showDependenciesOnMinicard', 'showStickersOnMinicard', 'showCommentCountOnMinicard',
    'showVoteOnMinicard', 'showPokerOnMinicard', 'allowsBadgeAttachmentOnMinicard', 'showSubtasks',
    'showChecklistCountBadge', 'allowsCardSortingByNumberOnMinicard'];
  const positions = helpers.map(h => strip.indexOf(h));
  assert.deepStrictEqual(positions, positions.slice().sort((a, b) => a - b), 'badge gates in strip order');
  assert.ok(positions.every(p => p !== -1));
});

// ── no new i18n keys: the rows reuse the field names the card already has ───

test('every label the popup shows is an existing i18n key (no untranslated new key)', () => {
  const keys = [...popup.matchAll(/\{\{_ '([^']+)'\}\}/g)].map(m => m[1]);
  for (const k of dedupe(keys)) assert.ok(en[k], `i18n key ${k} exists`);
  for (const k of ['stickers', 'location', 'card-dependencies', 'flowtime', 'pomodoro', 'vote-question',
    'poker-question', 'text-notes', 'activities', 'comments', 'number']) {
    assert.ok(popup.includes(`{{_ '${k}'}}`), `row label reuses ${k}`);
  }
});

test('the commented-out Comments/Activities rows are gone (negative)', () => {
  assert.ok(!popup.includes('//div.check-div'), 'no dead commented-out rows left in the popup');
});

console.log(`\n${passed} passed`);
