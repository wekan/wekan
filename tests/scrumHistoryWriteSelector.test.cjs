'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scrumHistoryWriteSelector: selector } = require('../server/lib/scrumHistoryWriteSelector');
test('metadata selectors capture exact Scrum state, placement and assignments without locking unrelated title edits', () => {
  const card = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane',
    title: 'Ordinary title', scrum: { issueType: 'Story' }, scrumRevision: 2, assignees: ['actor'] };
  const query = selector('card', card);
  for (const key of ['boardId', 'listId', 'swimlaneId', 'scrum', 'scrumRevision', 'assignees']) {
    assert.deepEqual(query[key], { $eq: card[key], $exists: true });
  }
  assert.equal(query.title, undefined);
  assert.equal(selector('board', { _id: 'board', scrum: {} }).boardId, undefined);
  for (const type of ['list', 'swimlane']) assert.deepEqual(selector(type, card).boardId, { $eq: 'board', $exists: true });
});
test('missing and explicit null fields remain distinct in conditional writes', () => {
  const absent = selector('card', { _id: 'card', boardId: 'board' });
  const present = selector('card', { _id: 'card', boardId: 'board', scrum: null, assignees: [], scrumRevision: 0 });
  assert.deepEqual(absent.scrum, { $exists: false });
  assert.deepEqual(present.scrum, { $eq: null, $exists: true });
  assert.deepEqual(absent.scrumRevision, { $exists: false });
  assert.deepEqual(present.scrumRevision, { $eq: 0, $exists: true });
});
test('planning writes and deletes match all captured fields and reject malformed selectors', () => {
  for (const type of ['scrum-sprint', 'scrum-release', 'scrum-event']) {
    const record = { _id: 'plan', boardId: 'board', name: 'Plan', revision: 3, updatedAt: new Date(0) };
    const query = selector(type, record);
    for (const key of Object.keys(record).filter(key => key !== '_id')) assert.deepEqual(query[key], { $eq: record[key], $exists: true });
  }
  assert.deepEqual(selector('scrum-sprint', { _id: 'plan', boardId: 'board' }).revision, { $exists: false });
  for (const [type, value] of [['unknown', { _id: 'x' }], ['card', null], ['card', { _id: 3 }],
    ['scrum-sprint', { _id: 'x', '$where': 'bad' }], ['scrum-event', { _id: 'x', 'nested.key': 'bad' }]]) {
    assert.throws(() => selector(type, value), /conflict/);
  }
});
