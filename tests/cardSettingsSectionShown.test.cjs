'use strict';

// Card Settings: the checkbox LEFT of each section's title - whether the WHOLE
// section is shown on the side Card Settings shows (Show on Card / Show on
// Minicard) - and a section with ONE row on that side drawn as one line
// (docs/Features/Cards/Card-Settings.md). The rules are
// models/lib/cardSettingsSections.js (hiddenSectionsOf, sectionShown,
// hiddenSectionsAfter, rowKeysHiddenBySections, isSingleRowSection,
// singleLineChecked) and models/lib/cardShownFields.js (boardForCard,
// boardForMinicard); the storage models/boards.js.
// Run: node tests/cardSettingsSectionShown.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const s = require('../models/lib/cardSettingsSections.js');
const f = require('../models/lib/cardShownFields.js');
const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardSettingsSectionShown:');

const rowOf = key => CARD_SETTINGS_ROWS.find(r => r.key === key);

test('a board that never hid one shows every section on both sides', () => {
  for (const side of s.SIDES) {
    assert.deepStrictEqual(s.hiddenSectionsOf({}, side), []);
    for (const id of s.SECTION_IDS) assert.ok(s.sectionShown({}, side, id), `${side} ${id}`);
  }
  assert.deepStrictEqual(s.hiddenSectionsOf(null, 'card'), [], 'no board: nothing hidden');
  assert.deepStrictEqual(s.rowKeysHiddenBySections({}, 'card'), []);
});

test('the stored lists are normalised: known ids only, each once, in the table order', () => {
  const board = { cardSettingsHiddenOnCard: ['vote', 'nope', 'date', 'vote', '$where', 42] };
  assert.deepStrictEqual(s.hiddenSectionsOf(board, 'card'), ['date', 'vote']);
  assert.deepStrictEqual(s.normaliseHiddenSections('date'), [], 'negative: not a list');
  assert.deepStrictEqual(s.hiddenSectionsOf(board, 'sideways'), [], 'negative: an unknown side hides nothing');
});

test('hiddenSectionsAfter ticks and unticks one section, ignoring unknown ids', () => {
  let stored = s.hiddenSectionsAfter(undefined, 'members', false);
  assert.deepStrictEqual(stored, ['members']);
  stored = s.hiddenSectionsAfter(stored, 'date', false);
  assert.deepStrictEqual(stored, ['date', 'members'], 'the table order');
  stored = s.hiddenSectionsAfter(stored, 'date', false);
  assert.deepStrictEqual(stored, ['date', 'members'], 'twice is once');
  stored = s.hiddenSectionsAfter(stored, 'members', true);
  assert.deepStrictEqual(stored, ['date']);
  assert.deepStrictEqual(s.hiddenSectionsAfter(stored, '$where', false), ['date'], 'negative: unknown id');
  assert.deepStrictEqual(s.hiddenSectionsAfter(['junk'], 'date', true), [], 'junk dropped on write');
});

test('the two sides are independent', () => {
  const board = { cardSettingsHiddenOnCard: ['date'], cardSettingsHiddenOnMinicard: ['members'] };
  assert.ok(!s.sectionShown(board, 'card', 'date'));
  assert.ok(s.sectionShown(board, 'minicard', 'date'));
  assert.ok(s.sectionShown(board, 'card', 'members'));
  assert.ok(!s.sectionShown(board, 'minicard', 'members'));
  assert.ok(s.rowKeysHiddenBySections(board, 'card').includes('dueDate'));
  assert.ok(!s.rowKeysHiddenBySections(board, 'minicard').includes('dueDate'));
  assert.ok(s.rowKeysHiddenBySections(board, 'minicard').includes('members'));
});

test('rows hidden by a section are only the rows that have that side', () => {
  const board = { cardSettingsHiddenOnCard: ['members'], cardSettingsHiddenOnMinicard: ['members'] };
  // Suggested members works only in the opened card: no minicard side.
  assert.ok(s.rowKeysHiddenBySections(board, 'card').includes('suggestedMembers'));
  assert.ok(!s.rowKeysHiddenBySections(board, 'minicard').includes('suggestedMembers'), 'negative');
  for (const key of s.rowKeysHiddenBySections(board, 'minicard')) assert.ok(rowOf(key).minicard, key);
});

test('Show on Card: the opened card\'s view reads false for every row of a hidden section, Scrum too', () => {
  const board = {
    _id: 'b', allowsDueDate: true, allowsStartDate: true, allowsMembers: true,
    allowsDueDateOnMinicard: true,
    scrum: { visibility: { cardSprint: true, minicardSprint: true } },
    cardSettingsHiddenOnCard: ['date', 'scrum'],
  };
  const view = f.boardForCard(board);
  assert.notStrictEqual(view, board);
  assert.strictEqual(view.allowsDueDate, false);
  assert.strictEqual(view.allowsStartDate, false);
  assert.strictEqual(view.allowsMembers, true, 'another section is untouched');
  assert.strictEqual(view.scrum.visibility.cardSprint, false);
  assert.strictEqual(view.scrum.visibility.minicardSprint, true, 'the minicard side is untouched');
  assert.strictEqual(view.allowsDueDateOnMinicard, true, 'negative: the minicard flag stays');
  assert.ok(!f.boardAllows(view, 'dueDate') && !f.boardAllows(view, 'scrumSprint'));
  // The board document itself is never changed - Card Settings reads it, so
  // the row keeps its own tick while its section is hidden.
  assert.strictEqual(board.allowsDueDate, true);
  assert.strictEqual(board.scrum.visibility.cardSprint, true);
  // Ticking the section back restores exactly what was shown.
  const back = { ...board, cardSettingsHiddenOnCard: s.hiddenSectionsAfter(board.cardSettingsHiddenOnCard, 'date', true) };
  assert.strictEqual(f.boardForCard(back).allowsDueDate, true);
  assert.strictEqual(f.boardForCard(back).allowsStartDate, true);
});

test('Show on Minicard: the minicard\'s view, the card unaffected', () => {
  const board = {
    _id: 'b', allowsMembers: true, allowsMembersOnMinicard: true, allowsAssigneeOnMinicard: true,
    allowsIssueTypeOnMinicard: true, scrum: { visibility: { minicardSprint: true, cardSprint: true } },
    cardSettingsHiddenOnMinicard: ['members', 'scrum'],
  };
  const mini = f.boardForMinicard(board);
  assert.strictEqual(mini.allowsMembersOnMinicard, false);
  assert.strictEqual(mini.allowsAssigneeOnMinicard, false);
  assert.strictEqual(mini.allowsIssueTypeOnMinicard, false, 'the work item type badge is a Scrum row');
  assert.strictEqual(mini.scrum.visibility.minicardSprint, false);
  assert.strictEqual(mini.allowsMembers, true, 'negative: the card flag stays');
  assert.strictEqual(f.boardForCard(board), board, 'nothing hidden on the card: the board itself');
  assert.ok(f.hidesRow(board, 'minicard', 'members'));
  assert.ok(!f.hidesRow(board, 'card', 'members'), 'negative');
});

test('a view keeps the board\'s prototype and is cached per side', () => {
  class Board { hasAnyAllowsDate() { return Boolean(this.allowsDueDate); } }
  const board = Object.assign(new Board(), { _id: 'b', allowsDueDate: true, cardSettingsHiddenOnCard: ['date'] });
  const view = f.boardForCard(board);
  assert.strictEqual(view.hasAnyAllowsDate(), false, 'helpers read the view');
  assert.strictEqual(f.boardForCard(board), view, 'cached');
  assert.strictEqual(f.boardForMinicard(board), board, 'the other side has its own');
});

test('a section with exactly one row on a side is one line', () => {
  assert.ok(s.isSingleRowSection([{ key: 'vote' }]));
  assert.ok(!s.isSingleRowSection([]), 'negative: none');
  assert.ok(!s.isSingleRowSection([{ key: 'a' }, { key: 'b' }]), 'negative: two');
  assert.ok(!s.isSingleRowSection(null));
  for (const id of ['vote', 'poker', 'subtasks']) {
    for (const side of s.SIDES) {
      assert.strictEqual(s.rowsOfSection(id).filter(r => r[side]).length, 1, `${id} ${side}`);
    }
  }
});

test('the one line\'s checkbox: the row\'s flag AND the section shown', () => {
  const board = { cardSettingsHiddenOnCard: ['vote'] };
  assert.strictEqual(s.singleLineChecked(board, 'card', 'vote', true), false, 'hidden section: unticked');
  assert.strictEqual(s.singleLineChecked(board, 'minicard', 'vote', true), true);
  assert.strictEqual(s.singleLineChecked({}, 'card', 'vote', false), false, 'row off: unticked');
  assert.strictEqual(s.singleLineChecked({}, 'card', 'vote', true), true);
});

test('storage: two optional board lists of section ids and a normalised setter', () => {
  const boards = read('models/boards.js');
  for (const field of ['cardSettingsHiddenOnCard', 'cardSettingsHiddenOnMinicard']) {
    assert.match(boards, new RegExp(`${field}: \\{[\\s\\S]{0,200}type: Array,\\n\\s+optional: true,`), field);
    assert.match(boards, new RegExp(`'${field}\\.\\$': \\{\\n\\s+type: String,\\n\\s+allowedValues: CARD_SETTINGS_SECTION_IDS,`), field);
  }
  assert.deepStrictEqual(s.HIDDEN_SECTIONS_FIELD, { card: 'cardSettingsHiddenOnCard', minicard: 'cardSettingsHiddenOnMinicard' });
  assert.match(boards, /async setCardSettingsSectionShown\(side, sectionId, shown\) \{[\s\S]{0,400}hiddenSectionsAfter\(this\[field\], sectionId, shown === true\)/);
  // Negative: an unknown side writes nothing.
  assert.match(boards, /const field = HIDDEN_SECTIONS_FIELD\[side\];\n\s+if \(!field\) return 0;/);
});

test('the UI: a section checkbox left of the title, a board admin\'s, its handler', () => {
  const jade = read('client/components/sidebar/sidebar.jade');
  const tpl = jade.slice(jade.indexOf('template(name="cardSettingsInlineSection")'), jade.indexOf('template(name="cardSettingsSectionPopup")'));
  const box = tpl.indexOf('js-card-settings-section-shown');
  const title = tpl.indexOf('h4.card-settings-inline-section-title');
  const caret = tpl.indexOf('js-toggle-card-settings-section');
  assert.ok(caret !== -1 && caret < box && box < title, 'after the caret, before the title');
  assert.match(tpl, /class="\{\{#if section\.writable\}\}js-card-settings-section-shown\{\{else\}\}is-disabled\{\{\/if\}\}/, 'disabled for a non-admin');
  assert.match(tpl, /\.materialCheckBox\(class="\{\{#if section\.shown\}\}is-checked\{\{\/if\}\}"\)/, 'the rows\' look');
  // The count n/m stays; a single line has none.
  assert.match(tpl, /unless section\.single\n\s+span\.card-settings-inline-section-count \{\{section\.checkedCount\}\}\/\{\{section\.total\}\}/);
  // The hamburger only when it has something in it.
  assert.match(tpl, /if section\.hasMenu\n\s+a\.card-settings-inline-menu\.js-open-card-settings-section-menu/);
  assert.match(tpl, /if row\.hasMenu\n\s+a\.card-settings-inline-menu\.js-open-card-settings-item-menu/);
  const js = read('client/components/sidebar/sidebar.js');
  assert.match(js, /'click \.js-card-settings-section-shown'\(evt, tpl\) \{[\s\S]{0,600}if \(!\(Utils\.canModifyBoard && Utils\.canModifyBoard\(\)\)\) return;[\s\S]{0,200}board\.setCardSettingsSectionShown\(side, id, !cardSettingsSections\.sectionShown\(board, side, id\)\)/);
  // The one line: no caret, its checkbox clicks the row's real one.
  assert.match(tpl, /unless section\.single\n\s+a\.card-settings-inline-collapse/);
  assert.match(tpl, /span\.card-settings-single-real\.js-card-settings-single-real\(hidden aria-hidden="true"\)\n\s+\+cardSettingsSideToggle\(row=section\.flagRow\)/);
  assert.match(js, /'click \.js-card-settings-single-toggle'\(evt, tpl\) \{[\s\S]{0,900}if \(rowOn && shown\) \{\n\s+real\.click\(\);\n\s+return;\n\s+\}\n\s+if \(!rowOn\) real\.click\(\);\n\s+if \(!shown\) \{[\s\S]{0,80}setCardSettingsSectionShown\(side, id, true\)/);
  // The section menus: Card's always has Ask for a reason + Draggable; the
  // others only with actions.
  assert.match(js, /function sectionHasMenu\(section\) \{\n\s+if \(section && section\.general\) return true;\n\s+return Boolean\(section\) && sectionCardActionsOf\(section\.id\)\.length > 0;/);
});

test('where the fields are drawn: card and minicard read the side\'s view', () => {
  const add = read('client/components/cards/cardAddFields.js');
  assert.match(add, /return f\.boardForCard\(Utils\.getCurrentBoard\(\)\);/);
  const mini = read('client/components/cards/minicard.js');
  assert.match(mini, /MINICARD_FIELD_TEMPLATES = Object\.freeze\(\['minicard', 'minicardChecklist'\]\)/);
  assert.match(mini, /return boardForMinicard\(board \|\| Utils\.getCurrentBoard\(\)\);/);
  // Negative: no minicard helper decides a field from the raw board any more.
  const helpers = mini.slice(mini.indexOf('Template.minicard.helpers({'), mini.indexOf('// #459: accessible reordering'));
  for (const raw of [/getMinicardFlag\(this\.board\(\)/, /const board = this\.board\(\);/, /const currentBoard = this\.board\(\);/,
    /Utils\.getCurrentBoard\(\)\?\.allows\w+OnMinicard/, /ReactiveCache\.getBoard\(this\.boardId\)\?\.(allows|labels)/]) {
    assert.ok(!raw.test(helpers), String(raw));
  }
  assert.match(helpers, /if \(hidesRow\(currentBoard, 'minicard', 'checklists'\)\) return \[\];/, 'a checklist\'s own override cannot bring it back');
  const scrum = read('client/components/boards/scrum/scrumFields.js');
  assert.match(scrum, /const board = side \? boardForSide\(boardFor\(context\), side\) : boardFor\(context\);/);
  const details = read('client/components/cards/cardDetails.js');
  // 2026-10-28: the opened card's sections are listed from the board as its
  // cards see it, and Scrum's fields from it too; the hidden sections are
  // also left out of the list itself.
  assert.match(details, /const board = boardForCard\(this\?\.board\?\.\(\)\);\n\s+return cardSectionFields\(this, 'scrum'\)\.filter\(key => boardAllows\(board, key\)\);/, 'the Scrum fields of the opened card');
  assert.match(details, /const board = boardForCard\(raw\);\n\s+const hidden = cardSettingsSections\.hiddenSectionsOf\(raw, 'card'\);/, 'the sections of the opened card');
  for (const helper of ['showCardColorOnCard', 'allowsCardCollapse', 'showLabelsAboveTitleOnCard', 'labelsShownAboveTitle']) {
    assert.match(details, new RegExp(`  ${helper}\\(\\) \\{\\n\\s+return cardBoardView\\(this\\)`), helper);
  }
  // Card Settings itself reads the RAW board: its checkboxes show each row's own flag.
  const sidebar = read('client/components/sidebar/sidebar.js');
  assert.ok(!/boardForCard|boardForMinicard|cardBoardView/.test(sidebar), 'negative: Card Settings never reads a view');
});

console.log(`cardSettingsSectionShown: ${passed} passed`);
