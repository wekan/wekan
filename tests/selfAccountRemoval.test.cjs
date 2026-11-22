'use strict';

// Deleting or anonymizing your own account follows Admin Panel / People /
// Login / "Self delete user account" on the SERVER, and never removes the
// last site administrator (models/lib/selfAccountRemoval.js). The same for a
// direct client write of the username while "Username Change" is off.
// Run: node tests/selfAccountRemoval.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { selfRemovalRefusal, REASONS } = require('../models/lib/selfAccountRemoval');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('a member deletes their own account while it is allowed', () => {
  assert.strictEqual(selfRemovalRefusal({ selfDeleteAllowed: true, isAdmin: false }), null);
  assert.strictEqual(selfRemovalRefusal({ selfDeleteAllowed: true, isAdmin: true, adminsCount: 2 }), null);
});

test('refused while self delete is not allowed, for admins too, as an attempt (negative)', () => {
  for (const selfDeleteAllowed of [false, undefined, null, 'true', 1]) {
    for (const isAdmin of [false, true]) {
      const refusal = selfRemovalRefusal({ selfDeleteAllowed, isAdmin, adminsCount: 5 });
      assert.ok(refusal, `${selfDeleteAllowed}/${isAdmin}`);
      assert.strictEqual(refusal.reason, REASONS.disabled);
      assert.strictEqual(refusal.attempt, true, 'no screen offers it: recorded');
    }
  }
});

test('the last site administrator never removes themselves (negative)', () => {
  for (const adminsCount of [1, 0, undefined, '1']) {
    const refusal = selfRemovalRefusal({ selfDeleteAllowed: true, isAdmin: true, adminsCount });
    assert.ok(refusal, String(adminsCount));
    assert.strictEqual(refusal.reason, REASONS.lastAdminDelete);
    assert.strictEqual(refusal.attempt, false, 'the button is there: ordinary use, not recorded');
  }
  assert.strictEqual(selfRemovalRefusal({ selfDeleteAllowed: true, isAdmin: true, adminsCount: 1, action: 'anonymize' }).reason,
    REASONS.lastAdminAnonymize);
});

test('the client shows the last-administrator message for both reasons', () => {
  const src = read('client/lib/accountOperationError.js');
  assert.ok(src.includes(REASONS.lastAdminDelete) && src.includes(REASONS.lastAdminAnonymize));
});

const users = read('server/models/users.js');
const methodBody = name => {
  const start = users.indexOf(`  async ${name}(`);
  assert.ok(start > 0, `${name} exists`);
  const end = users.indexOf('\n  },\n', start);
  return users.slice(start, end);
};

test('removeUser asks the rule on its self branch, before removing', () => {
  const body = methodBody('removeUser');
  const self = body.slice(body.indexOf('if (currentUserId === targetUserId) {'));
  const ask = self.indexOf('selfRemovalRefusal(');
  const remove = self.indexOf('Users.removeAsync(');
  assert.ok(ask > 0 && remove > ask, 'the rule is asked before the account is removed');
  assert.match(self, /selfDeleteAllowed: await selfDeleteAllowed\(\)/);
  assert.match(self, /recordSelfRemovalAttempt\('ddp:removeUser', currentUserId\)/);
});

test('anonymizeUser passes the setting to decideAnonymize, which asks the rule', () => {
  const body = methodBody('anonymizeUser');
  assert.match(body, /selfDeleteAllowed: currentUserId && currentUserId === targetUserId \? await selfDeleteAllowed\(\) : undefined/);
  assert.match(body, /recordSelfRemovalAttempt\('ddp:anonymizeUser', currentUserId\)/);
  assert.match(read('models/lib/userAnonymization.js'), /require\('\.\/selfAccountRemoval'\)\.selfRemovalRefusal\(/);
});

test('DELETE /api/users/:userId asks the rule when an admin names their own id', () => {
  const route = users.slice(users.indexOf("WebApp.handlers.delete('/api/users/:userId'"));
  const self = route.indexOf('if (id === req.userId) {');
  assert.ok(self > 0 && self < route.indexOf('Meteor.users.removeAsync('));
  assert.ok(route.indexOf('selfRemovalRefusal(') < route.indexOf('Meteor.users.removeAsync('));
});

test('the setting is read from its real place, as a strict true', () => {
  assert.match(users, /async function selfDeleteAllowed\(\) \{\n  return \(await AccountSettings\.findOneAsync\('accounts-allowUserDelete'\)\)\?\.booleanValue === true;\n\}/);
});

test('no other server path removes or anonymizes a user past the rule (negative, tree-wide)', () => {
  // A file that removes or anonymizes users must ask selfRemovalRefusal (or
  // decideAnonymize, which asks it). onCreateUser's merge of a duplicate login
  // uses Meteor.users.direct.removeAsync, which this does not match on purpose:
  // it is no self-service removal.
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['tests', 'node_modules'].includes(entry.name)) continue;
        walk(rel);
      } else if (entry.name.endsWith('.js')) {
        const src = read(rel);
        const removals = src.match(/(?:\bUsers|Meteor\.users)\.removeAsync\(/g) || [];
        const anonymizations = src.match(/buildAnonymizeUpdate\(/g) || [];
        if (!removals.length && !anonymizations.length) continue;
        if (rel === 'models/lib/userAnonymization.js') continue; // defines it
        if (rel === 'server/cloudPanel.js') continue; // shadow accounts of another WeKan's customers
        if (!/selfRemovalRefusal|decideAnonymize/.test(src)) offenders.push(rel);
      }
    }
  };
  ['server', 'models'].forEach(walk);
  assert.deepStrictEqual(offenders, [], 'these remove or anonymize users without models/lib/selfAccountRemoval.js');
});

test('a direct client write of the username is denied while username change is off', () => {
  const perms = read('server/permissions/users.js');
  assert.match(perms, /accounts-allowUserNameChange'\)\)\?\.booleanValue === true;\n    if \(allowed\) return false;/);
  assert.match(perms, /key: 'authz\.disabled-setting', action: 'blocked', source: 'ddp:users\.update-username'/);
});

test('the catalog key never disables the account', () => {
  const line = read('models/lib/securityCategories.js').split('\n').find(l => l.includes("'authz.disabled-setting':"));
  assert.ok(line);
  assert.match(line, /blocksAccount: false/);
});

console.log(`\nselfAccountRemoval: ${passed} passed`);
