'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { publicErrorData } = require('../server/lib/apiResponseHelpers');

const source = fs.readFileSync(path.join(__dirname, '../server/models/users.js'), 'utf8');
const start = source.indexOf("WebApp.handlers.put('/api/users/:userId'");
const end = source.indexOf("WebApp.handlers.post('/api/boards/:boardId/members/:userId/add'", start);
assert.ok(start >= 0 && end > start);
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({ missing = false, denied = false, boards = [] } = {}) {
  const calls = [];
  let handler;
  vm.runInNewContext(source.slice(start, end), {
    WebApp: { handlers: { put(route, callback) { handler = callback; } } },
    Authentication: { async checkUserId(userId) {
      calls.push(['authorize', userId]);
      if (denied) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    } },
    ReactiveCache: {
      async getUser() { calls.push(['user']); return missing ? null : { _id: 'target' }; },
      async getBoards(selector, options) {
        calls.push(['boards', plain(selector), plain(options)]);
        // Require both criteria on ONE member. The live suite exercises this
        // query against MongoDB with a different administrator on the board.
        assert.deepEqual(plain(selector), { members: { $elemMatch: { userId: 'target', isAdmin: true } } });
        return boards;
      },
    },
    publicErrorData,
    sendJsonResult(res, result) { res.responses.push(plain(result)); },
  });
  return { calls, async put() {
    const res = { responses: [] };
    await handler({ userId: 'admin', params: { userId: 'target' }, body: { action: 'takeOwnership' } }, res);
    assert.equal(res.responses.length, 1);
    return res.responses[0];
  } };
}

test('ownership selection binds the user and administrator flag to the same member', async () => {
  const f = fixture();
  assert.deepEqual(await f.put(), { code: 200, data: [] });
  assert.deepEqual(f.calls, [
    ['authorize', 'admin'], ['user'],
    ['boards', { members: { $elemMatch: { userId: 'target', isAdmin: true } } }, { sort: { sort: 1 } }],
  ]);
});

test('selected boards retain the existing ownership helper and response format', async () => {
  const calls = [];
  const board = {
    _id: 'owned', title: 'Owned board',
    hasMember(id) { calls.push(['hasMember', id]); return false; },
    async changeOwnership(from, to) { calls.push(['changeOwnership', from, to]); },
  };
  const f = fixture({ boards: [board] });
  assert.deepEqual(await f.put(), { code: 200, data: [{ _id: 'owned', title: 'Owned board' }] });
  assert.deepEqual(calls, [['hasMember', 'admin'], ['changeOwnership', 'target', 'admin']]);
});

test('denied callers and missing users do not select boards', async () => {
  for (const [options, code] of [[{ denied: true }, 403], [{ missing: true }, 404]]) {
    const f = fixture(options);
    assert.equal((await f.put()).code, code);
    assert.ok(!f.calls.some(([name]) => name === 'boards'));
  }
});
