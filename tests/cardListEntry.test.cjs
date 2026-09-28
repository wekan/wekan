'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { stampCardListEntry } = require('../models/lib/cardListEntry');
const old = new Date('2026-01-01T00:00:00Z');
const at = new Date('2026-09-28T12:00:00Z');
const card = { boardId: 'board', listId: 'list', swimlaneId: 'lane', listEnteredAt: old };

test('entering another column or board gets the server timestamp in the same modifier', () => {
  for (const set of [{ listId: 'other' }, { boardId: 'other' }, { boardId: 'other', listId: 'other' }]) {
    const modifier = { $set: { ...set, listEnteredAt: old }, $unset: { listEnteredAt: '' } };
    stampCardListEntry(card, modifier, at);
    assert.deepEqual(modifier.$set, { ...set, listEnteredAt: at });
    assert.deepEqual(modifier.$unset, {});
  }
  assert.equal(card.listEnteredAt, old);
});
test('sorting, editing, archiving, swimlane changes and no-op moves do not reset column age', () => {
  for (const set of [{ sort: 42 }, { title: 'Title' }, { description: 'Note' }, { archived: true },
    { swimlaneId: 'another' }, { boardId: 'board', listId: 'list' }, { dateLastActivity: at }]) {
    const modifier = { $set: { ...set } };
    stampCardListEntry(card, modifier, at);
    assert.deepEqual(modifier.$set, set);
  }
});
test('ordinary updates cannot rewrite or remove the derived date', () => {
  const modifier = { $set: { title: 'New', listEnteredAt: old }, $unset: { listEnteredAt: '', description: '' } };
  stampCardListEntry(card, modifier, at);
  assert.deepEqual(modifier, { $set: { title: 'New' }, $unset: { description: '' } });
});
test('legacy unknown age stays unknown until a real column change', () => {
  const legacy = { boardId: 'board', listId: 'list' };
  const unchanged = { $set: { title: 'New' } };
  stampCardListEntry(legacy, unchanged, at);
  assert.equal(unchanged.$set.listEnteredAt, undefined);
  const moved = { $set: { listId: 'new' } };
  stampCardListEntry(legacy, moved, at);
  assert.equal(moved.$set.listEnteredAt, at);
});
test('missing or replacement modifiers are not misinterpreted as a move', () => {
  for (const modifier of [null, {}, { listId: 'replacement' }, { $unset: { listId: '' } }]) {
    const before = structuredClone(modifier);
    stampCardListEntry(card, modifier, at);
    assert.deepEqual(modifier, before);
  }
  assert.throws(() => stampCardListEntry(card, { $set: { listId: 'new' } }, new Date('bad')), /Invalid list entry date/);
});

test('rolling cutoff is strict, bounded, and keeps other lists and unknown dates visible', () => {
  const { columnAgeSelector } = require('../models/lib/cardListEntry');
  assert.deepEqual(columnAgeSelector('list', 30, at), { $or: [
    { listId: { $ne: 'list' } }, { listEnteredAt: null },
    { listEnteredAt: { $gte: new Date(at.getTime() - 30 * 86400000) } },
  ] });
  for (const days of [0, -1, 1.5, Infinity, NaN, 365001, '30']) assert.deepEqual(columnAgeSelector('list', days, at), {});
  assert.deepEqual(columnAgeSelector('', 30, at), {});
});

test('real Filter combines age with existing filters and releases its clock on reset or board switch', async () => {
  const { register } = require('node:module');
  const { pathToFileURL } = require('node:url');
  const path = require('node:path');
  register(pathToFileURL(path.join(__dirname, 'helpers/meteorStubLoader.mjs')), pathToFileURL(__filename));
  const { Filter } = await import('../client/lib/filter.js');
  const { timers } = await import('meteor/meteor');
  Filter.reset();
  assert.equal(Filter.columnAge.set('list', 30), true);
  assert.equal(Filter.isActive(), true);
  assert.equal(timers.size, 1);
  assert.equal(Filter.columnAge.set('list', 0), false);
  assert.equal(Filter.columnAge.value().days, 30);
  Filter.title.set('urgent');
  const query = Filter.mongoSelector({ boardId: 'board' });
  assert.ok(query.$and[0].$and[0].$or.some(row => row.title));
  assert.equal(query.$and[0].$and[1].$or[0].listId.$ne, 'list');
  Filter.resetBoardScoped();
  assert.equal(Filter.columnAge._isActive(), false);
  assert.equal(Filter.title.value(), 'urgent');
  assert.equal(timers.size, 0);
  Filter.columnAge.set('other', 15);
  Filter.reset();
  assert.equal(Filter.isActive(), false);
  assert.equal(timers.size, 0);
});
