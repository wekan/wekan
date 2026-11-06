'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const route = '/api/boards/:boardId/lists/:listId/cards/:cardId';
const plain = value => JSON.parse(JSON.stringify(value));

async function fixture() {
  const { normalizeMoveParams } = await import('../server/lib/restCardHelpers.js');
  const writes = [];
  const card = { _id: 'card', boardId: 'board', listId: 'list', archived: false, sort: 5 };
  let handler;
  const source = fs.readFileSync(path.join(__dirname, '../server/models/cards.js'), 'utf8');
  const start = source.indexOf(`WebApp.handlers.put(\n  '${route}'`);
  assert.notEqual(start, -1);
  const end = source.indexOf('\n);', start);
  assert.ok(end > start);
  vm.runInNewContext(source.slice(start, end + '\n);'.length), {
    WebApp: { handlers: { put(url, fn) { assert.equal(url, route); handler = fn; } } },
    normalizeMoveParams,
    Authentication: { async checkBoardWriteAccess(userId) {
      if (userId !== 'member') throw new Error('Forbidden');
    } },
    async assertListNotRefused() {},
    ReactiveCache: { async getBoard() { return { _id: 'board' }; } },
    Cards: {
      async findOneAsync(selector) {
        if (typeof selector === 'string') return { ...card };
        return Object.entries(selector).every(([key, value]) => card[key] === value) ? { ...card } : null;
      },
      direct: { async updateAsync(selector, modifier) { writes.push(plain({ selector, modifier })); } },
    },
    require(name) {
      assert.equal(name, '/server/models/changeHistoryHooks');
      return { async recordUpdate() {} };
    },
    sendJsonResult(res, result) { res.push(plain(result)); },
    process: { env: {} },
  });
  return {
    writes,
    async put(body, { userId = 'member', ...params } = {}) {
      const responses = [];
      await handler({ userId, body, params: { boardId: 'board', listId: 'list', cardId: 'card', ...params } }, responses);
      assert.equal(responses.length, 1);
      return responses[0];
    },
  };
}

for (const sort of [0, 5, -1, 0.5, '0']) {
  test(`card PUT writes sort ${JSON.stringify(sort)} through the scoped update`, async () => {
    const f = await fixture();
    assert.deepEqual(await f.put({ sort }), { code: 200, data: { _id: 'card' } });
    assert.deepEqual(f.writes, [{
      selector: { _id: 'card', listId: 'list', boardId: 'board', archived: false },
      modifier: { $set: { sort } },
    }]);
  });
}

test('an omitted sort does not overwrite the position during another edit', async () => {
  const f = await fixture();
  assert.equal((await f.put({ title: 'Renamed' })).code, 200);
  assert.deepEqual(f.writes.map(write => write.modifier), [{ $set: { title: 'Renamed' } }]);
});

test('an empty edit keeps the existing no-update response and does not write', async () => {
  const f = await fixture();
  assert.equal((await f.put({})).code, 404);
  assert.deepEqual(f.writes, []);
});

for (const params of [{ cardId: 'missing' }, { listId: 'other-list' }, { boardId: 'other-board' }]) {
  test(`sort zero does not update a card outside ${JSON.stringify(params)}`, async () => {
    const f = await fixture();
    assert.deepEqual(await f.put({ sort: 0 }, params), { code: 404, data: { error: 'Card not found' } });
    assert.deepEqual(f.writes, []);
  });
}

test('sort zero still requires board write access', async () => {
  const f = await fixture();
  await assert.rejects(f.put({ sort: 0 }, { userId: 'outsider' }), /Forbidden/);
  assert.deepEqual(f.writes, []);
});
