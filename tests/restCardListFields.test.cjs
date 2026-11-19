'use strict';
// #6928: the REST card lists of a list and of a swimlane carry modifiedAt,
// dateLastActivity, labelIds, members and customFields, so a syncing client
// does not need a GET per card - and an admin-only custom field's value is
// still concealed from a member who is not a board admin.
// Run: node --test tests/restCardListFields.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { restCardListItem, customFieldValues } = require('../models/lib/restCardListItem');
const { redact, containsFields } = require('../models/lib/adminOnlyCustomFields');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const modifiedAt = new Date('2026-11-19T10:00:00Z');
const dateLastActivity = new Date('2026-11-19T11:00:00Z');
const card = {
  _id: 'c1', boardId: 'b1', listId: 'l1', swimlaneId: 's1', title: 'T', description: 'D',
  sort: 2, assignees: ['u2'], modifiedAt, dateLastActivity,
  labelIds: ['lab1'], members: ['u1', 'u2'],
  customFields: [{ _id: 'secret', value: 'CLASSIFIED' }, { _id: 'open', value: 'VISIBLE' }],
  // Things a list item never carried and still does not.
  userId: 'u1', archived: false, vote: { positive: ['u3'] }, integrityHash: 'h',
};

test('a list item carries the sync fields, and its placement the URL did not fix', () => {
  const item = restCardListItem(card, 'list');
  assert.deepStrictEqual(Object.keys(item), ['_id', 'boardId', 'title', 'description', 'swimlaneId',
    'receivedAt', 'startAt', 'dueAt', 'endAt', 'assignees', 'sort',
    'modifiedAt', 'dateLastActivity', 'labelIds', 'members', 'customFields']);
  assert.strictEqual(item.modifiedAt, modifiedAt);
  assert.strictEqual(item.dateLastActivity, dateLastActivity);
  assert.deepStrictEqual(item.labelIds, ['lab1']);
  assert.deepStrictEqual(item.members, ['u1', 'u2']);
  assert.deepStrictEqual(item.customFields, card.customFields);
  const bySwimlane = restCardListItem(card, 'swimlane');
  assert.strictEqual(bySwimlane.listId, 'l1');
  assert.ok(!('swimlaneId' in bySwimlane));
  // The same fields either way, so the two routes stay alike.
  assert.deepStrictEqual(Object.keys(bySwimlane).filter(k => k !== 'listId'),
    Object.keys(item).filter(k => k !== 'swimlaneId'));
});

test('negative: nothing else of the card document is added', () => {
  const json = JSON.stringify([restCardListItem(card, 'list')]);
  for (const key of ['userId', 'archived', 'vote', 'integrityHash']) assert.ok(!json.includes(`"${key}"`), key);
  assert.deepStrictEqual(customFieldValues([{ _id: 'f', value: 1, extra: 'x' }, { _id: 'g' }, null, { value: 2 }]),
    [{ _id: 'f', value: 1 }, { _id: 'g', value: null }]);
  assert.strictEqual(customFieldValues(undefined), undefined);
  // A card without them stays as before: the fields are absent from the JSON.
  const bare = JSON.parse(JSON.stringify(restCardListItem({ _id: 'c2', boardId: 'b1', title: 'x' }, 'list')));
  assert.deepStrictEqual(Object.keys(bare), ['_id', 'boardId', 'title']);
});

test('an admin-only value is concealed from a member, shown to a board admin', () => {
  const definitions = new Map([
    // Shared by two boards: scoped by the item's own boardId, the admin of b1 reads it.
    ['secret', { _id: 'secret', adminOnly: true, boardIds: ['b1', 'b2'] }],
    ['open', { _id: 'open', adminOnly: false, boardIds: ['b1'] }],
  ]);
  const data = [restCardListItem(card, 'list'), restCardListItem(card, 'swimlane')];
  assert.ok(containsFields(data), 'sendJsonResult sends it through the redaction');
  for (const item of redact(data, definitions, new Set(), undefined)) {
    assert.deepStrictEqual(item.customFields, [{ _id: 'secret', value: null }, { _id: 'open', value: 'VISIBLE' }]);
  }
  for (const item of redact(data, definitions, new Set(['b1']), undefined)) {
    assert.deepStrictEqual(item.customFields, card.customFields);
  }
  // Negative: without its boardId the shared field would be judged by both of
  // its boards, and this board's admin would lose a value they may read.
  const { boardId, ...unscoped } = data[0];
  assert.strictEqual(redact([unscoped], definitions, new Set(['b1']), undefined)[0].customFields[0].value, null);
});

test('both routes build their items here and answer through sendJsonResult', () => {
  const src = read('server/models/cards.js');
  for (const [route, by] of [['/api/boards/:boardId/lists/:listId/cards', 'list'],
    ['/api/boards/:boardId/swimlanes/:swimlaneId/cards', 'swimlane']]) {
    const start = src.indexOf(`'${route}'`);
    assert.ok(start > 0, route);
    const body = src.slice(start, src.indexOf('\n});', start));
    assert.match(body, /await Authentication\.checkBoardAccess\(req\.userId, paramBoardId\);/, route);
    assert.match(body, /archived: false/, route);
    assert.ok(body.includes(`cards.map(doc => restCardListItem(doc, '${by}'))`), route);
    // The redaction boundary: no route writes the JSON around it.
    assert.match(body, /sendJsonResult\(res, \{/, route);
    assert.doesNotMatch(body, /writeJsonResult|res\.end\(/, route);
  }
});
