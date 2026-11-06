'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const route = '/api/boards/:boardId/lists/:listId/cards/:cardId';
const plain = value => JSON.parse(JSON.stringify(value));

async function fixture() {
  const { normalizeMoveParams, parseCardScalarFields } = await import('../server/lib/restCardHelpers.js');
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
    parseCardScalarFields,
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

// A form-encoded client sends '0'; it is written as the number 0, the type
// every other sort value has, so ordering compares numbers with numbers.
for (const [sort, written] of [[0, 0], [5, 5], [-1, -1], [0.5, 0.5], ['0', 0], [' 2.5 ', 2.5]]) {
  test(`card PUT writes sort ${JSON.stringify(sort)} through the scoped update`, async () => {
    const f = await fixture();
    assert.deepEqual(await f.put({ sort }), { code: 200, data: { _id: 'card' } });
    assert.deepEqual(f.writes, [{
      selector: { _id: 'card', listId: 'list', boardId: 'board', archived: false },
      modifier: { $set: { sort: written } },
    }]);
  });
}

// Negative: since presence, not truthiness, decides, a value that is not a
// number would otherwise be written as the card's position.
for (const sort of [null, '', 'abc', true, {}, [], 'Infinity', Number.NaN]) {
  test(`card PUT refuses sort ${JSON.stringify(sort)} with 400 and writes nothing`, async () => {
    const f = await fixture();
    assert.deepEqual(await f.put({ sort, title: 'Renamed' }), { code: 400, data: { error: 'Invalid sort' } });
    assert.deepEqual(f.writes, [], 'not even the valid title: the edit is refused whole');
  });
}

for (const [isOverTime, written] of [[false, false], ['false', false], [true, true], ['true', true]]) {
  test(`card PUT stores isOverTime ${JSON.stringify(isOverTime)} in the schema's isOvertime field`, async () => {
    const f = await fixture();
    assert.equal((await f.put({ isOverTime })).code, 200);
    // The API spelling differs from the schema and UI. Checking only the
    // request spelling allowed successful responses with no persisted change.
    assert.deepEqual(f.writes, [{
      selector: { _id: 'card', listId: 'list', boardId: 'board', archived: false },
      modifier: { $set: { isOvertime: written } },
    }]);
  });
}

for (const isOverTime of [null, 0, 'yes', {}]) {
  test(`card PUT refuses isOverTime ${JSON.stringify(isOverTime)} with 400`, async () => {
    const f = await fixture();
    assert.deepEqual(await f.put({ isOverTime, title: 'Renamed' }), { code: 400, data: { error: 'Invalid isOverTime' } });
    assert.deepEqual(f.writes, []);
  });
}

for (const [description, written] of [['', ''], [null, ''], ['New text', 'New text']]) {
  test(`card PUT writes description ${JSON.stringify(description)}`, async () => {
    const f = await fixture();
    assert.equal((await f.put({ description })).code, 200);
    assert.deepEqual(f.writes.map(w => w.modifier), [{ $set: { description: written } }]);
  });
}

for (const description of [5, {}, ['x']]) {
  test(`card PUT refuses description ${JSON.stringify(description)} with 400`, async () => {
    const f = await fixture();
    assert.deepEqual(await f.put({ description }), { code: 400, data: { error: 'Invalid description' } });
    assert.deepEqual(f.writes, []);
  });
}

// Every field of this handler that can be legitimately falsy goes through the
// presence check; none is read with a bare `if (req.body.<field>)` again.
test('sort, isOverTime and description are not read by truthiness', () => {
  const source = fs.readFileSync(path.join(__dirname, '../server/models/cards.js'), 'utf8');
  const start = source.indexOf(`WebApp.handlers.put(\n  '${route}'`);
  const body = source.slice(start, source.indexOf('\n);', start));
  for (const field of ['sort', 'isOverTime', 'description']) {
    assert.ok(!new RegExp(`if \\(req\\.body\\.${field}\\)`).test(body), field);
    assert.ok(new RegExp(`'${field}' in scalars\\.set`).test(body), `${field} uses the parsed value`);
  }
});

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
