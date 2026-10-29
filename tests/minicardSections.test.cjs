'use strict';

// The minicard draws Card Settings' sections in the board's Show on Minicard
// section order, each section's fields in its Show on Minicard row order -
// with no headings - and what shares a container still shares one: dates in
// one `.dates` line, badges in one `.badges` strip, also across a section
// boundary (models/lib/minicardGroups.js, 2026-10-28).
// Run: node tests/minicardSections.test.cjs

const assert = require('assert');
const { minicardGroups, kindOf, DATE_FIELDS, BADGE_FIELDS, BLOCK_FIELDS } = require('../models/lib/minicardGroups');
const sections = require('../models/lib/cardSettingsSections');
const order = require('../models/lib/cardFieldOrder');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('minicardSections:');

const shape = groups => groups.map(g => [g.kind, g.fields]);

test('the kinds do not overlap', () => {
  const all = [...DATE_FIELDS, ...BADGE_FIELDS, ...BLOCK_FIELDS];
  assert.strictEqual(new Set(all).size, all.length);
  assert.strictEqual(kindOf('dueDate'), 'dates');
  assert.strictEqual(kindOf('vote'), 'badges');
  assert.strictEqual(kindOf('members'), 'block');
});

test('Date and Time make ONE dates line, as Spent time always shared the dates\'', () => {
  const groups = minicardGroups(['date', 'time'], id => ({ date: ['receivedDate', 'dueDate'], time: ['spentTime'] })[id]);
  assert.deepStrictEqual(shape(groups), [['dates', ['receivedDate', 'dueDate', 'spentTime']]]);
  assert.deepStrictEqual(groups[0].sections, ['date', 'time']);
  assert.strictEqual(groups[0].dates, true);
});

test('badges of consecutive sections are one strip', () => {
  const groups = minicardGroups(['vote', 'poker', 'subtasks'], id => ({ vote: ['vote'], poker: ['poker'], subtasks: ['subtasks'] })[id]);
  assert.deepStrictEqual(shape(groups), [['badges', ['vote', 'poker', 'subtasks']]]);
  assert.strictEqual(groups[0].badges, true);
});

test('a block between two badges splits the strip, in the order of the rows', () => {
  const groups = minicardGroups(['comments'], () => ['commentCount', 'comments', 'activities']);
  assert.deepStrictEqual(shape(groups), [['badges', ['commentCount']], ['block', ['comments', 'activities']]]);
  // Blocks of two sections are two groups (negative: a block group is one section's).
  const blocks = minicardGroups(['labels', 'members'], id => ({ labels: ['labels'], members: ['members'] })[id]);
  assert.strictEqual(blocks.length, 2);
});

test('the Story / Task badge is the first of the Scrum section', () => {
  const groups = minicardGroups(['scrum'], () => ['scrumSprint', 'scrumIssueType']);
  assert.deepStrictEqual(shape(groups), [['badges', ['cardKind']], ['block', ['scrumSprint']], ['badges', ['scrumIssueType']]]);
  // Negative: not in any other section.
  assert.ok(!minicardGroups(['labels'], () => ['labels']).some(g => g.fields.includes('cardKind')));
});

test('negative: modifier, title-row and unknown keys are not drawn', () => {
  const groups = minicardGroups(['labels', 'card'], id => ({
    labels: ['cardColor', 'labels', 'labelText', 'labelsAboveTitle'],
    card: ['collapse', 'cardNumber', 'linkedCard', 'parentCard', 'listTitle', 'similarCards', 'bogus'],
  })[id]);
  assert.deepStrictEqual(shape(groups), [['block', ['labels']]]);
  assert.deepStrictEqual(minicardGroups(null, null), []);
  assert.deepStrictEqual(minicardGroups(['date'], () => null), []);
});

test('a board that never set an order: the default groups keep the minicard compact', () => {
  const flat = order.applyMinicardOrder(undefined);
  const ids = sections.sectionOrder(undefined, 'minicard');
  const groups = minicardGroups(ids, id => sections.sectionFieldsOn('minicard', flat, id));
  // One dates line, with At risk and Forecast in it, the spent time last.
  const dates = groups.filter(g => g.dates);
  assert.strictEqual(dates.length, 1, 'one dates line');
  assert.deepStrictEqual(dates[0].fields, ['receivedDate', 'startDate', 'dueDate', 'atRisk', 'forecast', 'endDate', 'spentTime']);
  // Every minicard field with an element is drawn exactly once.
  const drawn = groups.flatMap(g => g.fields);
  assert.strictEqual(new Set(drawn).size, drawn.length);
  for (const key of [...DATE_FIELDS, ...BADGE_FIELDS, ...BLOCK_FIELDS]) assert.ok(drawn.includes(key), key);
  // Ids are unique, for Blaze to keep the elements.
  assert.strictEqual(new Set(groups.map(g => g._id)).size, groups.length);
});

test('a dragged minicard section moves its fields, the card is untouched (negative)', () => {
  const flat = order.applyMinicardOrder(undefined);
  const ids = sections.sectionOrderAfterDrop(undefined, ['description', ...sections.sectionOrder(undefined, 'minicard').filter(id => id !== 'description')], 'minicard');
  const groups = minicardGroups(ids, id => sections.sectionFieldsOn('minicard', flat, id));
  assert.deepStrictEqual(groups[0].fields, ['descriptionText']);
  assert.strictEqual(sections.sectionOrder(undefined, 'card')[0], 'labels', 'the opened card keeps its own order');
});

console.log(`\nminicardSections: ${passed} tests passed`);
