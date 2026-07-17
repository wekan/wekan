'use strict';

// Plain-Node unit test (no Meteor) for #4897 — OAuth2/OIDC users intermittently
// showing stale, missing or ANOTHER user's data.
// Run: node tests/oidcLoginStateIsolation.test.cjs
//
// Root cause: packages/wekan-oidc kept per-login state in shared module-level /
// implicit-global variables:
//   * oidc_server.js declared `var profile = {}; var serviceData = {};
//     var userinfo = {};` at MODULE scope, so every login of every user reused
//     the same three objects. Fields not overwritten by the current login
//     leaked in from the previous login (refreshToken, whitelisted id-token
//     claims, email under provider-specific branches), and two logins running
//     concurrently (the handler awaits the token, userinfo and two
//     Meteor.callAsync calls) interleaved writes so a user could be
//     created/updated with another user's id/email/username.
//   * loginHandler.js used implicit globals (teamArray, orgArray, isAdmin,
//     teams, orgs, user_email, ...) and a `users` collection global leaked by
//     the caller, with the same cross-login contamination under concurrency.
//
// This test checks BOTH layers:
//   1. Source-level guard on oidc_server.js (an ES module we cannot require
//      from plain Node): per-login state must be declared INSIDE the
//      OAuth.registerService callback, never at module scope.
//   2. Behavioral tests on loginHandler.js (plain CommonJS): concurrent calls
//      must not contaminate each other, and the collection must be addressed
//      via Meteor.users instead of a leaked `users` global.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}
async function testAsync(name, fn) {
  await fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- 1. Source-level guards on oidc_server.js --------------------------------

const oidcServerPath = path.join(
  __dirname, '..', 'packages', 'wekan-oidc', 'oidc_server.js');
const oidcServerSrc = fs.readFileSync(oidcServerPath, 'utf8');
const registerIdx = oidcServerSrc.indexOf("OAuth.registerService('oidc'");

test('POSITIVE: oidc_server.js registers the oidc OAuth service', () => {
  assert.ok(registerIdx > -1, 'OAuth.registerService(\'oidc\' not found');
});

test('POSITIVE: profile/serviceData/userinfo are declared INSIDE the login handler', () => {
  for (const name of ['profile', 'serviceData', 'userinfo']) {
    const decl = new RegExp(`(?:var|let|const)\\s+${name}\\s*=\\s*\\{\\}`);
    const m = decl.exec(oidcServerSrc);
    assert.ok(m, `no fresh-object declaration found for ${name}`);
    assert.ok(
      m.index > registerIdx,
      `${name} is declared at module scope (index ${m.index} before ` +
        `registerService at ${registerIdx}); per-login state would be shared ` +
        'between all OIDC logins (#4897)',
    );
  }
});

test('NEGATIVE: no module-scope mutable login-state objects before registerService', () => {
  const head = oidcServerSrc.slice(0, registerIdx);
  assert.ok(
    !/(?:var|let|const)\s+(?:profile|serviceData|userinfo)\s*=/.test(head),
    'login state must not be declared before OAuth.registerService',
  );
});

test('NEGATIVE: no implicit-global `user =` / `users =` assignments remain', () => {
  // An assignment like `users= Meteor.users` or `user = await ...` without a
  // declaration keyword creates a true global shared by concurrent logins.
  const bareAssign = /^\s*users?\s*=[^=]/m;
  assert.ok(
    !bareAssign.test(oidcServerSrc),
    'found a bare user/users assignment (implicit global) in oidc_server.js',
  );
  assert.ok(
    /const user = await Meteor\.users\.findOneAsync/.test(oidcServerSrc),
    'expected the user lookups to be const-scoped Meteor.users.findOneAsync calls',
  );
});

// --- 2. Behavioral tests on loginHandler.js ----------------------------------

const loginHandlerPath = path.join(
  __dirname, '..', 'packages', 'wekan-oidc', 'loginHandler.js');

test('NEGATIVE: loginHandler no longer relies on a leaked `users` global', () => {
  const src = fs.readFileSync(loginHandlerPath, 'utf8');
  assert.ok(
    !/await\s+users\./.test(src),
    'loginHandler.js still calls the leaked `users` global; it must use Meteor.users',
  );
  assert.ok(
    /Meteor\.users\.updateAsync/.test(src),
    'loginHandler.js should update via Meteor.users.updateAsync',
  );
});

// Stub the Meteor/Org/Team globals the handler expects, recording every
// Users-collection write per user id.
const updatesByUser = {};
function resetUpdates() {
  for (const k of Object.keys(updatesByUser)) delete updatesByUser[k];
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

global.Meteor = {
  users: {
    async updateAsync(selector, modifier) {
      await tick(); // widen the interleaving window, like a real DB write
      (updatesByUser[selector._id] = updatesByUser[selector._id] || [])
        .push(modifier);
    },
  },
  async callAsync() {
    await tick();
  },
};
global.Org = {
  async findOneAsync(sel) {
    await tick();
    return { _id: 'org-' + sel.orgDisplayName };
  },
};
global.Team = {
  async findOneAsync(sel) {
    await tick();
    return { _id: 'team-' + sel.teamDisplayName };
  },
};
// Deliberately NO global.users: before the fix loginHandler depended on the
// caller leaking `users = Meteor.users` into the global scope, so calling any
// updater here would throw ReferenceError.

const {
  addGroupsWithAttributes,
  addEmail,
  changeFullname,
  changeUsername,
} = require('../packages/wekan-oidc/loginHandler');

(async () => {
  await testAsync('POSITIVE: two CONCURRENT logins keep their teams/admin flags apart', async () => {
    resetUpdates();
    const userA = { _id: 'userA', teams: [], orgs: [] };
    const userB = { _id: 'userB', teams: [], orgs: [] };
    await Promise.all([
      addGroupsWithAttributes(userA, [{ displayName: 'alpha', isAdmin: true }]),
      addGroupsWithAttributes(userB, [{ displayName: 'beta' }]),
    ]);

    const teamsPushedTo = (id) => {
      const push = updatesByUser[id].find((m) => m.$push && m.$push.teams);
      return push.$push.teams.$each.map((t) => t.teamId);
    };
    // Before the fix teamArray/isAdmin were implicit globals: the interleaved
    // logins pushed each other's teams and admin flags onto the same arrays.
    assert.deepStrictEqual(teamsPushedTo('userA'), ['team-alpha']);
    assert.deepStrictEqual(teamsPushedTo('userB'), ['team-beta']);

    const isAdminSet = (id) => {
      const set = updatesByUser[id].find(
        (m) => m.$set && 'isAdmin' in m.$set);
      return set.$set.isAdmin;
    };
    assert.strictEqual(isAdminSet('userA'), true);
    assert.strictEqual(isAdminSet('userB'), false,
      'userB inherited userA\'s admin flag — shared login state (#4897)');
  });

  await testAsync('POSITIVE: two CONCURRENT addEmail calls write each email to its own user', async () => {
    resetUpdates();
    await Promise.all([
      addEmail({ _id: 'userA', emails: [] }, 'a@example.com'),
      addEmail({ _id: 'userB', emails: [] }, 'b@example.com'),
    ]);
    const emailsSetOn = (id) =>
      updatesByUser[id][0].$set.emails.map((e) => e.address);
    assert.deepStrictEqual(emailsSetOn('userA'), ['a@example.com']);
    assert.deepStrictEqual(emailsSetOn('userB'), ['b@example.com']);
  });

  await testAsync('POSITIVE: addEmail moves a known secondary email to the front, verified', async () => {
    resetUpdates();
    await addEmail(
      {
        _id: 'userA',
        emails: [
          { address: 'old@example.com', verified: true },
          { address: 'new@example.com', verified: false },
        ],
      },
      'new@example.com',
    );
    const set = updatesByUser.userA[0].$set.emails;
    assert.strictEqual(set[0].address, 'new@example.com');
    assert.strictEqual(set[0].verified, true);
    assert.strictEqual(set.length, 2);
  });

  await testAsync('NEGATIVE: addEmail does NOT rewrite emails when the address is already primary', async () => {
    resetUpdates();
    await addEmail(
      { _id: 'userA', emails: [{ address: 'same@example.com', verified: true }] },
      'same@example.com',
    );
    assert.strictEqual(updatesByUser.userA, undefined,
      'no update expected when the OIDC email is already the primary one');
  });

  await testAsync('POSITIVE: changeUsername/changeFullname update the right fields when changed', async () => {
    resetUpdates();
    await changeUsername({ _id: 'userA', username: 'old' }, 'new');
    await changeFullname(
      { _id: 'userA', username: 'new', profile: { fullname: 'Old Name' } },
      'New Name',
    );
    assert.deepStrictEqual(updatesByUser.userA[0], { $set: { username: 'new' } });
    assert.deepStrictEqual(updatesByUser.userA[1], {
      $set: { 'profile.fullname': 'New Name' },
    });
  });

  await testAsync('NEGATIVE: changeUsername/changeFullname skip the write when nothing changed', async () => {
    resetUpdates();
    await changeUsername({ _id: 'userA', username: 'same' }, 'same');
    await changeFullname(
      { _id: 'userA', profile: { fullname: 'Same Name' } },
      'Same Name',
    );
    assert.strictEqual(updatesByUser.userA, undefined,
      'no update expected when the OIDC values match the stored ones');
  });

  console.log(`\n${passed} passing`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
