'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { publicErrorData } = require('../server/lib/apiResponseHelpers');

const source = fs.readFileSync(path.join(__dirname, '../server/models/users.js'), 'utf8');
const start = source.indexOf("WebApp.handlers.post('/api/deletetoken'");
const end = source.indexOf('const sanitizeUserForSearch', start);
assert.ok(start >= 0 && end > start, 'the token deletion route is present');
const hash = token => crypto.createHash('sha256').update(token).digest('base64');
const raw = () => crypto.randomBytes(24).toString('base64url');
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({ denied, failure, waitForWrite } = {}) {
  const issued = raw();
  const other = raw();
  const users = {
    target: [{ hashedToken: hash(issued) }, { hashedToken: hash(other) }],
    unrelated: [{ hashedToken: hash(issued) }],
  };
  const calls = [];
  let handler;
  vm.runInNewContext(source.slice(start, end), {
    WebApp: { handlers: { post(route, callback) {
      assert.equal(route, '/api/deletetoken');
      handler = callback;
    } } },
    Authentication: { async checkUserId(userId) {
      calls.push('authorize');
      if (denied) throw Object.assign(new Error('Denied'), { statusCode: denied });
    } },
    check(value, type) {
      assert.equal(type.name, 'String');
      if (typeof value !== 'string') throw Object.assign(new Error('Invalid string'), { statusCode: 400 });
    },
    Accounts: {
      // Meteor compares its argument directly to stored hashedToken/token fields.
      async destroyToken(id, token) {
        calls.push('destroy');
        if (waitForWrite && users[id]?.some(entry => entry.hashedToken === token || entry.token === token)) {
          await waitForWrite;
        }
        if (failure) throw failure;
        if (users[id]) users[id] = users[id].filter(entry => entry.hashedToken !== token && entry.token !== token);
      },
    },
    Users: { async updateAsync(selector, modifier) {
      calls.push('clear');
      assert.deepEqual(plain(modifier), { $set: { 'services.resume.loginTokens': [] } });
      users[selector._id] = [];
    } },
    publicErrorData,
    sendJsonResult(res, result) { calls.push('respond'); res.responses.push(plain(result)); },
  });
  return {
    issued, other, users, calls,
    async remove(body) {
      const res = { responses: [] };
      await handler({ userId: 'admin', body }, res);
      assert.equal(res.responses.length, 1);
      return res.responses[0];
    },
  };
}

test('deletes the supplied stored hash without clearing other sessions or users', async () => {
  const f = fixture();
  const unrelated = plain(f.users.unrelated);
  assert.equal((await f.remove({ userId: 'target', token: hash(f.issued) })).code, 200);
  assert.deepEqual(f.users.target, [{ hashedToken: hash(f.other) }]);
  assert.deepEqual(f.users.unrelated, unrelated);
  assert.deepEqual(f.calls, ['authorize', 'destroy', 'respond']);
});

test('does not acknowledge until token deletion has completed', async () => {
  let release;
  const waitForWrite = new Promise(resolve => { release = resolve; });
  const f = fixture({ waitForWrite });
  const pending = f.remove({ userId: 'target', token: hash(f.issued) });
  await new Promise(resolve => setImmediate(resolve));
  try {
    assert.deepEqual(f.calls, ['authorize', 'destroy']);
  } finally {
    release();
  }
  assert.equal((await pending).code, 200);
  assert.deepEqual(f.users.target, [{ hashedToken: hash(f.other) }]);
});

test('deletion failures return a sanitized error instead of success', async () => {
  const f = fixture({ failure: new Error('private database diagnostic') });
  const before = plain(f.users);
  assert.deepEqual(await f.remove({ userId: 'target', token: hash(f.issued) }), {
    code: 500, data: { error: 'Internal server error' },
  });
  assert.deepEqual(f.users, before);
});

for (const denied of [401, 403]) {
  test(`authorization failure ${denied} cannot delete tokens`, async () => {
    const f = fixture({ denied });
    const before = plain(f.users);
    assert.equal((await f.remove({ userId: 'target', token: hash(f.issued) })).code, denied);
    assert.deepEqual(f.calls, ['authorize', 'respond']);
    assert.deepEqual(f.users, before);
  });
}

test('supplying an original token does not add implicit hashing', async () => {
  const f = fixture();
  const before = plain(f.users);
  assert.equal((await f.remove({ userId: 'target', token: f.issued })).code, 200);
  assert.deepEqual(f.users, before);
});

test('unknown tokens are harmless and omitting a token still clears all target sessions', async () => {
  const f = fixture();
  const before = plain(f.users);
  assert.equal((await f.remove({ userId: 'target', token: raw() })).code, 200);
  assert.deepEqual(f.users, before);
  assert.equal((await f.remove({ userId: 'target' })).code, 200);
  assert.deepEqual(f.users.target, []);
  assert.deepEqual(f.users.unrelated, before.unrelated);
});
