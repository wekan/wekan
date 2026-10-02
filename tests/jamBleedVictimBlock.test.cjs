'use strict';

// Guard: JamBleed came back (2026-10-02), worse. GHSA-rf3w-rj48-jxcc moved the
// login lockout to a per-(user, address) counter so a stranger could no longer
// lock somebody out, and recorded each lockout in Admin Panel -> Problems. But
// the record named the account being GUESSED as its `userId`, and a
// high-severity 'blocked' event with a userId disables that account
// (server/lib/blockOnSecurityEvent.js). So three wrong passwords from anyone
// who knew a username disabled its owner until an admin noticed - permanently
// rather than for a lockout window - and a user who mistyped their own password
// three times was disabled the same way.
// Run: node tests/jamBleedVictimBlock.test.cjs
//
// The test drives the real blocking decision with the real catalog. The
// negative test pins that the lockout is recorded in one place, naming the
// target as a target, and that a key can opt out of blocking.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function loadDecision() {
  const catalogSrc = read('models/lib/securityCategories.js').replace(/^export \{[^}]*\};?\s*$/m, '');
  const catalog = {};
  // eslint-disable-next-line no-new-func
  new Function('exports', `${catalogSrc}\nexports.categoryFor = categoryFor;`)(catalog);
  const src = read('server/lib/blockOnSecurityEvent.js')
    .replace(/^import [^\n]*\n/gm, '').replace(/^const \{ categoryFor \} = require[^\n]*\n/m, '')
    .replace(/^export /gm, '');
  const lib = {};
  const updates = [];
  const Meteor = { users: { updateAsync: async (selector, modifier) => { updates.push({ selector, modifier }); return 1; } } };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'Meteor', 'categoryFor', `${src}\nexports.shouldBlockAccount = shouldBlockAccount;\nexports.blockAccountForSecurityEvent = blockAccountForSecurityEvent;`)(
    lib, Meteor, catalog.categoryFor);
  return { ...lib, updates };
}

test('the reported attack: a lockout never disables the account being guessed', () => {
  const { shouldBlockAccount } = loadDecision();
  // What the old reporter sent: the victim's id as userId.
  assert.equal(shouldBlockAccount({ key: 'brute.lockout', action: 'blocked', userId: 'victim' }), false);
  // A real attempt by a logged-in actor still blocks that actor (negative).
  assert.equal(shouldBlockAccount({ key: 'authz.manage-board', action: 'blocked', userId: 'actor' }), true);
  assert.equal(shouldBlockAccount({ key: 'authz.manage-board', action: 'blocked', userId: 'actor', blocksAccount: false }), false);
  assert.equal(shouldBlockAccount({ key: 'authz.manage-board', action: 'detected', userId: 'actor' }), false);
});

test('an account already disabled keeps the reason it was disabled for', async () => {
  const { blockAccountForSecurityEvent, updates } = loadDecision();
  await blockAccountForSecurityEvent({ key: 'authz.manage-board', action: 'blocked', userId: 'actor' });
  assert.deepEqual(updates[0].selector, { _id: 'actor', loginDisabled: { $ne: true } });
});

test('the lockout reporter names the target, once, for startup and reload alike', () => {
  const reporter = read('server/lib/lockoutReporter.js');
  const call = reporter.slice(reporter.indexOf("record({"), reporter.indexOf('});', reporter.indexOf("record({")));
  assert.match(call, /key: 'brute\.lockout'/);
  assert.match(call, /targetUserId: userId,/);
  assert.doesNotMatch(call, /^\s*userId[,:]/m, 'the victim is not the actor');
  assert.doesNotMatch(call, /^\s*username[,:]/m, 'nor is the victim tallied as one');
  for (const file of ['server/accounts-lockout-config.js', 'server/methods/lockoutSettings.js']) {
    const src = read(file);
    assert.match(src, /import \{ reportLockout \} from '\/server\/lib\/lockoutReporter';/, file);
    assert.doesNotMatch(src, /function reportLockout/, `${file} has no second copy`);
  }
  assert.match(read('models/lib/securityCategories.js'), /'brute\.lockout':[^\n]*blocksAccount: false/);
});

test('negative: nothing else records a lockout, and no record names a login target as its actor', () => {
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'node_modules' || e.name === 'tests' || e.name.startsWith('_build') || e.name.startsWith('.')) return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (/\.(c|m)?js$/.test(e.name) ? [rel] : []);
  });
  const files = ['server', 'models', 'packages', 'imports'].flatMap(walk);
  const lockout = files.filter(f => /key: 'brute\.lockout'/.test(read(f)));
  assert.deepEqual(lockout, ['server/lib/lockoutReporter.js']);
  // The accounts-lockout package hands the GUESSED account to its reporter;
  // passing loginInfo.user's id straight into record() as userId is the bug.
  const offenders = files.filter(f => /record\(\{[^}]*userId: loginInfo\.user/.test(read(f)));
  assert.deepEqual(offenders, []);
});
