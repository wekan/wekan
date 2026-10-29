'use strict';

// ONE SECTION MODEL (2026-10-28): the opened card and the minicard draw Card
// Settings' sections (models/lib/cardSettingsSections.js) in the board's
// section order of that side (cardSettingsSectionOrder for Show on Card,
// minicardSettingsSectionOrder for Show on Minicard), each section's fields in
// that side's row order (board.cardFieldOrder / minicardFieldOrder through
// models/lib/cardFieldOrder.js). This suite pins the mapping: every positioned
// row is in exactly the layout section of its Card Settings section, the
// defaults, old stored orders, the two sides independent, and - by reading
// the templates - that no field is drawn outside its section.
// Run: node tests/cardSectionsOnCard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sections = require('../models/lib/cardSettingsSections');
const order = require('../models/lib/cardFieldOrder');
const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows');
const { DATE_FIELDS, BADGE_FIELDS, BLOCK_FIELDS } = require('../models/lib/minicardGroups');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('cardSectionsOnCard:');

const { SECTIONS, SECTION_IDS, sectionOf } = sections;
const LAYOUT = { card: order.CARD_LAYOUT, minicard: order.MINICARD_LAYOUT };

// ── the layouts are Card Settings' sections ─────────────────────────────────

for (const side of ['card', 'minicard']) {
  test(`${side}: every positioned row is in exactly one layout section, the one of its Card Settings section`, () => {
    const layout = LAYOUT[side];
    const positioned = CARD_SETTINGS_ROWS.filter(r => r[side] && !r[side].after && order.isMovableKey(layout, r.key));
    assert.ok(positioned.length > 20, 'the rows with a place');
    for (const row of positioned) {
      const holders = layout.sections.filter(s => s.fields.includes(row.key));
      assert.strictEqual(holders.length, 1, `${row.key} in one section`);
      assert.strictEqual(holders[0].key, sectionOf(row.key).id, `${row.key}: layout ${holders[0].key} is Card Settings' ${sectionOf(row.key).id}`);
    }
    // And nothing else: a layout section holds only rows with that side.
    for (const s of layout.sections) {
      assert.ok(SECTION_IDS.includes(s.key), `${side} section ${s.key} is a Card Settings section`);
      for (const f of s.fields) assert.ok(positioned.some(r => r.key === f), `${side}: ${f} is a positioned row`);
    }
    // Each section at most once.
    assert.strictEqual(new Set(layout.sections.map(s => s.key)).size, layout.sections.length);
  });
}

test('the title bar (head) is fixed, a modifier row has no place (negative: neither is dragged)', () => {
  for (const key of ['dueComplete', 'cardNumber', 'cover']) {
    assert.strictEqual(order.isMovableKey(order.CARD_LAYOUT, key), false, `card ${key}`);
    assert.strictEqual(order.isMovableKey(order.MINICARD_LAYOUT, key), false, `minicard ${key}`);
  }
  for (const key of ['labelsAboveTitle', 'cardColor', 'labelText', 'collapse', 'parentCard', 'linkedCard', 'dueFromTitle']) {
    assert.strictEqual(order.isMovableKey(order.CARD_LAYOUT, key), false, `card ${key}`);
    assert.ok(CARD_SETTINGS_ROWS.find(r => r.key === key).card.after, `${key} follows another row`);
  }
});

// ── the default section orders ─────────────────────────────────────────────

test('the opened card\'s default section order starts with Labels, as the card always did', () => {
  assert.deepStrictEqual(sections.sectionOrder(undefined, 'card'),
    ['labels', 'date', 'members', 'card', 'time', 'customFields', 'vote', 'poker', 'description',
      'scrum', 'checklists', 'subtasks', 'attachments', 'comments']);
  assert.deepStrictEqual(sections.sectionOrder(undefined), sections.sectionOrder(undefined, 'card'), 'card is the default side');
  assert.deepStrictEqual(SECTIONS.map(s => s.id), sections.DEFAULT_SECTION_ORDER.card, 'the table\'s order');
});

test('the minicard\'s default section order is where its fields were drawn first', () => {
  assert.deepStrictEqual(sections.sectionOrder(undefined, 'minicard'),
    ['scrum', 'date', 'time', 'labels', 'customFields', 'members', 'checklists', 'card', 'comments',
      'vote', 'poker', 'attachments', 'subtasks', 'description']);
  assert.deepStrictEqual([...sections.DEFAULT_SECTION_ORDER.minicard].sort(), [...SECTION_IDS].sort(), 'every section, once');
});

// ── old stored orders ──────────────────────────────────────────────────────

test('the first #4448 version\'s five section keys still map, fields keeping their order', () => {
  const flat = order.applyCardOrder(['description', 'labels', 'dates', 'members', 'customFields']);
  assert.deepStrictEqual(order.orderedCardFieldsOf(flat, 'description'), ['descriptionTitle', 'descriptionText']);
  assert.deepStrictEqual(order.orderedCardFieldsOf(flat, 'date'), ['receivedDate', 'startDate', 'dueDate', 'endDate']);
  assert.strictEqual(new Set(flat).size, order.DEFAULT_CARD_ORDER.length);
});

test('the old template-group keys (REST) expand to their fields', () => {
  assert.deepStrictEqual(order.applyCardFieldOrder(['sort', 'dates']).slice(0, 3), ['card', 'time', 'date']);
  assert.deepStrictEqual(order.orderedCardFieldsOf(['sort'], 'time'), ['spentTime', 'flowtime', 'pomodoro']);
  assert.deepStrictEqual(order.applyCardFieldOrder(['voteAndPoker']).slice(0, 2), ['vote', 'poker']);
  assert.deepStrictEqual(order.orderedMinicardFieldsOf(['badges'], 'card').slice(0, 2), ['dependencies', 'cardSortingByNumber']);
  assert.deepStrictEqual(order.orderedMinicardFieldsOf(['dates'], 'date'), ['receivedDate', 'startDate', 'dueDate', 'endDate']);
  // The new section keys are read as their fields too.
  assert.deepStrictEqual(order.applyCardFieldOrder(['comments', 'time']).slice(0, 2), ['comments', 'time']);
});

test('a stale field-key order keeps each field\'s relative order inside its new section', () => {
  // An order saved under the old layout: Pomodoro before Spent time (the old
  // Sort group), End date first of the dates, Stickers before Location.
  const stale = ['dueComplete', 'cardNumber', 'cover', 'location', 'labels', 'stickers', 'endDate', 'dueDate',
    'pomodoro', 'cardSortingByNumber', 'spentTime', 'showLists', 'bogus', 'checklists'];
  const flat = order.applyCardOrder(stale);
  assert.deepStrictEqual(order.orderedCardFieldsOf(flat, 'labels'), ['location', 'labels', 'stickers']);
  assert.deepStrictEqual(order.orderedCardFieldsOf(flat, 'date').slice(0, 2), ['endDate', 'dueDate']);
  assert.deepStrictEqual(order.orderedCardFieldsOf(flat, 'time'), ['pomodoro', 'spentTime', 'flowtime']);
  assert.deepStrictEqual(order.orderedCardFieldsOf(flat, 'card').slice(0, 2), ['cardSortingByNumber', 'showLists']);
  assert.ok(!flat.includes('bogus'), 'negative: unknown keys dropped');
  // Minicard: an old badge order keeps its relative order inside each section.
  const mini = order.applyMinicardOrder(['commentCount', 'cardSortingByNumber', 'dependencies', 'activities', 'comments']);
  assert.deepStrictEqual(order.orderedMinicardFieldsOf(mini, 'card').slice(0, 2), ['cardSortingByNumber', 'dependencies']);
  assert.deepStrictEqual(order.orderedMinicardFieldsOf(mini, 'comments'), ['commentCount', 'activities', 'comments']);
});

// ── the two sides are independent ──────────────────────────────────────────

test('each side has its own stored section order, read and written apart', () => {
  assert.deepStrictEqual(sections.SECTION_ORDER_FIELD, { card: 'cardSettingsSectionOrder', minicard: 'minicardSettingsSectionOrder' });
  const board = { cardSettingsSectionOrder: ['comments'], minicardSettingsSectionOrder: ['labels', 'date'] };
  assert.strictEqual(sections.sectionOrderOf(board, 'card')[0], 'comments');
  assert.deepStrictEqual(sections.sectionOrderOf(board, 'minicard').slice(0, 2), ['labels', 'date']);
  // Negative: a minicard drop leaves the card's order alone, and back.
  const mini = sections.sectionOrderAfterDrop(board.minicardSettingsSectionOrder, ['date', 'labels'], 'minicard');
  assert.deepStrictEqual(mini.slice(0, 2), ['date', 'labels']);
  assert.strictEqual(sections.sectionOrderOf({ ...board, minicardSettingsSectionOrder: mini }, 'card')[0], 'comments');
  const card = sections.sectionOrderAfterDrop(undefined, ['date', 'labels'], 'card');
  assert.deepStrictEqual(card.slice(0, 2), ['date', 'labels']);
  assert.deepStrictEqual(sections.sectionOrderOf({ cardSettingsSectionOrder: card }, 'minicard'), sections.sectionOrder(undefined, 'minicard'));
  // The setter writes the side's field only.
  const boards = read('models/boards.js');
  const setter = boards.slice(boards.indexOf('async setCardSettingsSectionOrder('), boards.indexOf('async setCardSettingsSectionShown('));
  assert.match(setter, /\[SECTION_ORDER_FIELD\[which\]\]: sectionOrder\(order, which\)/);
  assert.ok(!/\$set: \{ cardSettingsSectionOrder:/.test(setter), 'negative: never the card field for the minicard');
  assert.match(boards, /'minicardSettingsSectionOrder\.\$': \{\s*type: String/);
  // Card Settings passes the pane's side.
  const sidebar = read('client/components/sidebar/sidebar.js');
  assert.match(sidebar, /board\.setCardSettingsSectionOrder\(order, which\);/);
});

test('sectionFieldsOn lists a section\'s rows in its side\'s order, unknown sections empty (negative)', () => {
  assert.deepStrictEqual(sections.sectionFieldsOn('card', order.DEFAULT_CARD_ORDER, 'time'), ['spentTime', 'flowtime', 'pomodoro']);
  const moved = order.placeKey(undefined, 'dueDate', 0, order.CARD_LAYOUT);
  assert.strictEqual(sections.sectionFieldsOn('card', moved, 'date').filter(k => order.isMovableKey(order.CARD_LAYOUT, k))[0], 'dueDate');
  assert.deepStrictEqual(sections.sectionFieldsOn('card', order.DEFAULT_CARD_ORDER, 'nope'), []);
  assert.ok(!sections.sectionFieldsOn('minicard', order.DEFAULT_MINICARD_ORDER, 'members').includes('suggestedMembers'),
    'a row without that side is not listed');
});

// ── the templates: no field outside its section ────────────────────────────

const cardJade = read('client/components/cards/cardDetails.jade');
const templateOf = (jade, name) => jade.slice(jade.indexOf(`template(name="${name}")`)).split('\ntemplate(')[0].split('\n//-')[0];
const SECTION_TEMPLATE = id => (id === 'comments' ? 'cardCommentsSection'
  : `cardFieldSection${id.charAt(0).toUpperCase()}${id.slice(1)}`);

test('the opened card\'s loop lists exactly the Card Settings sections', () => {
  const main = templateOf(cardJade, 'cardDetails');
  const loop = main.slice(main.indexOf('each section in orderedCardFieldSections'), main.indexOf('.card-details-right'));
  const ids = [...loop.matchAll(/if \$eq section "([A-Za-z]+)"/g)].map(m => m[1]);
  assert.deepStrictEqual([...ids].sort(), [...SECTION_IDS].sort());
  assert.strictEqual(new Set(ids).size, ids.length, 'each once');
  assert.match(loop, /\.card-details-section\(data-card-section="\{\{section\}\}"/);
});

test('each section template is headed with that section\'s icon and title', () => {
  for (const s of SECTIONS) {
    const tpl = s.id === 'comments' ? templateOf(cardJade, 'cardCommentsSection') : templateOf(cardJade, SECTION_TEMPLATE(s.id));
    assert.ok(tpl.length > 30, `${SECTION_TEMPLATE(s.id)} exists`);
    // Vote and Planning Poker too: they had a heading of their own
    // (.vote-title / .poker-title) and now have the shared one, with Edit
    // voting / Edit Planning Poker as its hamburger - a deliberate change, so
    // every section of the card looks and folds the same.
    assert.ok(!/\.(vote|poker)-title/.test(tpl), `${s.id}: no heading of its own`);
    const m = tpl.match(/\+cardSectionHeader\(section="([A-Za-z]+)" icon="([a-z-]+)" label="([a-z-]+)"/);
    assert.ok(m, `${s.id}: a cardSectionHeader`);
    assert.deepStrictEqual([m[1], m[2], m[3]], [s.id, s.icon, s.labelKey], `${s.id}: Card Settings' id, icon and title`);
  }
});

test('negative: every field a section template draws is a row of THAT section', () => {
  const all = new Set();
  for (const s of SECTIONS) {
    const tpl = templateOf(cardJade, SECTION_TEMPLATE(s.id));
    const drawn = [...tpl.matchAll(/if \$eq field "([A-Za-z]+)"/g)].map(m => m[1]);
    for (const key of drawn) {
      assert.ok(s.keys.includes(key), `${key} drawn in ${s.id}, but its Card Settings section is ${(sectionOf(key) || {}).id}`);
      assert.ok(!all.has(key), `${key} drawn twice`);
      all.add(key);
    }
  }
  // Every positioned card field is drawn somewhere (but the fixed ones).
  for (const s of order.CARD_LAYOUT.sections) {
    for (const f of s.fields) {
      if (['customFields', 'vote', 'poker', 'subtasks', 'comments', 'descriptionTitle', 'descriptionText'].includes(f)) continue;
      assert.ok(all.has(f), `${f} is drawn by its section's loop`);
    }
  }
  // Nothing outside the section templates places a field (negative).
  const rest = cardJade.split(/\ntemplate\(/).filter(t => !/^name="(cardFieldSection\w+|cardCommentsSection)"/.test(t)).join('\n');
  assert.ok(!/if \$eq field "/.test(rest), 'no field branch outside a section template');
});

const miniJade = read('client/components/cards/minicard.jade');
test('the minicard: every drawn field is a minicard row, in one container kind', () => {
  const body = miniJade.slice(miniJade.indexOf('each group in minicardGroups'));
  const drawn = [...body.matchAll(/if \$eq field "([A-Za-z]+)"/g)].map(m => m[1]);
  const known = [...DATE_FIELDS, ...BADGE_FIELDS, ...BLOCK_FIELDS];
  for (const key of drawn) assert.ok(known.includes(key), `${key} has a container kind`);
  assert.strictEqual(new Set(drawn).size, drawn.length, 'each field once');
  for (const key of known) {
    if (key === 'cardKind') continue; // Story / Task, not a row (#2012)
    const row = CARD_SETTINGS_ROWS.find(r => r.key === key);
    assert.ok(row && row.minicard, `${key} is a row with a minicard side`);
    assert.ok(drawn.includes(key), `${key} is drawn`);
  }
  // No headings on the minicard (negative): it is compact.
  assert.ok(!/cardSectionHeader/.test(miniJade));
  assert.ok(!/orderedMinicardSections|\$eq section/.test(miniJade), 'the old group loop is gone');
});

console.log(`\ncardSectionsOnCard: ${passed} tests passed`);
