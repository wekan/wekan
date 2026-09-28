'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { inferListEntry, listEntryBackfillSelector } = require('../models/lib/cardListEntryHistory');
const card = { _id: 'card', boardId: 'board', listId: 'done' };
const at = new Date('2026-09-28T12:00:00Z');
const date = day => new Date(`2026-09-${String(day).padStart(2, '0')}T12:00:00Z`);
const move = (day, from, to, extra = {}) => ({ cardId: 'card', activityType: 'moveCard',
  createdAt: date(day), boardId: 'board', oldListId: from, listId: to, ...extra });
const create = { cardId: 'card', activityType: 'createCard', boardId: 'board', listId: 'todo', createdAt: date(1) };

test('creation and repeated moves establish the latest continuous stay, ignoring same-list swimlane moves', () => {
  assert.deepEqual(inferListEntry({ ...card, listId: 'todo' }, [create], at), date(1));
  const events = [create, move(2, 'todo', 'done'), move(3, 'done', 'todo'), move(4, 'todo', 'done'), move(5, 'done', 'done')];
  assert.deepEqual(inferListEntry(card, events.reverse(), at), date(4));
  assert.deepEqual(inferListEntry(card, [move(4, 'todo', 'done')], at), date(4));
  assert.equal(inferListEntry(card, [move(5, 'done', 'done')], at), null);
});
test('cross-board moves without a destination list stay unknown until a later list entry', () => {
  const crossing = { cardId: 'card', activityType: 'moveCardBoard', oldBoardId: 'other', boardId: 'board', createdAt: date(2) };
  assert.equal(inferListEntry(card, [crossing], at), null);
  assert.equal(inferListEntry(card, [crossing, move(3, 'done', 'done')], at), null);
  assert.deepEqual(inferListEntry(card, [crossing, move(3, 'todo', 'done')], at), date(3));
  assert.deepEqual(inferListEntry(card, [{ ...crossing, listId: 'done' }], at), date(2));
});
test('missing, conflicting, out-of-order and malformed evidence is never replaced by a card date', () => {
  const cases = [[], [create], [move(2, 'todo', 'done'), move(3, 'unrelated', 'done')],
    [move(2, 'todo', 'done'), move(3, 'done', 'todo')],
    [move(2, 'todo', 'done', { cardId: 'foreign' })],
    [move(2, 'todo', 'done', { boardId: 'foreign' })],
    [move(2, 'todo', 'done', { oldListId: undefined })],
    [move(2, 'todo', 'done', { createdAt: new Date('bad') })],
    [move(29, 'todo', 'done')], [move(2, 'todo', 'done'), move(2, 'done', 'todo')],
    [create, { ...create, createdAt: date(3) }],
    [create, { cardId: 'card', activityType: 'moveCardBoard', createdAt: date(2), oldBoardId: 'foreign', boardId: 'board', listId: 'done' }]];
  for (const events of cases) assert.equal(inferListEntry({ ...card, createdAt: date(1), dateLastActivity: date(5) }, events, at), null);
});
test('the conditional write binds placement, timestamp absence and observed edit timestamps', () => {
  const selector = listEntryBackfillSelector({ ...card, modifiedAt: date(4), dateLastActivity: null });
  assert.deepEqual(selector, { ...card, listEnteredAt: { $exists: false },
    modifiedAt: { $eq: date(4), $exists: true }, dateLastActivity: { $eq: null, $exists: true } });
  assert.deepEqual(listEntryBackfillSelector({ ...card, listEnteredAt: null }).listEnteredAt, { $eq: null, $exists: true });
});
