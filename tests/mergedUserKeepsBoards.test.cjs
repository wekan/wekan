'use strict';
// Merging a login into an existing account (OIDC, and the Meteor OAuth
// providers) must not take that account off its boards.
//
// Both merge paths run inside Accounts.onCreateUser: they remove the existing
// user and return it, and Meteor inserts it again under the same _id. The
// removal ran the Users.after.remove hook, which is the ACCOUNT-DELETION
// cleanup (models/lib/userDeletionCleanup.js): it pulled the user out of every
// board's members and watchers, every card's members and assignees, and their
// avatars - so a merged user came back logged in, with no boards. The removal
// now goes through collection-hooks' .direct, which skips the hooks.
//
// Run: node tests/mergedUserKeepsBoards.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('mergedUserKeepsBoards:');

test('why it matters: the remove hook is the account-deletion cleanup', () => {
  const hook = read('models/users.js');
  assert.match(hook, /Users\.after\.remove\(async function\(currentUserId, doc\) \{[\s\S]*?buildUserDeletionCleanupPlan\(doc && doc\._id\)/);
  const { buildUserDeletionCleanupPlan } = require('../models/lib/userDeletionCleanup');
  const plan = buildUserDeletionCleanupPlan('merged-user');
  assert.deepEqual(plan.boards.modifier, { $pull: { members: { userId: 'merged-user' }, watchers: { userId: 'merged-user' } } });
  assert.ok(plan.cards.modifier.$pull.assignees === 'merged-user');
});

test('both merge paths remove the account without the hooks', () => {
  for (const rel of ['server/models/users.js', 'server/lib/oauthProviders.js']) {
    const src = read(rel);
    assert.match(src, /await Meteor\.users\.direct\.removeAsync\(\{ _id: existingUser\._id \}\);/, rel);
    assert.match(src, /await Meteor\.users\.direct\.removeAsync\(\{ _id: user\._id \}\);/, rel);
  }
});

// Negative, whole tree: no code removes an account it then gives back (a
// variable named existingUser) through the hooked removal.
test('negative: no user is removed through the hooks and then returned', () => {
  const files = require('node:child_process').execFileSync('git', ['ls-files', 'server', 'models', 'packages'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(f => /\.js$/.test(f) && !/\/tests?\//.test(f));
  const offenders = [];
  for (const rel of files) {
    const src = read(rel);
    for (const match of src.matchAll(/(?:Meteor\.users|Users)\.removeAsync\(\{ _id: existingUser\._id \}\)/g)) {
      offenders.push(`${rel}:${src.slice(0, match.index).split('\n').length}`);
    }
  }
  assert.deepEqual(offenders, []);
});

console.log(`\nmergedUserKeepsBoards: ${passed} tests passed`);
