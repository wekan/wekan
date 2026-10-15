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
    // An hour is every(1).hour(): every(60).minute() only happened to work
    // for 60, and the same form made 2 hours hourly (#6771).
    assert.ok(parser.calls.some(c => /every\(1\)\.hour\(\)$|every\(10\)\.minute\(\)$/.test(c)), String(value));
  }
  // #6771: every(90).second() is "second 0 of each minute" to later, so 90 s
  // is rounded to an interval later keeps, and the warning says so.
  warnings.length = 0;
  const seconds = fakeParser();
  ldapSyncSchedule(seconds, 90000, warn);
  assert.ok(seconds.calls.some(c => /every\(2\)\.minute\(\)$/.test(c)), '90 s: the nearest interval later keeps');
  assert.ok(!seconds.calls.some(c => /every\(90\)/.test(c)), 'never every(90)');
  assert.match(warnings.join('\n'), /90 seconds.*syncing every 2 minutes/);
});

test('#6771: no interval reaches later as an every(n) it cannot keep', () => {
  // Hours, minutes and seconds: n must divide the unit's range (24, 60, 60).
  for (let ms = 1000; ms <= 36 * 3600000; ms += ms < 60000 ? 1000 : ms < 3600000 ? 60000 : 3600000) {
    const parser = fakeParser();
    ldapSyncSchedule(parser, ms, () => {});
    for (const call of parser.calls) {
      const m = /every\((\d+)\)\.(second|minute|hour)\(\)$/.exec(call);
      if (m) assert.equal((m[2] === 'hour' ? 24 : 60) % Number(m[1]), 0, `${ms} ms -> ${call}`);
    }
  }
});

test('#6771: an interval under a minute is synced as asked, with a warning', () => {
  warnings.length = 0;
  ldapSyncSchedule(fakeParser(), 3600, warn);
  assert.match(warnings[0], /3600 is milliseconds.*every 4 seconds.*3600000/);
  warnings.length = 0;
  ldapSyncSchedule(fakeParser(), 3600000, warn);
  assert.deepEqual(warnings, [], 'an hour is not warned about');
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
  // #6771: each documented-style interval keeps its spacing on later's
  // clock. Before, 2 hours and 1 day were hourly and 90 s every minute.
  const gap = ms => {
    const at = later.schedule(ldapSyncSchedule(later.parse, ms, () => {})).next(4, new Date('2026-10-14T13:44:37Z'));
    return [at[2] - at[1], at[3] - at[2]];
  };
  for (const ms of [60000, 300000, 3600000, 7200000, 21600000, 86400000, 172800000, 604800000]) {
    assert.deepEqual(gap(ms), [ms, ms], `${ms} ms`);
  }
  assert.deepEqual(gap(90000), [120000, 120000], '90 s: every 2 minutes, not every minute');
  assert.deepEqual(gap(18000000), [21600000, 21600000], '5 hours: every 6 hours, not hourly');
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
