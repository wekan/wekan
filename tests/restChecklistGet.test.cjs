'use strict';

// A missing or incorrectly scoped checklist is a 404, not a server
// error. Exercise the registered GET handler, including its parent and access
// checks, without starting Meteor.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { checklistWithItems } = require('../server/lib/checklistDeadlines');

const route = '/api/boards/:boardId/cards/:cardId/checklists/:checklistId';
const missing = { code: 404, data: { error: 'Checklist not found or does not belong to the specified card' } };
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({ deny = false, lookupError } = {}) {
  const calls = [];
  const cards = [
    { _id: 'card', boardId: 'board' },
    { _id: 'other-card', boardId: 'board' },
    { _id: 'private-card', boardId: 'private-board' },
  ];
  const checklists = [
    { _id: 'checklist', cardId: 'card', title: 'Steps', dueAt: '2026-11-04T10:00:00.000Z' },
    { _id: 'private-checklist', cardId: 'private-card', title: 'Private steps' },
  ];
  const items = [{ _id: 'item', checklistId: 'checklist', cardId: 'card', title: 'First step', isFinished: false }];
  const matches = (doc, selector) => Object.entries(selector).every(([key, value]) => doc[key] === value);
  const find = (name, docs) => async selector => {
    calls.push([name, plain(selector)]);
    if (lookupError && name === 'checklist') throw lookupError;
    return docs.find(doc => matches(doc, selector));
  };
  let handler;
  const context = {
    WebApp: { handlers: Object.fromEntries(['get', 'post', 'put', 'delete'].map(verb => [verb, (url, fn) => {
      if (verb === 'get' && url === route) handler = fn;
    }])) },
    Authentication: { async checkBoardAccess(userId, boardId) {
      calls.push(['access', userId, boardId]);
      if (deny || boardId !== 'board') throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    } },
    ReactiveCache: {
      getCard: find('card', cards),
      getChecklist: find('checklist', checklists),
      async getChecklistItems(selector) {
        calls.push(['items', plain(selector)]);
        return items.filter(doc => matches(doc, selector));
      },
    },
    checklistWithItems,
    sendJsonResult(res, result) { res.responses.push(plain(result)); },
  };
  const source = fs.readFileSync(path.join(__dirname, '../server/models/checklists.js'), 'utf8');
  vm.runInNewContext(source.slice(source.indexOf('WebApp.handlers.get(')), context);
  assert.equal(typeof handler, 'function');
  return {
    calls,
    async get(params = {}) {
      const res = { responses: [] };
      await handler({ userId: 'member', params: { boardId: 'board', cardId: 'card', checklistId: 'checklist', ...params } }, res);
      assert.equal(res.responses.length, 1, 'respond exactly once');
      return res.responses[0];
    },
  };
}

test('a valid checklist retains its title, deadline and items', async () => {
  const f = fixture();
  assert.deepEqual(await f.get(), { code: 200, data: {
    _id: 'checklist', cardId: 'card', title: 'Steps', dueAt: '2026-11-04T10:00:00.000Z',
    items: [{ _id: 'item', title: 'First step', isFinished: false, dueAt: null }],
  } });
  assert.deepEqual(f.calls, [
    ['access', 'member', 'board'],
    ['card', { _id: 'card', boardId: 'board' }],
    ['checklist', { _id: 'checklist', cardId: 'card' }],
    ['items', { checklistId: 'checklist', cardId: 'card' }],
  ]);
});

for (const [name, params] of [
  ['missing checklist', { checklistId: 'missing' }],
  ['checklist of another card on the same board', { cardId: 'other-card' }],
  ['checklist of another board', { checklistId: 'private-checklist' }],
]) {
  test(`${name} returns a descriptive 404 without loading items`, async () => {
    const f = fixture();
    assert.deepEqual(await f.get(params), missing);
    assert.ok(!f.calls.some(([name]) => name === 'items'));
  });
}

for (const cardId of ['missing-card', 'private-card']) {
  test(`${cardId} fails the parent check before looking up the checklist`, async () => {
    const f = fixture();
    assert.deepEqual(await f.get({ cardId }), { code: 404, data: { error: 'Card not found or does not belong to the specified board' } });
    assert.ok(!f.calls.some(([name]) => name === 'checklist' || name === 'items'));
  });
}

test('access denial precedes every lookup for existing and missing checklists', async () => {
  for (const checklistId of ['checklist', 'missing']) {
    const f = fixture({ deny: true });
    await assert.rejects(() => f.get({ checklistId }), { statusCode: 403 });
    assert.deepEqual(f.calls, [['access', 'member', 'board']]);
  }
});

test('an actual lookup failure propagates instead of becoming a false 404', async () => {
  const error = new Error('database unavailable');
  await assert.rejects(() => fixture({ lookupError: error }).get(), error);
});
