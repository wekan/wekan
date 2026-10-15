'use strict';

// LDAP_BACKGROUND_SYNC_INTERVAL (packages/wekan-ldap/server/syncSchedule.js).
// A snap stopped in a restart loop: "[uncaughtException] WeKan is stopping:
// TypeError: string.toLowerCase is not a function at later.parse.text ...
// at Object.schedule (wekan-ldap/server/sync.js)". The docs give the interval
// in milliseconds, settings_get() turned that into a Number, and later's text
// parser called toLowerCase() on it from a timer.
// Run: node tests/ldapSyncSchedule.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ldapSyncSchedule } = require('../packages/wekan-ldap/server/syncSchedule');

const ROOT = path.join(__dirname, '..');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`); };

// The real later.js, as SyncedCron hands it to schedule(), when a build has it.
const LATER = path.join(ROOT, '.build/bundle/programs/server/npm/node_modules/meteor/quave_synced-cron/node_modules/@breejs/later');
const later = fs.existsSync(LATER) ? require(LATER) : null;

// A recording stand-in with later's shape, so the decisions are checked
// without a build too.
function fakeParser() {
  const calls = [];
  const chain = (...prefix) => new Proxy({}, {
    get: (_, name) => (...args) => {
      const step = [...prefix, `${String(name)}(${args.join(',')})`];
      calls.push(step.join('.'));
      return chain(...step);
    },
  });
  return {
    calls,
    recur: () => chain('recur()'),
    text: value => {
      if (typeof value !== 'string') throw new TypeError('string.toLowerCase is not a function');
      return /^every \d+ (hours|minutes|mins|seconds)$/.test(value) ? { schedules: [{ h: [0] }], exceptions: [], error: -1 } : { schedules: [{}], exceptions: [], error: 0 };
    },
  };
}
const warnings = [];
const warn = message => warnings.push(message);

test('milliseconds, as documented, become an interval - from a Number or a string', () => {
  for (const value of [3600000, '3600000', ' 600000 ']) {
    const parser = fakeParser();
    assert.doesNotThrow(() => ldapSyncSchedule(parser, value, warn));
    assert.ok(parser.calls.some(c => /every\((60|10)\)\.minute\(\)$/.test(c)), String(value));
  }
  const seconds = fakeParser();
  ldapSyncSchedule(seconds, 90000, warn);
  assert.ok(seconds.calls.some(c => /every\(90\)\.second\(\)$/.test(c)), 'not a whole minute: seconds');
});

test('later.js text still works, also in the quotes a compose file keeps (#2354)', () => {
  for (const value of ['every 1 hours', "'every 1 hours'", '"every 1 hours"', "  'every 1 hours'  "]) {
    assert.deepEqual(ldapSyncSchedule(fakeParser(), value, warn).error, -1, value);
  }
  // ...and quoted milliseconds, and quoted nothing.
  const ms = fakeParser();
  ldapSyncSchedule(ms, "'600000'", warn);
  assert.ok(ms.calls.some(c => /every\(10\)\.minute\(\)$/.test(c)));
  const empty = fakeParser();
  ldapSyncSchedule(empty, "''", warn);
  assert.deepEqual(empty.calls.slice(-1), ['recur().on(0).minute()']);
});

test('unset keeps the original default, recur().on(0).minute()', () => {
  for (const value of [undefined, null, '', false]) {
    const parser = fakeParser();
    ldapSyncSchedule(parser, value, warn);
    assert.deepEqual(parser.calls.slice(-1), ['recur().on(0).minute()'], String(value));
  }
});

test('negative: nothing a setting can hold throws, and unreadable values are reported', () => {
  warnings.length = 0;
  for (const value of [0, -5, 'every banana', true, { a: 1 }, ['x'], NaN]) {
    const parser = fakeParser();
    assert.doesNotThrow(() => ldapSyncSchedule(parser, value, warn), String(value));
    assert.deepEqual(parser.calls.slice(-1), ['recur().on(0).minute()'], `${String(value)}: the default`);
  }
  assert.equal(warnings.length, 7, 'each one says why');
  assert.ok(warnings.every(w => /LDAP_BACKGROUND_SYNC_INTERVAL/.test(w) && /default schedule/.test(w)));
});

test('with the real later.js: the crash is reproduced, and the fix schedules', function () {
  if (!later) { console.log('  (skipped: no .build bundle with later.js)'); return; }
  assert.throws(() => later.parse.text(3600000), /toLowerCase is not a function/, 'the reported crash');
  const hourly = ldapSyncSchedule(later.parse, 3600000, warn);
  const next = later.schedule(hourly).next(2, new Date('2026-10-14T13:44:37Z'));
  assert.equal(next[1] - next[0], 3600000, 'one hour apart');
  const text = ldapSyncSchedule(later.parse, 'every 1 hours', warn);
  assert.equal(text.error, -1);
  // #2354: the quoted form later itself cannot read is read now.
  assert.notEqual(later.parse.text("'every 1 mins'").error, -1, 'later alone fails on the quotes');
  assert.equal(ldapSyncSchedule(later.parse, "'every 1 mins'", warn).error, -1);
  // The documented example: 10000 ms.
  const tenSeconds = later.schedule(ldapSyncSchedule(later.parse, 10000, warn)).next(2, new Date('2026-10-14T13:44:37Z'));
  assert.equal(tenSeconds[1] - tenSeconds[0], 10000);
  const fallback = ldapSyncSchedule(later.parse, 'every banana', warn);
  assert.ok(later.schedule(fallback).next(1), 'an unreadable value still schedules');
});

test('sync.js schedules through it, and nowhere hands a setting to parser.text directly', () => {
  const sync = fs.readFileSync(path.join(ROOT, 'packages/wekan-ldap/server/sync.js'), 'utf8');
  assert.match(sync, /schedule: parser => ldapSyncSchedule\(parser, LDAP\.settings_get\('LDAP_BACKGROUND_SYNC_INTERVAL'\), log_warn\)/);
  // Negative, across every server file: no raw setting reaches later's parser.
  const files = [];
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.build', '_build', '.tools', '.meteor', '.git'].includes(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p); else if (/\.(js|mjs|cjs)$/.test(e.name)) files.push(p);
    }
  };
  for (const dir of ['server', 'packages', 'models']) walk(path.join(ROOT, dir));
  const offenders = files.filter(f => /parser\.text\(\s*(?:LDAP\.)?settings_get|parser\.text\(\s*process\.env/.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(offenders.map(f => path.relative(ROOT, f)), []);
});

console.log(`# ${passed} passed`);
