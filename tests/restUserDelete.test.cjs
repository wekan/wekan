'use strict';

// DELETE /api/users/:userId used to discard removeAsync's result and echo the
// requested id even when no user matched. Execute the actual registered route
// with controlled collaborators to pin both responses and the authorization
// boundary without requiring a running Meteor server.
//
// Run: node tests/restUserDelete.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const usersSource = fs.readFileSync(
  path.join(repoRoot, 'server/models/users.js'),
  'utf8',
);

const routeStart = usersSource.indexOf(
  "WebApp.handlers.delete('/api/users/:userId'",
);
const routeEnd = usersSource.indexOf(
  "WebApp.handlers.post('/api/createtoken/:userId'",
  routeStart,
);

assert.ok(routeStart >= 0, 'the user DELETE route is present');
assert.ok(routeEnd > routeStart, 'the route ends before create-token');

let handler;
const responses = [];
let checkUserId;
let removeAsync;

const context = {
  Authentication: {
    checkUserId: userId => checkUserId(userId),
  },
  Meteor: {
    users: {
      removeAsync: selector => removeAsync(selector),
    },
  },
  WebApp: {
    handlers: {
      delete(route, callback) {
        assert.strictEqual(route, '/api/users/:userId');
        handler = callback;
      },
    },
  },
  publicErrorData(error) {
    return { code: error.statusCode || 500, data: error };
  },
  sendJsonResult(_res, response) {
    responses.push(response);
  },
};

vm.createContext(context);
vm.runInContext(usersSource.slice(routeStart, routeEnd), context, {
  filename: 'server/models/users.js#delete-user',
});
assert.strictEqual(typeof handler, 'function', 'the user DELETE handler registered');

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log('  ok -', name);
}

function reset() {
  responses.length = 0;
}

function jsonValue(value) {
  return JSON.parse(JSON.stringify(value));
}

(async () => {
  await test('one removed user returns the confirmed id with HTTP 200', async () => {
    reset();
    checkUserId = async userId => assert.strictEqual(userId, 'admin-id');
    removeAsync = async selector => {
      assert.deepStrictEqual(jsonValue(selector), { _id: 'existing-user' });
      return 1;
    };

    await handler(
      { userId: 'admin-id', params: { userId: 'existing-user' } },
      {},
    );

    assert.deepStrictEqual(jsonValue(responses), [
      { code: 200, data: { _id: 'existing-user' } },
    ]);
  });

  await test('a nonexistent user returns a deterministic HTTP 404', async () => {
    reset();
    checkUserId = async () => {};
    removeAsync = async () => 0;

    await handler(
      { userId: 'admin-id', params: { userId: 'missing-user' } },
      {},
    );

    assert.deepStrictEqual(jsonValue(responses), [
      { code: 404, data: { error: 'User not found' } },
    ]);
  });

  await test('an unexpected removal count is not reported as success', async () => {
    reset();
    checkUserId = async () => {};
    removeAsync = async () => 2;

    await handler(
      { userId: 'admin-id', params: { userId: 'ambiguous-user' } },
      {},
    );

    assert.deepStrictEqual(jsonValue(responses), [
      { code: 404, data: { error: 'User not found' } },
    ]);
  });

  await test('authorization is checked before removal', async () => {
    reset();
    const denied = new Error('Forbidden');
    denied.statusCode = 403;
    checkUserId = async () => {
      throw denied;
    };
    removeAsync = async () => {
      assert.fail('an unauthorized request must not reach removeAsync');
    };

    await handler(
      { userId: 'non-admin-id', params: { userId: 'existing-user' } },
      {},
    );

    assert.deepStrictEqual(responses, [{ code: 403, data: denied }]);
  });

  console.log(`\n${passed} tests passed`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
