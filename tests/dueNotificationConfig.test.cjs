'use strict';
(async () => {

// Unit + negative tests for the due-date reminder config parsers (#3192).
// Run: node tests/dueNotificationConfig.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  parseNotifyDueDays,
  parseNotifyDueHour,
  normalizeBoardDueDays,
  parseDueReminderInput,
  effectiveDueDays,
  dueDaysToScan,
  isDueReminderDescription,
} = await import('../models/lib/dueNotificationConfig.js');

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

// ── #5323: per-board offsets and webhook reminders ─────────────────────────
check('#5323: a board list is validated, deduplicated and sorted', () => {
  assert.deepStrictEqual(normalizeBoardDueDays([0, 3, -1, 3]), [3, 0, -1]);
  assert.deepStrictEqual(normalizeBoardDueDays([]), [], 'an empty list is valid: reminders off');
  for (const bad of [null, undefined, 'x', [15], [-15], [1.5], ['1'], [NaN], Array.from({ length: 11 }, (_, i) => i)]) {
    assert.strictEqual(normalizeBoardDueDays(bad), null, JSON.stringify(bad));
  }
});
check('#5323: the settings text field parses to a list, the default or an error', () => {
  assert.deepStrictEqual(parseDueReminderInput(' 3, 1 ,0, -2 '), [3, 1, 0, -2]);
  assert.deepStrictEqual(parseDueReminderInput('+2'), [2]);
  assert.strictEqual(parseDueReminderInput(''), null, 'empty uses the server default');
  assert.strictEqual(parseDueReminderInput('   '), null);
  for (const bad of ['1,,2', 'a', '1.5', '20', '1;2', '3 4']) assert.strictEqual(parseDueReminderInput(bad), undefined, bad);
});
check('#5323: a board uses its own offsets, otherwise the server default', () => {
  assert.deepStrictEqual(effectiveDueDays({ dueReminderDays: [2] }, [7, 0]), [2]);
  assert.deepStrictEqual(effectiveDueDays({ dueReminderDays: [] }, [7, 0]), [], 'off means off');
  assert.deepStrictEqual(effectiveDueDays({}, [7, 0]), [7, 0]);
  assert.deepStrictEqual(effectiveDueDays({ dueReminderDays: [99] }, [1]), [1], 'a corrupt override falls back');
});
check('#5323: the scan covers the default and every board override, and nothing without either', () => {
  assert.deepStrictEqual(dueDaysToScan([1, 0], [{ dueReminderDays: [3, 0] }, { dueReminderDays: [] }]), [3, 1, 0]);
  assert.deepStrictEqual(dueDaysToScan([], []), []);
  assert.deepStrictEqual(dueDaysToScan(undefined, [{ dueReminderDays: [-2] }]), [-2]);
});
check('#5323: only the three reminder activities count as due reminders', () => {
  for (const d of ['act-duenow', 'act-almostdue', 'act-pastdue']) assert.ok(isDueReminderDescription(d));
  for (const d of ['act-createCard', 'duenow', 'act-duenowx', undefined]) assert.ok(!isDueReminderDescription(d));
});
check('#5323: the scan, method, webhooks and popup use it', () => {
  const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const cards = read('models/cards.js');
  assert.match(cards, /if \(!daysFor\(card\.boardId\)\.includes\(day\)\) continue;/);
  assert.match(cards, /for \(const day of dueDaysToScan\(envDays, overrides\)\)/);
  assert.doesNotMatch(cards, /if \(!envValue\) \{\s*return;/, 'the scan no longer requires the environment variable');
  const method = read('server/methods/boardDueReminders.js');
  assert.match(method, /allowIsBoardAdminOrSiteAdmin/);
  assert.match(method, /check\(days, Match\.OneOf\(null, \[Match\.Integer\]\)\)/);
  assert.match(read('server/imports.js'), /server\/methods\/boardDueReminders/);
  const acts = read('server/models/activities.js');
  assert.match(acts, /board\.dueReminderWebhook === true && isDueReminderDescription\(description\)/);
  assert.match(read('client/components/settings/notificationSettingsPopup.jade'), /if isBoardScope\s+li\.due-reminder-settings/);
});

console.log(`\ndueNotificationConfig: ${passed} checks passed`);

})().catch(e => { console.error(e); process.exit(1); });