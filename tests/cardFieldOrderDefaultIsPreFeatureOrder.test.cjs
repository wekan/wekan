'use strict';

// The DEFAULT card and minicard field order - what a board that never touched
// Board Settings / Card renders, and what applyLayoutOrder() falls back to for
// every key a stored order does not name - is the order the opened card and
// the minicard rendered BEFORE fields became orderable at all. That order was
// read off the templates as they were right before the first field-order
// commit (#4448, `131514d61`): its parent `59f7d61df`, with
//
//   git show 59f7d61df:client/components/cards/cardDetails.jade
//   git show 59f7d61df:client/components/cards/minicard.jade
//
// and the sequences below are those two files top to bottom. The layout
// module (models/lib/cardFieldOrder.js) must produce exactly them - not an
// order somebody thought tidier, because a card that changes its shape on
// upgrade is a bug report - and the tests here pin the literal sequences so a
// reshuffle of CARD_LAYOUT or MINICARD_LAYOUT cannot pass by still agreeing
// with a template that was reshuffled with it.
//
// Two fields did not exist at 59f7d61df and sit next to their closest older
// neighbour: Text notes (card, in the fixed tail between the attachment
// count and comments, where cardDetails.jade draws it) and Swimlane name
// (minicard, last, under List name, where de4a95474 put it).
//
// Run: node tests/cardFieldOrderDefaultIsPreFeatureOrder.test.cjs

const assert = require('assert');
const {
  CARD_LAYOUT,
  MINICARD_LAYOUT,
  applyLayoutOrder,
  DEFAULT_CARD_ORDER,
  DEFAULT_MINICARD_ORDER,
  DEFAULT_CARD_FIELD_ORDER,
  applyCardOrder,
  applyMinicardOrder,
  applyCardFieldOrder,
  orderedMinicardSections,
} = require('../models/lib/cardFieldOrder');
const { rowsForSide } = require('../models/lib/cardSettingsRows');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardFieldOrderDefaultIsPreFeatureOrder:');

// cardDetails.jade at 59f7d61df, top to bottom: the title bar (Mark complete,
// card number), the cover, then `.card-details-items` - the Labels group
// (labels, stickers, location), the Dates group (received, start, due, end),
// the Members group (members, assignees, creator, requested by, assigned by),
// Dependencies, the Sort group (sort number, show lists, spent time, flowtime,
// pomodoro), Custom Fields, Vote, Planning Poker, Description (title, text) -
// then the galleries (checklists with their count badge, subtasks,
// attachments with their count) and comments in the left column and
// activities in the right one.
const PRE_FEATURE_CARD_ORDER = [
  'dueComplete', 'cardNumber', 'cover',
  'labels', 'stickers', 'location',
  'receivedDate', 'startDate', 'dueDate', 'endDate',
  'members', 'assignee', 'creator', 'requestedBy', 'assignedBy',
  'dependencies',
  'cardSortingByNumber', 'showLists', 'spentTime', 'flowtime', 'pomodoro',
  'customFields',
  'vote', 'poker',
  'descriptionTitle', 'descriptionText',
  'checklists', 'checklistCount', 'subtasks', 'attachments', 'attachmentCount',
  'textNotes', // newer than 59f7d61df: beside the attachment count, above comments
  'comments', 'activities',
];

// minicard.jade at 59f7d61df, top to bottom under the title (Mark complete,
// card number): `.dates` (received, start, due, end, spent time), cover,
// labels, custom fields, assignees, members, creator, checklists, `.badges`
// (dependencies, stickers, comment count, vote, poker, attachment count,
// subtasks, checklist count, sort number), description text, the comment
// preview, the list name.
const PRE_FEATURE_MINICARD_ORDER = [
  'dueComplete', 'cardNumber',
  'receivedDate', 'startDate', 'dueDate', 'endDate', 'spentTime',
  'cover', 'labels', 'customFields', 'assignee', 'members', 'creator', 'checklists',
  'dependencies', 'stickers', 'commentCount', 'vote', 'poker', 'attachmentCount',
  'subtasks', 'checklistCount', 'cardSortingByNumber',
  'descriptionText', 'comments', 'showLists',
  'swimlaneName', // newer than 59f7d61df: last, under the list name
];

test('the default card order is the pre-feature render order of cardDetails.jade (59f7d61df)', () => {
  assert.deepStrictEqual(DEFAULT_CARD_ORDER, PRE_FEATURE_CARD_ORDER);
  assert.deepStrictEqual(applyCardOrder(undefined), PRE_FEATURE_CARD_ORDER);
  assert.deepStrictEqual(applyCardOrder([]), PRE_FEATURE_CARD_ORDER);
  assert.deepStrictEqual(applyLayoutOrder(undefined, CARD_LAYOUT), PRE_FEATURE_CARD_ORDER);
  // And the section sequence the card's `each section in
  // orderedCardFieldSections` walks is the groups of that template in order.
  assert.deepStrictEqual(DEFAULT_CARD_FIELD_ORDER,
    ['labels', 'dates', 'members', 'dependencies', 'sort', 'customFields', 'voteAndPoker', 'description']);
  assert.deepStrictEqual(applyCardFieldOrder(undefined), DEFAULT_CARD_FIELD_ORDER);
});

test('the default minicard order is the pre-feature render order of minicard.jade (59f7d61df)', () => {
  assert.deepStrictEqual(DEFAULT_MINICARD_ORDER, PRE_FEATURE_MINICARD_ORDER);
  assert.deepStrictEqual(applyMinicardOrder(undefined), PRE_FEATURE_MINICARD_ORDER);
  assert.deepStrictEqual(applyMinicardOrder([]), PRE_FEATURE_MINICARD_ORDER);
  assert.deepStrictEqual(applyLayoutOrder(null, MINICARD_LAYOUT), PRE_FEATURE_MINICARD_ORDER);
  assert.deepStrictEqual(orderedMinicardSections(undefined),
    ['dates', 'cover', 'labels', 'customFields', 'assignee', 'members', 'creator', 'checklists',
      'badges', 'descriptionText', 'comments', 'showLists', 'swimlaneName']);
});

test('the fields newer than 59f7d61df sit beside their closest older neighbour', () => {
  assert.strictEqual(PRE_FEATURE_CARD_ORDER.indexOf('textNotes'), PRE_FEATURE_CARD_ORDER.indexOf('attachmentCount') + 1);
  assert.strictEqual(PRE_FEATURE_CARD_ORDER.indexOf('comments'), PRE_FEATURE_CARD_ORDER.indexOf('textNotes') + 1);
  assert.ok(CARD_LAYOUT.tail.includes('textNotes'), 'text notes is in the fixed tail, like the galleries around it');
  assert.strictEqual(PRE_FEATURE_MINICARD_ORDER.indexOf('swimlaneName'), PRE_FEATURE_MINICARD_ORDER.length - 1);
  assert.strictEqual(PRE_FEATURE_MINICARD_ORDER.indexOf('showLists'), PRE_FEATURE_MINICARD_ORDER.length - 2);
});

test('a stored order that names only some fields keeps the pre-feature order for the rest', () => {
  // Only Description named: it leads, everything else follows in the
  // pre-feature sequence - no section and no field changes place among the
  // unnamed ones.
  const card = applyCardOrder(['descriptionTitle']);
  const rest = PRE_FEATURE_CARD_ORDER.filter(k => !['descriptionTitle', 'descriptionText'].includes(k));
  assert.deepStrictEqual(card.filter(k => !['descriptionTitle', 'descriptionText'].includes(k)), rest);
  assert.deepStrictEqual(card.slice(3, 5), ['descriptionTitle', 'descriptionText']);
  const minicard = applyMinicardOrder(['labels']);
  assert.deepStrictEqual(minicard.filter(k => k !== 'labels'), PRE_FEATURE_MINICARD_ORDER.filter(k => k !== 'labels'));
  assert.strictEqual(minicard[2], 'labels');
});

test('Board Settings / Card lists both sides in the pre-feature order when nothing is stored', () => {
  assert.deepStrictEqual(rowsForSide('card', applyCardOrder(undefined)).map(r => r.key), PRE_FEATURE_CARD_ORDER);
  // The minicard list is the same sequence with the position-less rows
  // (Labels text and its personal override, Requested by, Assigned by, List
  // title, Description title, Attachments) tucked under the row they modify.
  const minicardRows = rowsForSide('minicard', applyMinicardOrder(undefined)).map(r => r.key);
  const positioned = minicardRows.filter(k => PRE_FEATURE_MINICARD_ORDER.includes(k));
  assert.deepStrictEqual(positioned, PRE_FEATURE_MINICARD_ORDER);
});

test('the pinned sequences are the whole layouts - nothing extra, nothing missing (negative)', () => {
  const cardKeys = [...CARD_LAYOUT.head, ...CARD_LAYOUT.sections.flatMap(s => s.fields), ...CARD_LAYOUT.tail].sort();
  assert.deepStrictEqual(PRE_FEATURE_CARD_ORDER.slice().sort(), cardKeys);
  const minicardKeys = [...MINICARD_LAYOUT.head, ...MINICARD_LAYOUT.sections.flatMap(s => s.fields), ...MINICARD_LAYOUT.tail].sort();
  assert.deepStrictEqual(PRE_FEATURE_MINICARD_ORDER.slice().sort(), minicardKeys);
  assert.strictEqual(new Set(PRE_FEATURE_CARD_ORDER).size, PRE_FEATURE_CARD_ORDER.length);
  assert.strictEqual(new Set(PRE_FEATURE_MINICARD_ORDER).size, PRE_FEATURE_MINICARD_ORDER.length);
});

console.log(`\n${passed} passed`);
