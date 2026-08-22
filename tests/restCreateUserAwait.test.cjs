'use strict';

// Plain-Node regression guard for POST /api/users/.
// Run: node tests/restCreateUserAwait.test.cjs
//
// Accounts.createUser returns a Promise on Meteor 3. Sending that Promise as
// `_id` serializes it as an empty object even though the user is created. The
// route must await account creation before serializing the resulting user ID.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const usersSource = fs.readFileSync(
  path.resolve(__dirname, '../server/models/users.js'),
  'utf8',
);
const routeStart = usersSource.indexOf(
  "WebApp.handlers.post('/api/users/', async function(req, res)",
);
const routeEnd = usersSource.indexOf(
  "WebApp.handlers.delete('/api/users/:userId'",
  routeStart,
);

assert.notStrictEqual(routeStart, -1, 'POST /api/users/ route must exist');
assert.notStrictEqual(routeEnd, -1, 'the user creation route must have an end');

const route = usersSource.slice(routeStart, routeEnd);

assert.match(
  route,
  /const id = await Accounts\.createUser\(\{/,
  'account creation must resolve before its result is sent as `_id`',
);
assert.match(
  route,
  /sendJsonResult\(res, \{ code: 200, data: \{ _id: id \} \}\);/,
  'the resolved user ID must be returned in the success response',
);
assert.doesNotMatch(
  route,
  /const id = Accounts\.createUser\(\{/,
  'an unawaited Promise serializes as an empty object instead of a user ID',
);

console.log('  ok - POST /api/users/ awaits and returns the created user ID');
