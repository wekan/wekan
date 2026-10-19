'use strict';

// USERS_DISABLE_INACTIVE_AFTER_DAYS: disable accounts unused for N days
// (models/lib/inactiveUsers.js, server/disableInactiveUsers.js), plus the two
// places that must cooperate with it: the re-enable hook in
// server/models/users.js and LDAP presence sync.
// Run: node tests/inactiveUsers.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  DAY_MS, REASON_INACTIVE, normalizeInactiveDays, inactivityAction, inactiveCandidateSelector,
} = require('../models/lib/inactiveUsers.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const NOW = new Date('2026-10-19T03:15:00Z');
const daysAgo = n => new Date(NOW.getTime() - n * DAY_MS);

test('setting: positive whole days, everything else is off', () => {
  assert.strictEqual(normalizeInactiveDays('180'), 180);
  assert.strictEqual(normalizeInactiveDays(90), 90);
  assert.strictEqual(normalizeInactiveDays(' "365" '), 365);
  for (const off of [undefined, null, '', '0', 0, '-5', '6 months', '1.5', 'true']) {
    assert.strictEqual(normalizeInactiveDays(off), 0, String(off));
  }
});

test('disables a user unused for at least N days', () => {
  assert.strictEqual(inactivityAction({ lastConnectionDate: daysAgo(181) }, 180, NOW), 'disable');
  assert.strictEqual(inactivityAction({ lastConnectionDate: daysAgo(180) }, 180, NOW), 'disable');
});

test('keeps a user used within N days', () => {
  assert.strictEqual(inactivityAction({ lastConnectionDate: daysAgo(179) }, 180, NOW), null);
});

test('never-seen accounts start a clock instead of being disabled (no createdAt fallback)', () => {
  assert.strictEqual(inactivityAction({ createdAt: daysAgo(3000) }, 180, NOW), 'start-clock');
});

test('a started or restarted clock counts as use', () => {
  assert.strictEqual(inactivityAction({ inactivityClockStart: daysAgo(10) }, 180, NOW), null);
  assert.strictEqual(inactivityAction({ inactivityClockStart: daysAgo(200) }, 180, NOW), 'disable');
  // Re-enabled by an admin yesterday, last login long ago: kept.
  assert.strictEqual(inactivityAction({
    lastConnectionDate: daysAgo(400), inactivityClockStart: daysAgo(1),
  }, 180, NOW), null);
});

test('admins, disabled and anonymised accounts are left alone', () => {
  const old = daysAgo(1000);
  assert.strictEqual(inactivityAction({ isAdmin: true, lastConnectionDate: old }, 180, NOW), null);
  assert.strictEqual(inactivityAction({ loginDisabled: true, lastConnectionDate: old }, 180, NOW), null);
  assert.strictEqual(inactivityAction({ anonymized: true, lastConnectionDate: old }, 180, NOW), null);
});

test('off means nothing happens', () => {
  assert.strictEqual(inactivityAction({ lastConnectionDate: daysAgo(1000) }, 0, NOW), null);
});

test('candidate selector excludes admins, disabled and recently used accounts', () => {
  const sel = inactiveCandidateSelector(180, NOW);
  assert.deepStrictEqual(sel.loginDisabled, { $ne: true });
  assert.deepStrictEqual(sel.isAdmin, { $ne: true });
  const cutoff = daysAgo(180);
  for (const field of ['lastConnectionDate', 'inactivityClockStart']) {
    const clause = sel.$and.find(c => c.$or.some(o => field in o));
    assert.ok(clause, field);
    assert.deepStrictEqual(clause.$or.find(o => o[field] && o[field].$lte)[field].$lte, cutoff);
  }
});

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('the job disables with the inactive reason and re-checks in the write', () => {
  const job = read('server/disableInactiveUsers.js');
  assert.match(job, /loginDisabled: true, loginDisabledReason: REASON_INACTIVE/);
  assert.match(job, /\{ _id: user\._id, \.\.\.inactiveCandidateSelector\(days, now\) \}/);
  assert.match(read('server/imports.js'), /import '\/server\/disableInactiveUsers';/);
  assert.strictEqual(REASON_INACTIVE, 'inactive');
});

test('enabling an account restarts its clock and clears the reason', () => {
  const hook = read('server/models/users.js');
  assert.match(hook, /modifier\.\$set\.loginDisabled === false && doc\.loginDisabled === true/);
  assert.match(hook, /modifier\.\$set\.inactivityClockStart = new Date\(\)/);
  assert.match(hook, /loginDisabledReason: ''/);
});

test('both new fields are in the users schema', () => {
  const schema = read('models/users.js');
  assert.match(schema, /inactivityClockStart: \{\s*\/\*\*[\s\S]*?type: Date,/);
  assert.match(schema, /loginDisabledReason: \{\s*\/\*\*[\s\S]*?type: String,/);
});

test('the setting is in Admin Panel / People / Login, beside the logout timer', () => {
  const { AUTH_CONFIG_SECTIONS } = require('../models/lib/authConfigCatalog.js');
  const field = AUTH_CONFIG_SECTIONS.login.fields.find(f => f.envVar === 'USERS_DISABLE_INACTIVE_AFTER_DAYS');
  assert.ok(field, 'catalogued in the login section');
  assert.strictEqual(field.type, 'number');
  assert.ok(!field.restart, 'applies without a restart');
});

test('the nightly job resolves the setting each run, Admin Panel first', () => {
  const job = read('server/disableInactiveUsers.js');
  assert.match(job, /import \{ authEnv, authConfigReady \} from '\/server\/lib\/authConfig';/);
  assert.match(job, /await authConfigReady;\n\s+return disableInactiveUsers\(inactiveDaysSetting\(\), new Date\(\)\);/);
  // negative: not read once from the environment at startup, which would
  // ignore the Admin Panel and need a restart for every change.
  assert.doesNotMatch(job, /process\.env\.USERS_DISABLE_INACTIVE_AFTER_DAYS/);
  const startup = job.slice(job.indexOf('Meteor.startup('));
  assert.doesNotMatch(startup, /if \(!days\)/, 'the job is registered even while the setting is off');
});

console.log(`\n${passed} tests passed`);
