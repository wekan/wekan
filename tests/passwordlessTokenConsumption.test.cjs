'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { consumePasswordlessToken } = require('../server/lib/passwordlessTokenConsumption.cjs');
const user = { _id: 'alice', emails: [{ address: 'alice@example.invalid' }], services: { passwordless: { token: 'validated-generation' } } };
test('consumes the validated generation and verifies the selected email without positional selectors', async () => {
  let call;
  assert.equal(await consumePasswordlessToken(user, { email: 'alice@example.invalid' }, { updateOne: async (...args) => { call = args; return { modifiedCount: 1 }; } }), true);
  assert.deepEqual(call, [{ _id: 'alice', 'services.passwordless.token': 'validated-generation' }, { $unset: { 'services.passwordless': '' }, $set: { 'emails.0.verified': true } }]);
});
test('replay or replacement during login fails closed', async () => {
  assert.equal(await consumePasswordlessToken(user, { id: 'alice' }, { updateOne: async () => ({ modifiedCount: 0 }) }), false);
});
test('an already-consumed upstream token needs no database write', async () => {
  assert.equal(await consumePasswordlessToken({ _id: 'alice', services: {} }, {}, { updateOne: () => { throw Error('unexpected write'); } }), true);
});
test('unknown email and database failures cannot produce a successful consumption', async () => {
  const collection = { updateOne: async () => { throw Error('database unavailable'); } };
  assert.equal(await consumePasswordlessToken(user, { email: 'other@example.invalid' }, collection), false);
  await assert.rejects(consumePasswordlessToken(user, { id: 'alice' }, collection), /database unavailable/);
});
