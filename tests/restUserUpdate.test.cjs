'use strict';

// Execute the registered user PUT handler; Playwright covers real persistence
// and the People page against a running server.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { publicErrorData } = require('../server/lib/apiResponseHelpers');

const source = fs.readFileSync(path.join(__dirname, '../server/models/users.js'), 'utf8');
const start = source.indexOf("WebApp.handlers.put('/api/users/:userId'");
const end = source.indexOf("WebApp.handlers.post('/api/boards/:boardId/members/:userId/add'", start);
assert.ok(start >= 0 && end > start, 'the user PUT route is present');
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({ missing, denied, lookupError } = {}) {
  const calls = [];
  const document = {
    _id: 'user', username: 'test-user', loginDisabled: false,
    services: { resume: { loginTokens: [{ hashedToken: 'secret' }] } },
    sessionData: { private: true },
  };
  let handler;
  const context = {
    WebApp: { handlers: { put(route, callback) {
      assert.equal(route, '/api/users/:userId');
      handler = callback;
    } } },
    Authentication: { async checkUserId(userId) {
      await Promise.resolve();
      calls.push(['authorize', userId]);
      if (denied) throw Object.assign(new Error('Denied'), { statusCode: denied });
    } },
    ReactiveCache: {
      async getUser(selector) {
        calls.push(['lookup', plain(selector)]);
        if (lookupError) throw lookupError;
        return missing ? missing.value : plain(document);
      },
      async getBoards() { calls.push(['boards']); return []; },
    },
    Users: { async updateAsync(selector, modifier) {
      calls.push(['update', plain(selector), plain(modifier)]);
      document.loginDisabled = modifier.$set.loginDisabled;
      if (modifier.$set['services.resume.loginTokens']) document.services.resume.loginTokens = [];
      return 1;
    } },
    publicErrorData,
    sendJsonResult(res, result) { res.responses.push(plain(result)); },
  };
  const secretsStart = source.indexOf('function withoutSecrets(');
  const secretsEnd = source.indexOf("WebApp.handlers.get('/api/users/:userId'", secretsStart);
  vm.runInNewContext(source.slice(secretsStart, secretsEnd) + source.slice(start, end), context);
  return {
    calls, document,
    async put(action, id = 'user', userId = 'admin') {
      const res = { responses: [] };
      await handler({ userId, params: { userId: id }, body: { action } }, res);
      assert.equal(res.responses.length, 1, 'respond exactly once');
      return res.responses[0];
    },
  };
}

for (const value of [undefined, null]) {
  for (const action of ['disableLogin', 'enableLogin', 'takeOwnership', undefined]) {
    test(`missing user (${value}) returns 404 for ${action || 'no action'} without side effects`, async () => {
      const f = fixture({ missing: { value } });
      const before = plain(f.document);
      assert.deepEqual(await f.put(action, 'missing'), { code: 404, data: { error: 'User not found' } });
      assert.deepEqual(f.calls, [['authorize', 'admin'], ['lookup', { _id: 'missing' }]]);
      assert.deepEqual(f.document, before);
    });
  }
}

test('existing users can be disabled and enabled with sanitized responses', async () => {
  const f = fixture();
  for (const [action, disabled] of [['disableLogin', true], ['enableLogin', false]]) {
    assert.deepEqual(await f.put(action), {
      code: 200, data: { _id: 'user', username: 'test-user', loginDisabled: disabled },
    });
    assert.equal(f.document.loginDisabled, disabled);
    assert.deepEqual(f.document.services.resume.loginTokens, []);
  }
});

test('self-disable and an empty action keep their existing no-op behavior', async () => {
  const f = fixture();
  for (const action of ['disableLogin', undefined]) {
    const response = await f.put(action, 'user', 'user');
    assert.equal(response.code, 200);
    assert.equal(response.data.loginDisabled, false);
  }
  assert.ok(!f.calls.some(([name]) => name === 'update'));
});

test('ownership of an existing user with no boards still returns an empty list', async () => {
  const f = fixture();
  assert.deepEqual(await f.put('takeOwnership'), { code: 200, data: [] });
  assert.ok(f.calls.some(([name]) => name === 'boards'));
});

test('authentication and admin authorization finish before the target lookup', async () => {
  for (const denied of [401, 403]) {
    for (const id of ['user', 'missing']) {
      const f = fixture({ denied });
      assert.equal((await f.put('disableLogin', id)).code, denied);
      assert.deepEqual(f.calls, [['authorize', 'admin']]);
    }
  }
});

test('a database failure remains a sanitized server error', async () => {
  const f = fixture({ lookupError: new Error('database unavailable') });
  assert.deepEqual(await f.put('disableLogin'), {
    code: 500, data: { error: 'Internal server error' },
  });
  assert.ok(!f.calls.some(([name]) => name === 'update' || name === 'boards'));
});
