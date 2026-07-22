'use strict';

// Unit + negative tests for the due-date reminder config parsers (#3192).
// Run: node tests/dueNotificationConfig.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  parseNotifyDueDays,
  parseNotifyDueHour,
} = require('../models/lib/dueNotificationConfig');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// ── parseNotifyDueHour — the #3192 midnight bug ─────────────────────────────
check('#3192: hour "0" (midnight) is kept, NOT silently turned into the default', () => {
  // The old `parseInt(env,10) || 8` returned 8 for "0" because 0 is falsy.
  assert.strictEqual(parseNotifyDueHour('0', 8), 0);
});
check('a valid hour is parsed as itself', () => {
  assert.strictEqual(parseNotifyDueHour('8', 8), 8);
  assert.strictEqual(parseNotifyDueHour('23', 8), 23);
  assert.strictEqual(parseNotifyDueHour('13', 8), 13);
});
check('missing / non-numeric hour falls back to the default', () => {
  assert.strictEqual(parseNotifyDueHour(undefined, 8), 8);
  assert.strictEqual(parseNotifyDueHour('', 8), 8);
  assert.strictEqual(parseNotifyDueHour('abc', 8), 8);
});
check('out-of-range hour falls back to the default (negative, >23)', () => {
  assert.strictEqual(parseNotifyDueHour('-1', 8), 8);
  assert.strictEqual(parseNotifyDueHour('24', 8), 8);
  assert.strictEqual(parseNotifyDueHour('25', 8), 8);
});
check('the default is configurable', () => {
  assert.strictEqual(parseNotifyDueHour('nope', 6), 6);
});

// ── parseNotifyDueDays ──────────────────────────────────────────────────────
check('parses a comma list of day offsets, keeping 0 and negatives', () => {
  assert.deepStrictEqual(parseNotifyDueDays('-2,0,3'), [-2, 0, 3]);
});
check('drops entries outside the -14..14 window', () => {
  assert.deepStrictEqual(parseNotifyDueDays('-15,-14,14,15,100'), [-14, 14]);
});
check('drops non-numeric entries but keeps the valid ones', () => {
  assert.deepStrictEqual(parseNotifyDueDays('0,foo,2'), [0, 2]);
});
check('empty / undefined / non-string yields an empty array (negative)', () => {
  assert.deepStrictEqual(parseNotifyDueDays(''), []);
  assert.deepStrictEqual(parseNotifyDueDays(undefined), []);
  assert.deepStrictEqual(parseNotifyDueDays(null), []);
  assert.deepStrictEqual(parseNotifyDueDays(5), []);
});
check('a single valid value works', () => {
  assert.deepStrictEqual(parseNotifyDueDays('0'), [0]);
});

// ── source guards ───────────────────────────────────────────────────────────
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

check('cards.js uses parseNotifyDueHour (no falsy `|| defaultitvl` hour parse)', () => {
  const src = read('models/cards.js');
  assert.ok(/parseNotifyDueHour\(process\.env\.NOTIFY_DUE_AT_HOUR_OF_DAY/.test(src),
    'the scheduler must parse the hour via parseNotifyDueHour');
  assert.ok(!/parseInt\(notifyitvl, 10\) \|\| defaultitvl/.test(src),
    'the old falsy-zero hour parse must be gone');
});
check('#3192: due-card notifications include card ASSIGNEES as participants', () => {
  const src = read('server/models/activities.js');
  // The card-activity participants block must add card.assignees alongside members.
  const m = src.match(/participants = \[\.\.\.new Set\(\[[\s\S]{0,200}?card\.userId[\s\S]{0,200}?\]\)\]/);
  assert.ok(m, 'the card participants assignment must exist');
  assert.ok(/card\.assignees/.test(m[0]),
    'participants must include card.assignees so assignees are notified');
});

console.log(`\ndueNotificationConfig: ${passed} checks passed`);
