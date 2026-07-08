'use strict';

// Plain-Node unit test (no Meteor) for the CSV export row builder.
// Run: node tests/exporterCsvRow.test.cjs
//
// Regression guard for #5604 ("CSV export of large boards fails"): buildCsv
// resolved a card's list/swimlane/owner/members/assignees/labels/voters and
// customFields by id and immediately read .title/.username/.name/.color on the
// result of Array.find(). On large/old boards a card can point at a list,
// swimlane, user, label or customField id that no longer exists, so find()
// returned undefined and the property read threw
// "Cannot read property 'title' of undefined", crashing the export request.
// buildCsvCardRow must instead emit a blank cell for the dangling reference and
// still produce the correct cells for well-formed cards.

const assert = require('assert');
const { buildCsvCardRow, lookupProp } = require('../models/lib/exporterCsvRow');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// A fully-populated board bundle plus a customField map, matching what
// Exporter.build()/buildCsv pass in.
function makeResult() {
  return {
    lists: [{ _id: 'list1', title: 'To Do' }],
    swimlanes: [{ _id: 'sw1', title: 'Default' }],
    users: [
      { _id: 'u1', username: 'alice' },
      { _id: 'u2', username: 'bob' },
    ],
    labels: [{ _id: 'lab1', name: 'Urgent', color: 'red' }],
    customFields: [{ _id: 'cf1', type: 'text', name: 'Notes' }],
  };
}
const customFieldMap = { cf1: { position: 0, type: 'text' } };

function makeCard(overrides) {
  return Object.assign(
    {
      title: 'Card A',
      description: 'desc',
      listId: 'list1',
      swimlaneId: 'sw1',
      userId: 'u1',
      members: ['u2'],
      assignees: ['u1'],
      labelIds: ['lab1'],
      customFields: [],
      archived: false,
    },
    overrides,
  );
}

// Column indexes (see columnHeaders order in Exporter.buildCsv).
const COL = {
  title: 0,
  description: 1,
  list: 2,
  swimlane: 3,
  owner: 4,
  members: 7,
  assignee: 8,
  labels: 9,
  archived: 19,
  firstCustomField: 20,
};

// --- POSITIVE: a well-formed card yields the expected cells -------------------
test('a well-formed card resolves list/swimlane/owner/members/assignee/labels', () => {
  const row = buildCsvCardRow(makeCard(), makeResult(), customFieldMap);
  assert.strictEqual(row[COL.title], 'Card A');
  assert.strictEqual(row[COL.list], 'To Do');
  assert.strictEqual(row[COL.swimlane], 'Default');
  assert.strictEqual(row[COL.owner], 'alice');
  assert.strictEqual(row[COL.members], 'bob');
  assert.strictEqual(row[COL.assignee], 'alice');
  assert.strictEqual(row[COL.labels], 'Urgent-red');
  assert.strictEqual(row[COL.archived], 'false');
});

// --- #5604 REGRESSION GUARD: dangling references must NOT throw ---------------
test('#5604: a card referencing a deleted list exports a blank cell, no throw', () => {
  const card = makeCard({ listId: 'GONE' });
  let row;
  assert.doesNotThrow(() => {
    row = buildCsvCardRow(card, makeResult(), customFieldMap);
  });
  assert.strictEqual(row[COL.list], '');
});

test('#5604: deleted swimlane / owner / member / assignee ids all blank out', () => {
  const card = makeCard({
    swimlaneId: 'GONE',
    userId: 'GONE',
    members: ['GONE'],
    assignees: ['GONE'],
  });
  let row;
  assert.doesNotThrow(() => {
    row = buildCsvCardRow(card, makeResult(), customFieldMap);
  });
  assert.strictEqual(row[COL.swimlane], '');
  assert.strictEqual(row[COL.owner], '');
  assert.strictEqual(row[COL.members], '');
  assert.strictEqual(row[COL.assignee], '');
});

test('#5604: a card referencing a deleted label does not crash', () => {
  const card = makeCard({ labelIds: ['GONE'] });
  let row;
  assert.doesNotThrow(() => {
    row = buildCsvCardRow(card, makeResult(), customFieldMap);
  });
  assert.strictEqual(row[COL.labels], '');
});

test('#5604: a card referencing a deleted customField id does not crash', () => {
  const card = makeCard({ customFields: [{ _id: 'GONE', value: 'x' }] });
  let row;
  assert.doesNotThrow(() => {
    row = buildCsvCardRow(card, makeResult(), customFieldMap);
  });
  // No mapped position for the deleted field, so the (single) customField cell
  // stays blank rather than throwing on customFieldMap['GONE'].type.
  assert.strictEqual(row[COL.firstCustomField], ' ');
});

test('#5604: a valid text customField value still passes through', () => {
  const card = makeCard({ customFields: [{ _id: 'cf1', value: 'hello' }] });
  const row = buildCsvCardRow(card, makeResult(), customFieldMap);
  assert.strictEqual(row[COL.firstCustomField], 'hello');
});

test('#5604: voting with a deleted voter id does not crash', () => {
  const card = makeCard({
    vote: { question: 'Q?', public: true, positive: ['GONE'], negative: [] },
  });
  assert.doesNotThrow(() => {
    buildCsvCardRow(card, makeResult(), customFieldMap);
  });
});

// --- lookupProp unit behavior ------------------------------------------------
test('lookupProp returns the property for a present id and fallback otherwise', () => {
  const users = [{ _id: 'u1', username: 'alice' }];
  assert.strictEqual(lookupProp(users, 'u1', 'username'), 'alice');
  assert.strictEqual(lookupProp(users, 'nope', 'username'), '');
  assert.strictEqual(lookupProp(users, 'nope', 'username', ' '), ' ');
  assert.strictEqual(lookupProp(undefined, 'u1', 'username'), '');
});

console.log(`\n${passed} tests passed`);
