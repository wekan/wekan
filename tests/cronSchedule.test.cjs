'use strict';

// Guard: cron schedules for rules (models/lib/cronSchedule.js) - an imported
// GitHub Actions `schedule:` keeps its exact times.
// Run: node tests/cronSchedule.test.cjs

const assert = require('assert');
const c = require('../models/lib/cronSchedule.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const at = s => new Date(`${s}Z`);

test('fields, ranges, lists, steps and names (UTC)', () => {
  assert.ok(c.cronMatches('30 5 * * 1-5', at('2026-10-14T05:30:00')), 'Wednesday 05:30');
  assert.ok(!c.cronMatches('30 5 * * 1-5', at('2026-10-18T05:30:00')), 'not Sunday');
  assert.ok(c.cronMatches('*/15 * * * *', at('2026-10-14T11:45:00')));
  assert.ok(!c.cronMatches('*/15 * * * *', at('2026-10-14T11:46:00')));
  assert.ok(c.cronMatches('0 0 1,15 * *', at('2026-10-15T00:00:00')));
  assert.ok(c.cronMatches('0 12 * JAN-MAR MON', at('2026-02-02T12:00:00')));
  assert.ok(c.cronMatches('0 0 * * 7', at('2026-10-18T00:00:00')), '7 is Sunday too');
});

test('both day fields restricted: either matches, as in cron', () => {
  assert.ok(c.cronMatches('0 9 1 * MON', at('2026-10-01T09:00:00')), 'the 1st (a Thursday)');
  assert.ok(c.cronMatches('0 9 1 * MON', at('2026-10-05T09:00:00')), 'a Monday');
  assert.ok(!c.cronMatches('0 9 1 * MON', at('2026-10-06T09:00:00')));
});

test('next run', () => {
  assert.deepStrictEqual(c.nextCronRun('0 3 * * *', at('2026-10-14T05:00:00')), at('2026-10-15T03:00:00'));
  assert.strictEqual(c.nextCronRun('0 0 30 2 *', at('2026-01-01T00:00:00')), null, 'February 30th never comes');
});

test('negative: wrong field count, out of range, backwards, bad step, words', () => {
  for (const bad of ['* * * *', '60 * * * *', '* 24 * * *', '* * 0 * *', '* * * 13 *', '5-1 * * * *', '*/0 * * * *', 'every day']) {
    assert.throws(() => c.parseCron(bad), c.CronError, bad);
    assert.strictEqual(c.isValidCron(bad), false);
  }
});

console.log(`# ${passed} passed`);
