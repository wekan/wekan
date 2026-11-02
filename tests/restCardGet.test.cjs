'use strict';

// Execute the registered scoped GET handler with the real checklist serializer.
// Run: node tests/restCardGet.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { cardWithChecklists } = require('../server/lib/checklistDeadlines');

const source = fs.readFileSync(path.join(__dirname, '../server/models/cards.js'), 'utf8');
const route = '/api/boards/:boardId/lists/:listId/cards/:cardId';
const start = source.indexOf(`WebApp.handlers.get(\n  '${route}'`);
const end = source.indexOf('\n);', start) + 3;
assert.ok(start >= 0 && end > start, 'the scoped card GET route exists');

const plain = value => JSON.parse(JSON.stringify(value));

function setup(overrides = {}) {
  const card = {
    _id: 'card', boardId: 'board', listId: 'list', archived: false, title: 'Example',
    ...overrides,
  };
  const request = {
    userId: 'member', params: { boardId: 'board', listId: 'list', cardId: 'card' },
  };
  const responses = [];
  const calls = [];
  let handler;
  const context = {
    Authentication: {
      async checkBoardAccess(userId, boardId) {
        calls.push(['authorize', userId, boardId]);
      },
    },
    ReactiveCache: {
      async getCard(selector) {
        calls.push(['card', plain(selector)]);
        return Object.entries(selector).every(([key, value]) => card[key] === value)
          ? card : undefined;
      },
      async getChecklists(selector) {
        calls.push(['checklists', plain(selector)]);
        return [{ _id: 'checklist', cardId: 'card', title: 'Steps' }];
      },
      async getChecklistItems() {
        return [{ _id: 'item', title: 'First step', isFinished: false }];
      },
    },
    cardWithChecklists,
    sendJsonResult(_res, result) { responses.push(plain(result)); },
    WebApp: { handlers: { get(url, callback) {
      assert.equal(url, route);
      handler = callback;
    } } },
  };
  vm.runInNewContext(source.slice(start, end), context);
  return { card, request, responses, calls, context, run: () => handler(request, {}) };
}

test('a matching active card returns HTTP 200 with its checklists and items', async () => {
  const state = setup();
  await state.run();
  assert.deepEqual(state.calls.slice(0, 2), [
    ['authorize', 'member', 'board'],
    ['card', { _id: 'card', listId: 'list', boardId: 'board', archived: false }],
  ]);
  assert.deepEqual(state.responses, [{
    code: 200,
    data: { ...state.card, checklists: [{
      _id: 'checklist', cardId: 'card', title: 'Steps', dueAt: null,
      items: [{ _id: 'item', title: 'First step', isFinished: false, dueAt: null }],
    }] },
  }]);
});

for (const [name, params, card] of [
  ['missing card', { cardId: 'missing' }, {}],
  ['wrong list', { listId: 'other-list' }, {}],
  ['wrong board', { boardId: 'other-board' }, {}],
  ['archived card', {}, { archived: true }],
]) {
  test(`${name} returns HTTP 404 without serializing a card`, async () => {
    const state = setup(card);
    Object.assign(state.request.params, params);
    await state.run();
    assert.deepEqual(state.responses, [{ code: 404, data: { error: 'Card not found' } }]);
    assert.equal(state.calls.some(([name]) => name === 'checklists'), false);
  });
}

test('authorization is awaited before any card lookup or response', async () => {
  const state = setup();
  const denied = new Error('Forbidden');
  state.context.Authentication.checkBoardAccess = async () => { throw denied; };
  await assert.rejects(state.run(), error => error === denied);
  assert.deepEqual(state.calls, []);
  assert.deepEqual(state.responses, []);
});

test('a failed lookup does not produce a success or not-found response', async () => {
  const state = setup();
  const failure = new Error('Database unavailable');
  state.context.ReactiveCache.getCard = async () => { throw failure; };
  await assert.rejects(state.run(), error => error === failure);
  assert.deepEqual(state.responses, []);
});
