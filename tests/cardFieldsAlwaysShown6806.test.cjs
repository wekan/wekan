'use strict';

// #6806: Board Settings / Card's "Always show" - the fields every card of the
// board shows, empty or not. By default the description, attachments and
// comments; a board admin can untick those (then they are shown when they
// have something in them) and tick any other per-card field - a board where
// nearly every card gets labels, a due date and a checklist. "On this card"
// still hides one from one card. docs/Features/Cards/Card-Fields.md
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
const shownOn = (board, card = emptyCard, counts = {}) => f.FIELD_KEYS.filter(k => f.isShown(k, card, counts, board));

test('a board that never chose: the description, attachments and comments, as before', () => {
  assert.deepStrictEqual(f.alwaysShownOf(fullBoard()), [...f.ALWAYS]);
  assert.deepStrictEqual(shownOn(fullBoard()).sort(), [...f.ALWAYS].sort());
  assert.deepStrictEqual(shownOn(undefined).sort(), [...f.ALWAYS].sort(), 'and without a board');
});

test('the reporter\'s board: labels, due date and checklists on a new, empty card', () => {
  const board = fullBoard({ cardFieldsAlwaysShown: [...f.ALWAYS, 'labels', 'dueDate', 'checklists'] });
  for (const key of ['labels', 'dueDate', 'checklists', ...f.ALWAYS]) {
    assert.ok(f.isShown(key, emptyCard, {}, board), key);
    assert.strictEqual(f.boardForCard(board, emptyCard, {})[flag(key)], true, `${key} flag stays on`);
  }
  // Scrum fields go through the board's Scrum visibility instead of a flag.
  const scrumBoard = fullBoard({ cardFieldsAlwaysShown: ['scrumSprint'] });
  assert.ok(f.isShown('scrumSprint', emptyCard, {}, scrumBoard));
  assert.strictEqual(f.boardForCard(scrumBoard, emptyCard, {}).scrum.visibility.cardSprint, true);
  // Negative: an empty Scrum field the board does not always show reads false.
  assert.strictEqual(f.boardForCard(scrumBoard, emptyCard, {}).scrum.visibility.cardRelease, false);
});

test('the default four can be unticked: then shown when they have something', () => {
  const board = fullBoard({ cardFieldsAlwaysShown: [] });
  assert.deepStrictEqual(shownOn(board), [], 'negative: an empty card shows none of them');
  for (const key of f.ALWAYS) assert.strictEqual(f.boardForCard(board, emptyCard, {})[flag(key)], false, key);
  const withData = { ...emptyCard, description: 'Steps to reproduce' };
  assert.deepStrictEqual(shownOn(board, withData).sort(), ['descriptionText', 'descriptionTitle']);
  assert.ok(!f.isShown('descriptionText', { ...emptyCard, description: '   ' }, {}, board), 'negative: blank is not a description');
  assert.ok(f.isShown('attachments', emptyCard, { attachments: 2 }, board));
  assert.ok(f.isShown('comments', emptyCard, { comments: 1 }, board));
  assert.ok(!f.isShown('comments', emptyCard, { comments: 0 }, board));
  // Only what was unticked: the rest of the default stays.
  const noComments = fullBoard({ cardFieldsAlwaysShown: ['descriptionTitle', 'descriptionText', 'attachments'] });
  assert.ok(!f.isShown('comments', emptyCard, {}, noComments));
  assert.ok(f.isShown('attachments', emptyCard, {}, noComments));
});

test('negative: a field not ticked stays hidden while empty', () => {
  const one = fullBoard({ cardFieldsAlwaysShown: ['labels'] });
  assert.ok(f.isShown('labels', emptyCard, {}, one));
  for (const key of ['dueDate', 'checklists', 'members']) assert.ok(!f.isShown(key, emptyCard, {}, one), key);
});

test('negative: unticking On this card still hides it from that one card', () => {
  const board = fullBoard({ cardFieldsAlwaysShown: ['labels'] });
  const after = f.cardFieldsAfter(emptyCard, 'labels', false, {}, board);
  assert.deepStrictEqual(after, { shownFields: [], hiddenFields: ['labels'] }, 'kept as a choice of the card');
  assert.ok(!f.isShown('labels', { ...emptyCard, ...after }, {}, board));
  // Ticked again it follows the board, with nothing of its own stored.
  assert.deepStrictEqual(f.cardFieldsAfter({ ...emptyCard, ...after }, 'labels', true, {}, board), { shownFields: [], hiddenFields: [] });
  // A card can still show an empty field the board does not always show.
  const none = fullBoard({ cardFieldsAlwaysShown: [] });
  assert.deepStrictEqual(f.cardFieldsAfter(emptyCard, 'comments', true, {}, none), { shownFields: ['comments'], hiddenFields: [] });
  // Board Settings / Card turning the field off still wins over the list.
  const off = fullBoard({ cardFieldsAlwaysShown: ['labels'] });
  off[flag('labels')] = false;
  assert.strictEqual(f.boardForCard(off, emptyCard, {})[flag('labels')], false);
});

test('the board\'s list: normalised, starting from the default', () => {
  assert.deepStrictEqual(f.alwaysShownAfter({}, 'labels', true), ['labels', 'descriptionTitle', 'descriptionText', 'attachments', 'comments'], 'the first tick keeps the default four');
  assert.deepStrictEqual(f.alwaysShownAfter({}, 'comments', false), ['descriptionTitle', 'descriptionText', 'attachments']);
  const board = { cardFieldsAlwaysShown: ['checklists', 'nope', 'labels', 'labels'] };
  assert.deepStrictEqual(f.alwaysShownAfter(board, 'dueDate', true), ['dueDate', 'labels', 'checklists'], 'FIELD_KEYS order, no unknown or repeated key');
  assert.deepStrictEqual(f.alwaysShownAfter(board, 'nope', true), ['labels', 'checklists'], 'negative: an unknown key is not added');
  assert.deepStrictEqual(f.alwaysShownOf({ cardFieldsAlwaysShown: [] }), [], 'an empty list is a choice, not the default');
  assert.ok(!f.boardAlwaysShows({ cardFieldsAlwaysShown: ['$where'] }, '$where'));
});

test('stored on the board, through one normalising method, as a board admin', () => {
  const boards = read('models/boards.js');
  assert.match(boards, /cardFieldsAlwaysShown: \{[\s\S]{0,200}type: Array,\n\s+optional: true,/);
  assert.match(boards, /'cardFieldsAlwaysShown\.\$': \{\n\s+type: String,\n\s+allowedValues: CARD_SHOWN_FIELD_KEYS,/);
  assert.match(boards, /async setCardFieldAlwaysShown\(key, show\) \{[\s\S]{0,200}\$set: \{ cardFieldsAlwaysShown: alwaysShownAfter\(this, key, show\) \}/);
  assert.match(read('server/permissions/boards.js'), /update: allowIsBoardAdminOrSiteAdmin,/);
  // Negative: the unreleased first name of the setting is gone everywhere.
  for (const file of ['models/boards.js', 'models/lib/cardShownFields.js', 'client/components/sidebar/sidebar.js', 'client/components/sidebar/sidebar.jade']) {
    assert.ok(!/cardFieldsShownEmpty|show-when-empty|ShownEmpty/.test(read(file)), file);
  }
});

test('Board Settings / Card and + Add: an Always show column, for every per-card field', () => {
  const jade = read('client/components/sidebar/sidebar.jade');
  const popup = jade.slice(jade.indexOf('template(name="boardCardSettingsPopup")')).split('\ntemplate(')[0];
  assert.match(popup, /span\.card-settings-side-head\.card-settings-side-head-always \{\{_ 'card-settings-always-show'\}\}/);
  assert.match(popup, /if row\.alwaysShowable\n\s+span\.card-settings-side\.card-settings-side-always\n\s+a\.flex\.card-always-show\(class="\{\{#if canModifyBoard\}\}js-card-always-show\{\{else\}\}is-disabled\{\{\/if\}\}/);
  assert.match(popup, /role="checkbox" aria-checked="\{\{#if row\.alwaysShown\}\}true\{\{else\}\}false\{\{\/if\}\}"/);
  const head = popup.slice(popup.indexOf('.card-settings-pane-head'), popup.indexOf('each row in sectionSettingsRows'));
  assert.ok(!/if settingsCardId\n\s+span\.card-settings-side-head\.card-settings-side-head-always/.test(head), 'the board\'s, in Board Settings too');
  const js = read('client/components/sidebar/sidebar.js');
  assert.match(js, /alwaysShowable: cardShownFields\.FIELD_KEYS\.includes\(row\.key\),/, 'the default four too');
  assert.match(js, /alwaysShown: cardShownFields\.boardAlwaysShows\(board, row\.key\),/);
  assert.match(js, /'click \.js-card-always-show'\(evt, tpl\) \{[\s\S]{0,400}if \(!\(Utils\.canModifyBoard && Utils\.canModifyBoard\(\)\)\) return;[\s\S]{0,200}board\.setCardFieldAlwaysShown\(key, !cardShownFields\.boardAlwaysShows\(board, key\)\)/);
  assert.match(js, /cardShownFields\.isShown\(row\.key, thisCard, counts, board\)/);
  assert.match(js, /cardShownFields\.cardFieldsAfter\(card, key, !cardShownFields\.isShown\(key, card, counts, board\), counts, board\)/);
  const add = read('client/components/cards/cardAddFields.js');
  assert.match(add, /f\.isShown\(key, card, cardFieldCounts\(card\), Utils\.getCurrentBoard\(\)\)/);
  // The default four unticked need their counts.
  assert.match(add, /attachments: typeof card\.attachments === 'function' \? countOf\(card\.attachments\(\)\) : 0,/);
  assert.match(add, /comments: typeof card\.comments === 'function' \? countOf\(card\.comments\(\)\) : 0,/);
  assert.match(read('models/lib/cardShownFields.js'), /FIELD_KEYS\.filter\(k => !isShown\(k, card, counts, board\)\)/);
  assert.match(read('client/components/sidebar/sidebar.css'), /\.board-card-settings\.show-minicard-only \.card-settings-side-always,\n\.board-card-settings\.show-minicard-only \.card-settings-side-head-always \{/);
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

test('the heading in every language, and the first name gone', () => {
  const dir = path.join(root, 'imports/i18n/data');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['card-settings-always-show'], 'Always show');
  for (const file of fs.readdirSync(dir)) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const value = data['card-settings-always-show'];
    assert.ok(value && value.trim(), file);
    if (!file.startsWith('en')) assert.notStrictEqual(value, en['card-settings-always-show'], `${file} is translated`);
    assert.ok(!('card-settings-show-when-empty' in data), `negative: ${file} has no Show when empty left`);
  }
});

console.log(`cardFieldsAlwaysShown6806: ${passed} passed`);
