'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const route = '/api/boards/:boardId/lists/:listId/cards';

function fixture() {
  const inserts = [];
  const checkedParents = [];
  let handler;
  const source = fs.readFileSync(path.join(__dirname, '../server/models/cards.js'), 'utf8');
  const start = source.indexOf(`WebApp.handlers.post('${route}'`);
  assert.notEqual(start, -1);
  const end = source.indexOf('\n});', start);
  assert.ok(end > start);
  const board = { async getNextCardNumber() { return 1; } };
  vm.runInNewContext(source.slice(start, end + '\n});'.length), {
    WebApp: { handlers: { post(url, fn) { assert.equal(url, route); handler = fn; } } },
    Authentication: {
      checkLoggedIn(userId) { if (!userId) throw new Error('Unauthorized'); },
      async checkAdminOrCondition(userId) { if (userId !== 'member') throw new Error('Forbidden'); },
    },
    allowIsBoardMemberWithWriteAccess() { return true; },
    async assertListNotRefused() {},
    async assertParentCardIsVisible(userId, parentId) {
      checkedParents.push(parentId);
      if (parentId === 'missing') throw new Error('Parent card not found');
      if (parentId === 'private') throw new Error('Forbidden parent');
    },
    async restPlacementError() { return null; },
    ReactiveCache: {
      async getBoard() { return board; },
      async getCards() { return []; },
      async getCustomFields() { return []; },
      async getUser() { return { _id: 'member' }; },
      async getCard() { return inserts[0]; },
    },
    Cards: { direct: { async insertAsync(doc) { inserts.push(doc); return 'child'; } } },
    sendJsonResult(res, result) { res.result = result; },
    noteAuthorSpoof() {},
    async cardCreation() {},
  });
  return {
    inserts, checkedParents,
    async post(body, userId = 'member') {
      const res = {};
      await handler({ userId, params: { boardId: 'board', listId: 'list' }, body: { title: 'Child', ...body } }, res);
      return JSON.parse(JSON.stringify(res.result));
    },
  };
}

test('single-card POST validates and stores the parent from the body', async () => {
  const f = fixture();
  assert.deepEqual(await f.post({ parentId: 'parent' }), { code: 200, data: { _id: 'child' } });
  assert.deepEqual(f.checkedParents, ['parent']);
  assert.equal(f.inserts[0].parentId, 'parent');
});

for (const parentId of [undefined, '', null]) {
  test(`single-card POST still accepts no parent (${JSON.stringify(parentId)})`, async () => {
    const f = fixture();
    assert.equal((await f.post(parentId === undefined ? {} : { parentId })).code, 200);
    assert.equal(f.inserts.length, 1);
    assert.equal(f.inserts[0].parentId, parentId);
  });
}

for (const parentId of [0, false, true, 42, {}, [], { _id: 'parent' }]) {
  test(`single-card POST refuses a non-string parent (${JSON.stringify(parentId)}) before lookup`, async () => {
    const f = fixture();
    assert.deepEqual(await f.post({ parentId }), { code: 400, data: { error: 'Invalid parentId' } });
    assert.equal(f.checkedParents.length, 0);
    assert.equal(f.inserts.length, 0);
  });
}

for (const [parentId, error] of [['missing', /Parent card not found/], ['private', /Forbidden parent/]]) {
  test(`single-card POST refuses a ${parentId} parent before inserting`, async () => {
    const f = fixture();
    await assert.rejects(f.post({ parentId }), error);
    assert.equal(f.inserts.length, 0);
  });
}

for (const userId of [null, 'outsider']) {
  test(`single-card POST still requires write access (${userId})`, async () => {
    const f = fixture();
    await assert.rejects(f.post({ parentId: 'parent' }, userId), /Unauthorized|Forbidden/);
    assert.equal(f.inserts.length, 0);
  });
}
