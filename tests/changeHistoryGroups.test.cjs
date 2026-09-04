'use strict';

// Guard: which changed fields become history rows, and what those rows hold.
// Run: node tests/changeHistoryGroups.test.cjs
//
// docs/Features/Reports/History/History.md §3 (the groups) and §5 (the choke
// point). Phase 5 - "roll out to every remaining group/entity" - is this table
// rather than a call per setter, because the hook that uses it also catches the
// REST API, the importers and the rules engine. None of those go through the
// client setters, so a per-setter rollout would record an edit made in the UI
// and silently miss the same edit made over the API.
//
// The risk of a table-driven diff is the opposite of the risk it removes: it can
// record TOO much. A row per `modifiedAt` bump buries the changes a person
// actually made, and a card drag reported as four separate field edits is both
// wrong in the table and unusable for undo. Most of what follows is negative.

const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const {
  groupForField, contentForField, valueFromContent, changed, diffFields,
  FIELDS_BY_ENTITY, NEVER_RECORD,
} = require(path.join(ROOT, 'models', 'lib', 'changeHistoryGroups'));

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

// ---- the groups of History.md §3 --------------------------------------------

test('every card group named in the design has a field behind it', () => {
  const wanted = {
    title: 'title',
    description: 'description',
    labelIds: 'labels',
    members: 'members',
    assignees: 'assignees',
    dueAt: 'dates',
    startAt: 'dates',
    receivedAt: 'dates',
    endAt: 'dates',
    customFields: 'customFields',
  };
  for (const [field, group] of Object.entries(wanted)) {
    assert.equal(groupForField('card', field), group,
      `card.${field} should be recorded under "${group}"`);
  }
});

test('sub-entities record under the group their card shows them in', () => {
  assert.equal(groupForField('checklist', 'title'), 'checklists');
  assert.equal(groupForField('checklistItem', 'title'), 'checklists');
  assert.equal(groupForField('checklistItem', 'isFinished'), 'checklists',
    'ticking an item is a change somebody may want back');
  assert.equal(groupForField('comment', 'text'), 'comments');
  assert.equal(groupForField('list', 'title'), 'title');
  assert.equal(groupForField('swimlane', 'title'), 'title');
});

// Negative: the noise fields. These change on almost every write, and a history
// full of them is a history nobody reads - the real changes get pushed off the
// first page by bookkeeping.
test('bookkeeping fields are never recorded (negative)', () => {
  for (const field of ['modifiedAt', 'dateLastActivity', 'createdAt', 'updatedAt']) {
    assert.equal(groupForField('card', field), null, field);
    assert.ok(NEVER_RECORD.has(field));
  }
});

// Negative, and the sharpest one. A drag changes boardId, swimlaneId, listId and
// sort together; they only mean anything as one move. Recorded as four rows the
// table is wrong and undo is unusable - one press would put back a quarter of a
// drag. Card.move records the whole move itself, so the diff must ignore these.
test('the fields of a move are excluded, so a drag is one row (negative)', () => {
  for (const field of ['boardId', 'swimlaneId', 'listId', 'sort']) {
    assert.equal(groupForField('card', field), null, field);
  }
  const changes = diffFields('card',
    { boardId: 'b1', swimlaneId: 's1', listId: 'l1', sort: 1 },
    { boardId: 'b2', swimlaneId: 's2', listId: 'l2', sort: 9 },
    ['boardId', 'swimlaneId', 'listId', 'sort']);
  assert.deepEqual(changes, [], 'a move must not also arrive as field edits');
});

test('an unknown entity or field records nothing (negative)', () => {
  assert.equal(groupForField('unicorn', 'title'), null);
  assert.equal(groupForField('card', 'somethingNobodyAdded'), null);
});

// ---- did it actually change? -------------------------------------------------

// Collection hooks fire for a write whether or not the value differs. Without
// this, saving a card form unchanged would fill the history with rows that say
// nothing changed.
test('a write that changes nothing produces no row (negative)', () => {
  assert.equal(changed('a', 'a'), false);
  assert.equal(changed(null, null), false);
  assert.equal(changed(null, undefined), false, 'both mean "not set"');
  assert.equal(changed([1, 2], [1, 2]), false);
  assert.equal(changed({ a: 1 }, { a: 1 }), false);
  const when = new Date('2026-09-04T00:00:00Z');
  assert.equal(changed(when, new Date(when.getTime())), false,
    'two Dates of the same instant are the same value');

  assert.deepEqual(
    diffFields('card', { title: 'Same' }, { title: 'Same' }, ['title']),
    []);
});

test('a real change is seen, whatever its type', () => {
  assert.equal(changed('a', 'b'), true);
  assert.equal(changed(null, 'a'), true);
  assert.equal(changed('a', null), true);
  assert.equal(changed([1], [1, 2]), true);
  assert.equal(changed(new Date(1), new Date(2)), true);
});

// ---- the change type follows the value, not the caller ----------------------

test('emptying a field is a removal, filling one is an addition', () => {
  const [added] = diffFields('card', { dueAt: null }, { dueAt: new Date(5) }, ['dueAt']);
  assert.equal(added.changeType, 'added');
  const [removed] = diffFields('card', { dueAt: new Date(5) }, { dueAt: null }, ['dueAt']);
  assert.equal(removed.changeType, 'removed');
  const [edited] = diffFields('card', { title: 'a' }, { title: 'b' }, ['title']);
  assert.equal(edited.changeType, 'edited');

  const [cleared] = diffFields('card', { labelIds: ['x'] }, { labelIds: [] }, ['labelIds']);
  assert.equal(cleared.changeType, 'removed', 'an emptied array is a removal');
});

// ---- content survives the round trip ----------------------------------------

// §9a: the snap merges two copies of a database by copying rows across, so a row
// has to mean the same thing after a JSON round trip. A Date that came back as a
// string would be written back to the card as a string.
test('a value comes back as the value it was', () => {
  const cases = [
    ['title', 'Some text'],
    ['dueComplete', true],
    ['spentTime', 42],
    ['labelIds', ['a', 'b']],
    ['customFields', [{ _id: 'f1', value: 'x' }]],
    ['description', ''],
  ];
  for (const [field, value] of cases) {
    const content = contentForField(field, value);
    assert.deepEqual(valueFromContent(content), value, field);
  }
});

test('a date survives as a date, not as a string', () => {
  const when = new Date('2026-09-04T12:34:56.000Z');
  const content = contentForField('dueAt', when);
  assert.equal(content.isDate, true);
  assert.equal(typeof content.value, 'number', 'stored as millis, so JSON keeps it');
  const back = valueFromContent(content);
  assert.ok(back instanceof Date);
  assert.equal(back.getTime(), when.getTime());
});

test('clearing a field records the null, so it can be put back', () => {
  const content = contentForField('dueAt', null);
  assert.deepEqual(content, { field: 'dueAt', value: null });
  assert.equal(valueFromContent(content), null);
});

// Negative: "not set" and "set to nothing" are different, and only the second is
// a value to restore. An undefined must not become a row that writes undefined.
test('an absent value is not content (negative)', () => {
  assert.equal(contentForField('dueAt', undefined), null);
  assert.equal(valueFromContent(null), undefined);
  assert.equal(valueFromContent({}), undefined);
  assert.equal(valueFromContent('nonsense'), undefined);
});

test('content that cannot survive the trip is dropped, not mangled (negative)', () => {
  const cyclic = { name: 'x' };
  cyclic.self = cyclic;
  assert.equal(contentForField('customFields', cyclic), null,
    'storing it would write something unrestorable back to the card');
});

// ---- the whole diff ----------------------------------------------------------

test('one save of several fields becomes one row per group', () => {
  const before = { title: 'Old', description: 'Was', labelIds: [], modifiedAt: new Date(1) };
  const after = { title: 'New', description: 'Is', labelIds: ['l1'], modifiedAt: new Date(2) };
  const changes = diffFields('card', before, after,
    ['title', 'description', 'labelIds', 'modifiedAt']);
  assert.deepEqual(changes.map(c => c.group).sort(), ['description', 'labels', 'title']);
  assert.ok(!changes.some(c => c.field === 'modifiedAt'), 'and not one for the bookkeeping');
  for (const change of changes) {
    assert.ok(change.previousContent, 'each row says what it was');
    assert.ok(change.newContent, 'and what it became');
  }
});

test('the diff is driven by the changed fields it is given', () => {
  const before = { title: 'Old', description: 'Was' };
  const after = { title: 'New', description: 'Also new' };
  // Only `title` was reported as changed, so only `title` is recorded - the hook
  // is told which fields the write touched and must not go looking for others.
  const changes = diffFields('card', before, after, ['title']);
  assert.deepEqual(changes.map(c => c.field), ['title']);
});

test('junk input produces no rows rather than throwing (negative)', () => {
  assert.deepEqual(diffFields('card', null, null, null), []);
  assert.deepEqual(diffFields(null, {}, {}, ['title']), []);
  assert.deepEqual(diffFields('card', {}, {}, ['title']), []);
});

test('the entity table covers every entity the hooks attach to', () => {
  for (const entity of ['card', 'list', 'swimlane', 'checklist', 'checklistItem', 'comment']) {
    assert.ok(FIELDS_BY_ENTITY[entity],
      `${entity} is hooked, so it needs a field table or it records nothing`);
    assert.ok(Object.keys(FIELDS_BY_ENTITY[entity]).length > 0);
  }
});

console.log(`changeHistoryGroups: ${passed} tests passed`);
