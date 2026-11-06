'use strict';

// Exercise the registered archive/restore handlers and their scoped lookups.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const base = '/api/boards/:boardId/lists/:listId/cards/:cardId';
const plain = value => JSON.parse(JSON.stringify(value));

function fixture(operation, { deny = false, refuseList = false, lookupError, mutationError } = {}) {
  const calls = [];
  const card = {
    _id: 'card', boardId: 'board', listId: 'list', archived: operation === 'unarchive',
    async archive() { calls.push(['archive']); if (mutationError) throw mutationError; this.archived = true; },
    async restore() { calls.push(['restore']); if (mutationError) throw mutationError; this.archived = false; },
  };
  const handlers = {};
  const context = {
    WebApp: { handlers: { post(url, handler) { handlers[url] = handler; } } },
    Authentication: { async checkBoardWriteAccess(userId, boardId) {
      calls.push(['access', userId, boardId]);
      if (deny) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    } },
    async assertListNotRefused(userId, board, listId) {
      calls.push(['listAccess', userId, board._id, listId]);
      if (refuseList) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    },
    ReactiveCache: {
      async getBoard(id) { calls.push(['board', id]); return { _id: id }; },
      async getCard(selector) {
        calls.push(['card', plain(selector)]);
        if (lookupError) throw lookupError;
        return Object.entries(selector).every(([key, value]) => card[key] === value) ? card : null;
      },
    },
    Meteor: { Error: class extends Error { constructor(code, reason) { super(reason); this.error = code; } } },
    sendJsonResult(res, result) { res.responses.push(plain(result)); },
  };
  const source = fs.readFileSync(path.join(__dirname, '../server/models/cards.js'), 'utf8');
  const start = source.indexOf(`WebApp.handlers.post(\n  '${base}/${operation}'`);
  assert.notEqual(start, -1);
  const end = source.indexOf('\n);', start);
  assert.ok(end > start);
  vm.runInNewContext(source.slice(start, end + '\n);'.length), context);
  return {
    calls, card,
    async post(params = {}) {
      const res = { responses: [] };
      await handlers[`${base}/${operation}`]({ userId: 'member', params: {
        boardId: 'board', listId: 'list', cardId: 'card', ...params,
      } }, res);
      assert.equal(res.responses.length, 1, 'respond exactly once');
      return res.responses[0];
    },
  };
}

for (const operation of ['archive', 'unarchive']) {
  const archived = operation === 'archive';
  test(`${operation}: a matching card uses its existing mutation helper`, async () => {
    const f = fixture(operation);
    const result = await f.post();
    assert.equal(result.code, 200);
    assert.equal(result.data._id, 'card');
    assert.equal(result.data.archived, archived);
    assert.equal(f.card.archived, archived);
    assert.deepEqual(f.calls, [
      ['access', 'member', 'board'], ['board', 'board'], ['listAccess', 'member', 'board', 'list'],
      ['card', { _id: 'card', listId: 'list', boardId: 'board', archived: !archived }],
      [archived ? 'archive' : 'restore'],
    ]);
  });

  for (const [name, params] of [
    ['missing card', { cardId: 'missing' }],
    ['wrong list', { listId: 'other-list' }],
    ['wrong board', { boardId: 'other-board' }],
    ['wrong state', {}],
  ]) {
    test(`${operation}: ${name} returns JSON 404 without mutating`, async () => {
      const f = fixture(operation);
      if (name === 'wrong state') f.card.archived = archived;
      const before = f.card.archived;
      assert.deepEqual(await f.post(params), { code: 404, data: { error: 'Card not found' } });
      assert.equal(f.card.archived, before);
      assert.ok(!f.calls.some(([name]) => name === 'archive' || name === 'restore'));
    });
  }

  test(`${operation}: board and list refusals precede the card lookup`, async () => {
    for (const options of [{ deny: true }, { refuseList: true }]) {
      const f = fixture(operation, options);
      await assert.rejects(() => f.post(), { statusCode: 403 });
      assert.ok(!f.calls.some(([name]) => ['card', 'archive', 'restore'].includes(name)));
    }
  });

  test(`${operation}: actual lookup and mutation failures are not reported as missing cards`, async () => {
    const error = new Error('database unavailable');
    for (const options of [{ lookupError: error }, { mutationError: error }]) {
      await assert.rejects(() => fixture(operation, options).post(), error);
    }
  });
}
