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
  // Newer than 59f7d61df: the Scrum block, drawn after the description, made
  // one row per field ("Scrum settings: Sprint" ...) on 2026-10-02.
  'scrumSprint', 'scrumPastSprints', 'scrumRelease', 'scrumIssueType', 'scrumAcceptanceCriteria', 'scrumBacklogRank',
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
  // Newer than 59f7d61df: the Scrum block, drawn first under the title, made
  // one row per field on 2026-10-02; the work item type is a badge below.
  'scrumSprint', 'scrumPastSprints', 'scrumRelease', 'scrumAcceptanceCriteria', 'scrumBacklogRank',
  'receivedDate', 'startDate', 'dueDate', 'endDate', 'spentTime',
  'cover', 'labels', 'customFields', 'assignee', 'members', 'creator', 'checklists',
  'scrumIssueType', // newer than 59f7d61df: the work item type badge, first in the strip
  'dependencies', 'stickers', 'commentCount', 'vote', 'poker', 'attachmentCount',
  'subtasks', 'checklistCount', 'cardSortingByNumber',
  'descriptionText', 'comments', 'showLists',
  'swimlaneName', // newer than 59f7d61df: last, under the list name
  // Newer than 59f7d61df: what the opened card showed and the minicard did not,
  // given a minicard side on 2026-10-02 - last, after everything drawn before.
  'location', 'requestedBy', 'assignedBy', 'flowtime', 'pomodoro', 'attachments', 'textNotes', 'activities',
];

// 2026-10-28: THE DEFAULT IS GROUPED BY CARD SETTINGS' SECTIONS. The opened
// card and the minicard draw Card Settings' sections now (models/lib
// /cardSettingsSections.js), so the default flat order is those sections, each
// holding its fields in the pre-feature order above - the two sequences are
// kept as the reference the default is checked against: inside every section
// the fields keep exactly the relative order they had at 59f7d61df. Which
// section comes first is the board's section order of that side
// (cardSettingsSectionOrder / minicardSettingsSectionOrder), so the sections'
// own order in the flat array is no longer what a surface draws.
const CARD_ORDER_BY_SECTION = [
  'dueComplete', 'cardNumber', 'cover',
  'labels', 'stickers', 'location',
  'receivedDate', 'startDate', 'dueDate', 'endDate',
  'members', 'assignee', 'creator', 'requestedBy', 'assignedBy',
  // Card: the old Dependencies section and the first half of Sort, then the
  // card buttons and the similar cards, which have a place of their own in
  // Card since 2026-10-28.
  'dependencies', 'cardSortingByNumber', 'showLists', 'cardButtons', 'similarCards',
  // Time: the second half of Sort.
  'spentTime', 'flowtime', 'pomodoro',
  'customFields', 'vote', 'poker',
  'descriptionTitle', 'descriptionText',
  'scrumSprint', 'scrumPastSprints', 'scrumRelease', 'scrumIssueType', 'scrumAcceptanceCriteria', 'scrumBacklogRank',
  // The old fixed tail, as sections. The checklist count was DRAWN above the
  // checklists (cardDetails.jade), which is the place it keeps.
  'checklistCount', 'checklists', 'subtasks', 'attachments', 'textNotes', 'comments',
  // Fixed: the count on the Attachments heading, the right column.
  'attachmentCount', 'activities',
];
const MINICARD_ORDER_BY_SECTION = [
  'dueComplete', 'cardNumber', 'cover',
  'scrumSprint', 'scrumPastSprints', 'scrumRelease', 'scrumAcceptanceCriteria', 'scrumBacklogRank', 'scrumIssueType',
  'receivedDate', 'startDate', 'dueDate', 'endDate',
  'spentTime', 'flowtime', 'pomodoro',
  'labels', 'stickers', 'location',
  'customFields',
  'assignee', 'members', 'creator', 'requestedBy', 'assignedBy',
  'checklists', 'checklistCount',
  'dependencies', 'cardSortingByNumber', 'showLists', 'swimlaneName',
  'commentCount', 'comments', 'activities',
  'vote', 'poker',
  'attachmentCount', 'attachments', 'textNotes',
  'subtasks',
  'descriptionText',
];

// Inside each section of `layout`, the fields keep the relative order of
// `reference` (the pre-feature render order), except `exceptions` pairs.
function keepsRelativeOrder(layout, reference, exceptions = []) {
  layout.sections.forEach(section => {
    const inRef = section.fields.filter(k => reference.includes(k));
    const sorted = inRef.slice().sort((a, b) => reference.indexOf(a) - reference.indexOf(b));
    exceptions.forEach(([x, y]) => {
      if (sorted.includes(x) && sorted.includes(y)) {
        sorted.splice(sorted.indexOf(x), 1);
        sorted.splice(sorted.indexOf(y), 0, x);
      }
    });
    assert.deepStrictEqual(inRef, sorted, `section ${section.key} keeps the pre-feature order`);
  });
}

test('the default card order is Card Settings\' sections, each in the pre-feature order of cardDetails.jade (59f7d61df)', () => {
  assert.deepStrictEqual(DEFAULT_CARD_ORDER, CARD_ORDER_BY_SECTION);
  assert.deepStrictEqual(applyCardOrder(undefined), CARD_ORDER_BY_SECTION);
  assert.deepStrictEqual(applyCardOrder([]), CARD_ORDER_BY_SECTION);
  assert.deepStrictEqual(applyLayoutOrder(undefined, CARD_LAYOUT), CARD_ORDER_BY_SECTION);
  assert.deepStrictEqual(DEFAULT_CARD_FIELD_ORDER,
    ['labels', 'date', 'members', 'card', 'time', 'customFields', 'vote', 'poker', 'description',
      'scrum', 'checklists', 'subtasks', 'attachments', 'comments']);
  assert.deepStrictEqual(applyCardFieldOrder(undefined), DEFAULT_CARD_FIELD_ORDER);
  // The checklist count moved above the checklists, where it was drawn.
  keepsRelativeOrder(CARD_LAYOUT, PRE_FEATURE_CARD_ORDER, [['checklistCount', 'checklists']]);
});

test('the default minicard order is Card Settings\' sections, each in the pre-feature order of minicard.jade (59f7d61df)', () => {
  assert.deepStrictEqual(DEFAULT_MINICARD_ORDER, MINICARD_ORDER_BY_SECTION);
  assert.deepStrictEqual(applyMinicardOrder(undefined), MINICARD_ORDER_BY_SECTION);
  assert.deepStrictEqual(applyMinicardOrder([]), MINICARD_ORDER_BY_SECTION);
  assert.deepStrictEqual(applyLayoutOrder(null, MINICARD_LAYOUT), MINICARD_ORDER_BY_SECTION);
  assert.deepStrictEqual(orderedMinicardSections(undefined),
    ['scrum', 'date', 'time', 'labels', 'customFields', 'members', 'checklists', 'card', 'comments',
      'vote', 'poker', 'attachments', 'subtasks', 'description']);
  keepsRelativeOrder(MINICARD_LAYOUT, PRE_FEATURE_MINICARD_ORDER);
});

test('the default section order of each side starts where its surface started (labels on the card)', () => {
  const { sectionOrder } = require('../models/lib/cardSettingsSections');
  assert.strictEqual(sectionOrder(undefined, 'card')[0], 'labels');
  // The minicard's first section is the one of its first field (the Scrum
  // blocks), then the dates line.
  assert.deepStrictEqual(sectionOrder(undefined, 'minicard').slice(0, 3), ['scrum', 'date', 'time']);
});

test('the fields newer than 59f7d61df sit beside their closest older neighbour', () => {
  assert.strictEqual(PRE_FEATURE_CARD_ORDER.indexOf('textNotes'), PRE_FEATURE_CARD_ORDER.indexOf('attachmentCount') + 1);
  // Since 2026-10-28 Text notes is a field of Attachments, after the gallery.
  const attachments = CARD_LAYOUT.sections.find(s => s.key === 'attachments');
  assert.deepStrictEqual(attachments.fields, ['attachments', 'textNotes']);
  assert.strictEqual(PRE_FEATURE_MINICARD_ORDER.indexOf('swimlaneName'), PRE_FEATURE_MINICARD_ORDER.length - 9);
  assert.strictEqual(PRE_FEATURE_MINICARD_ORDER.indexOf('showLists'), PRE_FEATURE_MINICARD_ORDER.length - 10);
  // ... and in Card, right after the list name.
  const card = MINICARD_LAYOUT.sections.find(s => s.key === 'card');
  assert.strictEqual(card.fields.indexOf('swimlaneName'), card.fields.indexOf('showLists') + 1);
});

test('a stored order that names only some fields keeps the default order for the rest', () => {
  // Only Description named: its section leads the flat order, everything
  // else follows in the default sequence.
  const card = applyCardOrder(['descriptionTitle']);
  const rest = CARD_ORDER_BY_SECTION.filter(k => !['descriptionTitle', 'descriptionText'].includes(k));
  assert.deepStrictEqual(card.filter(k => !['descriptionTitle', 'descriptionText'].includes(k)), rest);
  assert.deepStrictEqual(card.slice(3, 5), ['descriptionTitle', 'descriptionText']);
  const minicard = applyMinicardOrder(['stickers']);
  // Stickers leads Labels; the section moves up, its other fields follow it.
  assert.deepStrictEqual(minicard.slice(3, 6), ['stickers', 'labels', 'location']);
});

test('Board Settings / Card lists both sides in the default order when nothing is stored', () => {
  assert.deepStrictEqual(rowsForSide('card', applyCardOrder(undefined)).filter(r => !r.card.after).map(r => r.key), CARD_ORDER_BY_SECTION);
  const minicardRows = rowsForSide('minicard', applyMinicardOrder(undefined)).map(r => r.key);
  const positioned = minicardRows.filter(k => MINICARD_ORDER_BY_SECTION.includes(k));
  assert.deepStrictEqual(positioned, MINICARD_ORDER_BY_SECTION);
});

test('the pinned sequences are the whole layouts - nothing extra, nothing missing (negative)', () => {
  const cardKeys = [...CARD_LAYOUT.head, ...CARD_LAYOUT.sections.flatMap(s => s.fields), ...CARD_LAYOUT.tail].sort();
  assert.deepStrictEqual(CARD_ORDER_BY_SECTION.slice().sort(), cardKeys);
  const minicardKeys = [...MINICARD_LAYOUT.head, ...MINICARD_LAYOUT.sections.flatMap(s => s.fields), ...MINICARD_LAYOUT.tail].sort();
  assert.deepStrictEqual(MINICARD_ORDER_BY_SECTION.slice().sort(), minicardKeys);
  assert.strictEqual(new Set(CARD_ORDER_BY_SECTION).size, CARD_ORDER_BY_SECTION.length);
  assert.strictEqual(new Set(MINICARD_ORDER_BY_SECTION).size, MINICARD_ORDER_BY_SECTION.length);
  // Every field of the pre-feature renders is still in its layout.
  PRE_FEATURE_CARD_ORDER.forEach(k => assert.ok(cardKeys.includes(k), k));
  PRE_FEATURE_MINICARD_ORDER.forEach(k => assert.ok(minicardKeys.includes(k), k));
});

console.log(`\n${passed} passed`);
