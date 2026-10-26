'use strict';

// #6806: Board Settings / Card's "Show when empty" - the fields every card of
// the board shows even while they are empty (a board where nearly every card
// gets labels, a due date and a checklist), still hidden from one card by
// unticking "On this card". docs/Features/Cards/Card-Fields.md
// Run: node tests/cardFieldsShownEmpty6806.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const f = require('../models/lib/cardShownFields.js');
const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('cardFieldsShownEmpty6806:');

const fullBoard = extra => {
  const b = { _id: 'b1', scrum: { visibility: {} }, ...extra };
  for (const key of f.FIELD_KEYS) {
    const spec = CARD_SETTINGS_ROWS.find(r => r.key === key).card;
    if (spec.scrum) b.scrum.visibility[spec.scrum] = true;
    else b[spec.field] = true;
  }
  return b;
};
const flag = key => CARD_SETTINGS_ROWS.find(r => r.key === key).card.field;
const emptyCard = { _id: 'c1', boardId: 'b1' };

test('the reporter\'s board: labels, due date and checklists on a new, empty card', () => {
  const board = fullBoard({ cardFieldsShownEmpty: ['labels', 'dueDate', 'checklists'] });
  for (const key of ['labels', 'dueDate', 'checklists']) {
    assert.ok(f.isShown(key, emptyCard, {}, board), key);
    assert.strictEqual(f.boardForCard(board, emptyCard, {})[flag(key)], true, `${key} flag stays on`);
  }
  // Scrum fields go through the board's Scrum visibility instead of a flag.
  const scrumBoard = fullBoard({ cardFieldsShownEmpty: ['scrumSprint'] });
  assert.ok(f.isShown('scrumSprint', emptyCard, {}, scrumBoard));
  assert.strictEqual(f.boardForCard(scrumBoard, emptyCard, {}).scrum.visibility.sprint, scrumBoard.scrum.visibility.sprint);
});

test('negative: without the board\'s list an empty field is still hidden', () => {
  const board = fullBoard();
  for (const key of ['labels', 'dueDate', 'checklists']) {
    assert.ok(!f.isShown(key, emptyCard, {}, board), key);
    assert.ok(!f.isShown(key, emptyCard, {}), `${key}, no board passed`);
    assert.strictEqual(f.boardForCard(board, emptyCard, {})[flag(key)], false, key);
  }
  // Only the listed field, not its neighbours.
  const one = fullBoard({ cardFieldsShownEmpty: ['labels'] });
  assert.ok(f.isShown('labels', emptyCard, {}, one));
  assert.ok(!f.isShown('dueDate', emptyCard, {}, one));
});

test('negative: unticking On this card still hides it from that one card', () => {
  const board = fullBoard({ cardFieldsShownEmpty: ['labels'] });
  const after = f.cardFieldsAfter(emptyCard, 'labels', false, {}, board);
  assert.deepStrictEqual(after, { shownFields: [], hiddenFields: ['labels'] }, 'kept as a choice of the card');
  assert.ok(!f.isShown('labels', { ...emptyCard, ...after }, {}, board));
  // Ticked again it follows the board, with nothing of its own stored.
  const back = f.cardFieldsAfter({ ...emptyCard, ...after }, 'labels', true, {}, board);
  assert.deepStrictEqual(back, { shownFields: [], hiddenFields: [] });
  // Board Settings / Card turning the field off still wins over the list.
  const off = fullBoard({ cardFieldsShownEmpty: ['labels'] });
  off[flag('labels')] = false;
  assert.strictEqual(f.boardForCard(off, emptyCard, {})[flag('labels')], false);
});

test('the board\'s list: normalised, and only for fields that can be empty', () => {
  assert.deepStrictEqual(f.EMPTY_SHOWABLE_KEYS, f.FIELD_KEYS.filter(k => !f.ALWAYS.includes(k)));
  for (const key of f.ALWAYS) assert.ok(!f.EMPTY_SHOWABLE_KEYS.includes(key), `negative: ${key} is always shown anyway`);
  const board = { cardFieldsShownEmpty: ['checklists', 'nope', 'labels', 'labels', 'comments'] };
  assert.deepStrictEqual(f.shownEmptyAfter(board, 'dueDate', true), ['dueDate', 'labels', 'checklists'], 'FIELD_KEYS order, no unknown or repeated key');
  assert.deepStrictEqual(f.shownEmptyAfter(board, 'labels', false), ['checklists']);
  assert.deepStrictEqual(f.shownEmptyAfter(board, 'nope', true), ['labels', 'checklists'], 'negative: an unknown key is not added');
  assert.deepStrictEqual(f.shownEmptyAfter({}, 'labels', true), ['labels']);
  assert.ok(!f.boardShowsEmpty({ cardFieldsShownEmpty: ['comments'] }, 'comments'));
  assert.ok(!f.boardShowsEmpty(null, 'labels'));
});

test('stored on the board, through one normalising method, as a board admin', () => {
  const boards = read('models/boards.js');
  assert.match(boards, /cardFieldsShownEmpty: \{[\s\S]{0,200}type: Array,\n\s+optional: true,/);
  assert.match(boards, /'cardFieldsShownEmpty\.\$': \{\n\s+type: String,\n\s+allowedValues: EMPTY_SHOWABLE_KEYS,/);
  assert.match(boards, /async setCardFieldShownEmpty\(key, show\) \{[\s\S]{0,200}\$set: \{ cardFieldsShownEmpty: shownEmptyAfter\(this, key, show\) \}/);
  // Boards.allow's update rule: a board admin (or a site admin) only.
  assert.match(read('server/permissions/boards.js'), /update: allowIsBoardAdminOrSiteAdmin,/);
});

test('Board Settings / Card and + Add: a Show when empty column', () => {
  const jade = read('client/components/sidebar/sidebar.jade');
  const popup = jade.slice(jade.indexOf('template(name="boardCardSettingsPopup")')).split('\ntemplate(')[0];
  assert.match(popup, /span\.card-settings-side-head\.card-settings-side-head-empty \{\{_ 'card-settings-show-when-empty'\}\}/);
  assert.match(popup, /if row\.showableEmpty\n\s+span\.card-settings-side\.card-settings-side-when-empty\n\s+a\.flex\.card-show-when-empty\(class="\{\{#if canModifyBoard\}\}js-card-show-when-empty\{\{else\}\}is-disabled\{\{\/if\}\}/);
  assert.match(popup, /role="checkbox" aria-checked="\{\{#if row\.shownEmpty\}\}true\{\{else\}\}false\{\{\/if\}\}"/);
  // Not under its own if settingsCardId: it is the board's, in Board Settings too.
  const head = popup.slice(popup.indexOf('.card-settings-pane-head'), popup.indexOf('each row in sectionSettingsRows'));
  assert.ok(!/if settingsCardId\n\s+span\.card-settings-side-head\.card-settings-side-head-empty/.test(head));
  const js = read('client/components/sidebar/sidebar.js');
  assert.match(js, /showableEmpty: cardShownFields\.EMPTY_SHOWABLE_KEYS\.includes\(row\.key\),/);
  assert.match(js, /shownEmpty: cardShownFields\.boardShowsEmpty\(board, row\.key\),/);
  assert.match(js, /'click \.js-card-show-when-empty'\(evt, tpl\) \{[\s\S]{0,400}if \(!\(Utils\.canModifyBoard && Utils\.canModifyBoard\(\)\)\) return;[\s\S]{0,200}board\.setCardFieldShownEmpty\(key, !cardShownFields\.boardShowsEmpty\(board, key\)\)/);
  // On this card and the opened card ask with the board, or the list is never read.
  assert.match(js, /cardShownFields\.isShown\(row\.key, thisCard, counts, board\)/);
  assert.match(js, /cardShownFields\.cardFieldsAfter\(card, key, !cardShownFields\.isShown\(key, card, counts, board\), counts, board\)/);
  assert.match(read('client/components/cards/cardAddFields.js'), /f\.isShown\(key, card, cardFieldCounts\(card\), Utils\.getCurrentBoard\(\)\)/);
  assert.match(read('models/lib/cardShownFields.js'), /FIELD_KEYS\.filter\(k => !isShown\(k, card, counts, board\)\)/);
  // The minicard's own view of the popup hides it: it is about the opened card.
  assert.match(read('client/components/sidebar/sidebar.css'), /\.board-card-settings\.show-minicard-only \.card-settings-side-when-empty,\n\.board-card-settings\.show-minicard-only \.card-settings-side-head-empty \{/);
});

test('negative: every caller of isShown and cardFieldsAfter passes the board', () => {
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return ['node_modules', '_build', '.build', '.tools'].includes(e.name) ? [] : walk(rel);
    return /\.(js|cjs|mjs)$/.test(e.name) ? [rel] : [];
  });
  for (const file of [...walk('client'), ...walk('models'), ...walk('server')]) {
    const src = read(file);
    for (const m of src.matchAll(/\b(isShown|cardFieldsAfter)\(/g)) {
      if (/function $/.test(src.slice(Math.max(0, m.index - 9), m.index))) continue;
      // The call's top-level arguments, nested calls counted as one.
      let depth = 0;
      let args = 1;
      let i = m.index + m[0].length;
      for (; i < src.length; i += 1) {
        const ch = src[i];
        if ('([{'.includes(ch)) depth += 1;
        else if (')]}'.includes(ch)) { if (depth === 0) break; depth -= 1; }
        else if (ch === ',' && depth === 0) args += 1;
      }
      const need = m[1] === 'isShown' ? 4 : 5;
      assert.ok(args >= need, `${file}: ${src.slice(m.index, i + 1)} without the board`);
    }
  }
});

test('the heading in every language', () => {
  const dir = path.join(root, 'imports/i18n/data');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['card-settings-show-when-empty'], 'Show when empty');
  for (const file of fs.readdirSync(dir)) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const value = data['card-settings-show-when-empty'];
    assert.ok(value && value.trim(), file);
    if (!file.startsWith('en')) assert.notStrictEqual(value, en['card-settings-show-when-empty'], `${file} is translated`);
  }
});

console.log(`cardFieldsShownEmpty6806: ${passed} passed`);
