'use strict';
// Member menu / Edit Profile: with Admin Panel / People / Login "Username change"
// allowed, a member's new username is saved - as setEmail beside it already does
// for the e-mail address - and without it (or for somebody else's account) the
// method refuses instead of returning quietly, so the popup does not close as if
// it had saved. The methods are run here, with the collections stubbed.
// Run: node --test tests/selfUsernameChange.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'server/models/users.js'), 'utf8');
const slice = (from, to) => {
  const start = src.indexOf(from);
  assert.ok(start > 0, from);
  return src.slice(start, src.indexOf(to, start));
};
const methodsText = slice('  async setUsername(username, userId) {', '  async setEmail(email, userId) {')
  + slice('  async setUsernameAndEmail(', '  async setPassword(');

class MeteorError extends Error {
  constructor(error) { super(error); this.error = error; }
}

function world({ admin = false, allowUserName = false, allowEmail = false, taken = [] } = {}) {
  const updates = [];
  const calls = [];
  const settings = {
    'accounts-allowUserNameChange': { booleanValue: allowUserName },
    'accounts-allowEmailChange': { booleanValue: allowEmail },
  };
  const deps = {
    check() {},
    ReactiveCache: {
      async getCurrentUser() { return { _id: 'me', isAdmin: admin }; },
      async getUsers({ username }) { return taken.includes(username) ? [{ _id: 'other' }] : []; },
    },
    Users: { async updateAsync(id, mod) { updates.push([id, mod]); } },
    AccountSettings: { async findOneAsync(id) { return settings[id]; } },
  };
  let methods;
  deps.Meteor = {
    Error: MeteorError,
    async callAsync(name, ...args) {
      calls.push(name);
      if (name === 'setUsername') return methods.setUsername.call(invocation, ...args);
      return undefined; // setEmail has its own tests (profileEmailMissing).
    },
  };
  const invocation = { userId: 'me' };
  methods = new Function(...Object.keys(deps), `return {\n${methodsText}\n};`)(...Object.values(deps));
  const run = (name, ...args) => methods[name].call(invocation, ...args);
  return { run, updates, calls };
}

test('a member saves their own new username when the setting allows it', async () => {
  const w = world({ allowUserName: true });
  await w.run('setUsername', 'newname', 'me');
  assert.deepStrictEqual(w.updates, [['me', { $set: { username: 'newname' } }]]);
});

test('negative: refused, not ignored, without the setting or for another account', async () => {
  for (const [opts, userId] of [[{}, 'me'], [{ allowUserName: true }, 'someoneElse']]) {
    const w = world(opts);
    await assert.rejects(w.run('setUsername', 'newname', userId), e => e.error === 'not-authorized');
    assert.deepStrictEqual(w.updates, []);
  }
  // Taken and empty usernames are refused for a member too.
  const taken = world({ allowUserName: true, taken: ['admin'] });
  await assert.rejects(taken.run('setUsername', 'admin', 'me'), e => e.error === 'username-already-taken');
  await assert.rejects(taken.run('setUsername', '   ', 'me'), e => e.error === 'invalid-username');
  assert.deepStrictEqual(taken.updates, []);
});

test('a site admin still renames any account, setting or not', async () => {
  const w = world({ admin: true });
  await w.run('setUsername', 'renamed', 'someoneElse');
  assert.deepStrictEqual(w.updates, [['someoneElse', { $set: { username: 'renamed' } }]]);
});

test('username and e-mail together need both changes allowed', async () => {
  const both = world({ allowUserName: true, allowEmail: true });
  await both.run('setUsernameAndEmail', 'n2', 'n2@example.com', 'me');
  assert.deepStrictEqual(both.calls, ['setUsername', 'setEmail']);
  for (const opts of [{ allowUserName: true }, { allowEmail: true }, {}]) {
    const w = world(opts);
    await assert.rejects(w.run('setUsernameAndEmail', 'n2', 'n2@example.com', 'me'), e => e.error === 'not-authorized');
    assert.deepStrictEqual(w.calls, [], JSON.stringify(opts));
    assert.deepStrictEqual(w.updates, []);
  }
});
