'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync('server/routes/universalFileServer.js', 'utf8');
const resolver = source.slice(source.indexOf('  async function getUserFromToken('), source.indexOf('  /**\n   * Authorization helper'));
const guard = source.slice(source.indexOf('  async function isAuthorizedForBoard('), source.indexOf('  /**\n   * Helper function to properly encode'));
const board = { isVisibleBy: user => user?._id === 'member' };
function policy(user) {
  return vm.runInNewContext(`${resolver}\n${guard}\nisAuthorizedForBoard`, {
    Meteor: { users: { async findOneAsync(query, options) {
      assert.equal(query['services.resume.loginTokens.hashedToken'], 'hashed:valid-token-123');
      const result = {};
      if (!user) return null;
      for (const key of Object.keys(options.fields)) result[key] = user[key];
      return result;
    } } },
    Accounts: { _hashLoginToken: token => `hashed:${token}` },
    extractLoginToken: req => req.token,
    isSandstormRequest: () => false,
    canReadBoard: (id, value) => !!value?.isVisibleBy(id ? { _id: id } : null),
    process: { env: {} },
  });
}
test('Files Report administrator can read another member’s private attachment', async () => {
  assert.equal(await policy({ _id: 'admin', isAdmin: true })({ token: 'valid-token-123' }, board), true);
});
test('ordinary private-board access still requires membership', async () => {
  for (const [user, expected] of [[{ _id: 'member' }, true], [{ _id: 'outsider' }, false], [null, false]]) {
    assert.equal(await policy(user)({ token: 'valid-token-123' }, board), expected);
  }
});
test('missing credentials, disabled admin, non-boolean admin and missing board do not grant access', async () => {
  assert.equal(await policy({ _id: 'admin', isAdmin: true })({}, board), false);
  assert.equal(await policy({ _id: 'admin', isAdmin: true })({ token: 'short' }, board), false);
  for (const user of [{ _id: 'admin', isAdmin: true, loginDisabled: true }, { _id: 'outsider', isAdmin: 'true' }]) {
    assert.equal(await policy(user)({ token: 'valid-token-123' }, board), false);
  }
  assert.equal(await policy({ _id: 'admin', isAdmin: true })({ token: 'valid-token-123' }, null), false);
});
test('public attachments remain readable without credentials', async () => {
  assert.equal(await policy(null)({}, { isVisibleBy: () => true }), true);
});
