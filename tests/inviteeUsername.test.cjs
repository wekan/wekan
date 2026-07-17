'use strict';

// Plain-Node unit test (no Meteor) for models/lib/inviteeUsername.js.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/inviteeUsername.test.cjs
//
// Regression guard for #619 ("Not possible to invite multiple users with
// similar email addresses"): inviting cats@foo.com to a board creates a user
// named "cats"; inviting cats@facebook.com afterwards re-derived the same
// username and Accounts.createUser threw a raw "403 Username already exists",
// shown to the inviter as just "403". deriveUniqueInviteeUsername must hand
// back a non-colliding variant ("cats1") instead.

const assert = require('assert');
const {
  usernameFromEmail,
  deriveUniqueInviteeUsername,
} = require('../models/lib/inviteeUsername.js');

let passed = 0;
const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

// ---------------------------------------------------------------- fixtures

// A fake user directory: isUsernameTaken backed by a Set, like the
// ReactiveCache.getUser({ username }) lookup the server method would use.
function directory(existing) {
  const names = new Set(existing);
  return {
    isTaken: candidate => names.has(candidate),
    isTakenAsync: async candidate => names.has(candidate),
    add: name => names.add(name),
  };
}

// ------------------------------------------------------ usernameFromEmail

test('usernameFromEmail extracts the lowercased local part', () => {
  assert.strictEqual(usernameFromEmail('cats@foo.com'), 'cats');
  assert.strictEqual(usernameFromEmail('Cats@Facebook.COM'), 'cats');
  assert.strictEqual(usernameFromEmail('  spaced@x.org  '), 'spaced');
});

test('usernameFromEmail rejects non-emails (negative)', () => {
  assert.strictEqual(usernameFromEmail('no-at-sign'), '');
  assert.strictEqual(usernameFromEmail('@leading-at.com'), '');
  assert.strictEqual(usernameFromEmail(''), '');
  assert.strictEqual(usernameFromEmail(null), '');
  assert.strictEqual(usernameFromEmail(42), '');
});

// -------------------------------------------- deriveUniqueInviteeUsername

test('first invitee gets the plain local part', async () => {
  const dir = directory([]);
  const name = await deriveUniqueInviteeUsername('cats@foo.com', dir.isTaken);
  assert.strictEqual(name, 'cats');
});

test('#619 scenario: second similar email gets a suffixed username', async () => {
  const dir = directory([]);
  // Invite 1: cats@foo.com -> "cats" (then the account exists).
  const first = await deriveUniqueInviteeUsername('cats@foo.com', dir.isTaken);
  assert.strictEqual(first, 'cats');
  dir.add(first);
  // Invite 2: cats@facebook.com must NOT collide (the old code re-derived
  // "cats" here and Accounts.createUser threw the raw 403).
  const second = await deriveUniqueInviteeUsername(
    'cats@facebook.com',
    dir.isTaken,
  );
  assert.strictEqual(second, 'cats1');
  dir.add(second);
  // Invite 3: yet another cats@… walks to the next free suffix.
  const third = await deriveUniqueInviteeUsername('cats@bar.io', dir.isTaken);
  assert.strictEqual(third, 'cats2');
});

test('collision with a pre-existing non-invited account is also avoided', async () => {
  // e.g. someone registered the username "admin" long ago.
  const dir = directory(['admin', 'admin1']);
  const name = await deriveUniqueInviteeUsername(
    'admin@example.com',
    dir.isTaken,
  );
  assert.strictEqual(name, 'admin2');
});

test('async isUsernameTaken predicates are awaited', async () => {
  const dir = directory(['cats']);
  const name = await deriveUniqueInviteeUsername(
    'cats@facebook.com',
    dir.isTakenAsync,
  );
  assert.strictEqual(name, 'cats1');
});

test('email is normalized before deriving (mixed case still collides)', async () => {
  const dir = directory(['cats']);
  const name = await deriveUniqueInviteeUsername(
    'CATS@Facebook.com',
    dir.isTaken,
  );
  assert.strictEqual(name, 'cats1');
});

test('returns null for non-email input (negative)', async () => {
  const dir = directory([]);
  assert.strictEqual(
    await deriveUniqueInviteeUsername('not-an-email', dir.isTaken),
    null,
  );
  assert.strictEqual(
    await deriveUniqueInviteeUsername('@nolocal.com', dir.isTaken),
    null,
  );
  assert.strictEqual(
    await deriveUniqueInviteeUsername('', dir.isTaken),
    null,
  );
});

test('returns null when every candidate within maxAttempts is taken (negative)', async () => {
  const taken = ['cats'];
  for (let i = 1; i < 5; i += 1) taken.push(`cats${i}`);
  const dir = directory(taken);
  const name = await deriveUniqueInviteeUsername('cats@x.com', dir.isTaken, {
    maxAttempts: 5,
  });
  assert.strictEqual(name, null);
});

test('does not probe beyond maxAttempts candidates', async () => {
  let calls = 0;
  const alwaysTaken = () => {
    calls += 1;
    return true;
  };
  const name = await deriveUniqueInviteeUsername('cats@x.com', alwaysTaken, {
    maxAttempts: 3,
  });
  assert.strictEqual(name, null);
  // base + suffixes 1..2 = exactly maxAttempts probes.
  assert.strictEqual(calls, 3);
});

test('throws when isUsernameTaken is not a function (negative)', async () => {
  await assert.rejects(
    () => deriveUniqueInviteeUsername('cats@x.com', null),
    TypeError,
  );
});

// ------------------------------------------------------------------ runner

(async () => {
  for (const [name, fn] of tests) {
    try {
      await fn();
      passed += 1;
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`FAIL - ${name}`);
      console.error(err && err.stack ? err.stack : err);
      process.exit(1);
    }
  }
  console.log(`\n${passed}/${tests.length} tests passed`);
})();
