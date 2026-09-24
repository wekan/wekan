'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function sidebar(error, result = true) {
  const source = fs.readFileSync('client/components/sidebar/sidebar.js', 'utf8');
  const start = source.indexOf("  'click .js-member-invite-accept'()");
  const end = source.indexOf('\n});', start);
  const calls = [];
  const routes = [];
  const events = vm.runInNewContext(`({${source.slice(start, end)}})`, {
    Session: { get: () => 'invited-board' },
    ReactiveCache: { getCurrentUser() { throw Error('direct invitation write'); } },
    Meteor: { call(method, boardId, callback) {
      calls.push([method, boardId]);
      if (callback) callback(error, result);
    } },
    FlowRouter: { go: route => routes.push(route) },
  });
  return { events, calls, routes };
}

test('#6692: sidebar acceptance uses the invitation-checked server method', () => {
  const f = sidebar();
  f.events['click .js-member-invite-accept']();
  assert.deepEqual(f.calls, [['acceptInvite', 'invited-board']]);
});
test('#6692: decline clears the invitation server-side and then navigates home', () => {
  const f = sidebar();
  f.events['click .js-member-invite-decline']();
  assert.deepEqual(f.calls, [['quitBoard', 'invited-board']]);
  assert.deepEqual(f.routes, ['home']);
});
test('failed or refused decline does not navigate or mutate the profile', () => {
  for (const f of [sidebar(Error('denied')), sidebar(null, false)]) {
    f.events['click .js-member-invite-decline']();
    assert.deepEqual(f.routes, []);
  }
});
test('signed-out login uses the configured provider without a forbidden subscription', async () => {
  const source = fs.readFileSync('client/components/main/layouts.js', 'utf8');
  const start = source.indexOf('function getUserAuthenticationMethod(');
  const lookup = vm.runInNewContext(`${source.slice(start)}; getUserAuthenticationMethod`, {
    Meteor: { userId: () => null, subscribe() { throw Error('unexpected subscription'); } },
  });
  assert.equal(await lookup('ldap', 'alice'), 'ldap');
  assert.equal(await lookup('password', 'alice'), 'password');
  assert.equal(await lookup(undefined, 'alice'), undefined);
});

test('acceptInvite consumes only a real invitation for the authenticated user', async () => {
  const source = fs.readFileSync('server/models/boards.js', 'utf8');
  const start = source.indexOf('  async acceptInvite(boardId)');
  const end = source.indexOf('\n  async myLabelNames()', start);
  const plans = require('../models/lib/boardInvites');
  for (const [userId, invited, expected] of [['alice', true, true], ['alice', false, false], [null, true, 'error-notAuthorized']]) {
    const writes = [];
    const method = vm.runInNewContext(`({${source.slice(start, end)}}).acceptInvite`, {
      check() {}, ...plans,
      Meteor: { Error: class extends Error {}, users: { async updateAsync(id, modifier) { writes.push({ id, modifier }); } } },
      ReactiveCache: { async getBoard() { return {}; }, async getUser(id) {
        assert.equal(id, 'alice');
        return { profile: { invitedBoards: invited ? ['board'] : [] } };
      } },
      Boards: { async updateAsync(selector, modifier) { writes.push({ selector, modifier }); } },
    });
    if (!userId) await assert.rejects(method.call({ userId }, 'board'), /error-notAuthorized/);
    else assert.equal(await method.call({ userId }, 'board'), expected);
    assert.equal(writes.length, expected === true ? 2 : 0);
    if (expected === true) {
      assert.equal(writes[0].id, 'alice');
      assert.equal(writes[0].modifier.$pull['profile.invitedBoards'], 'board');
      assert.equal(writes[1].selector['members.userId'], 'alice');
    }
  }
});
