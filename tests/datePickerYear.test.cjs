'use strict';

// Email feedback (../log/wekan17/email-feedback/card-date):
//
//   "If i write the expiration date with the keyboard it turns red, if i choose
//    it with the date picker it is yellow. Can you please tell me the difference?"
//
// Run: node tests/datePickerYear.test.cjs
//
// It is a bug, and the colour was never the bug. `<input type="date">` reports
// its value as YYYY-MM-DD, but the browser lets the YEAR sub-field be typed as
// two digits and reports exactly what was typed: entering 31-12-26 gives
// "0026-12-31" - the year 26 AD. `new Date('0026-12-31T17:00:00')` is a perfectly
// valid Date, so nothing refused it, and the card was saved with a due date two
// thousand years in the past. Red is what an overdue date is supposed to look
// like; picking the same day from the calendar always fills four digits, gets
// 2026, and is yellow because it is merely due soon.
//
// The screenshot the reporter attached shows it directly: the yellow badges read
// "31-12-2026 17:00" and the red ones "31-12-26 17:00" - two different years, not
// two different colours of the same date.
//
// So the submit refuses a year outside a plausible window and says which digits
// are missing. It REFUSES rather than correcting: 0026 was probably meant as
// 2026, but silently rewriting a date somebody typed - one that other people's
// due-date reminders hang off - is worse than telling them.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(repoRoot, 'client/lib/datepicker.js'), 'utf8');
const en = JSON.parse(fs.readFileSync(path.join(repoRoot, 'imports/i18n/data/en.i18n.json'), 'utf8'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The check as the submit handler does it.
const MIN = Number((src.match(/const MIN_PLAUSIBLE_YEAR = (\d+);/) || [])[1]);
const MAX = Number((src.match(/const MAX_PLAUSIBLE_YEAR = (\d+);/) || [])[1]);
const accepted = year => year >= MIN && year <= MAX;

test('the plausible-year window is defined', () => {
  assert.ok(Number.isInteger(MIN) && Number.isInteger(MAX),
    'datepicker.js must define MIN_PLAUSIBLE_YEAR and MAX_PLAUSIBLE_YEAR');
  assert.ok(MIN < MAX);
});

test('the reported case is refused', () => {
  // What the browser really hands over when 31-12-26 is typed.
  const typed = new Date('0026-12-31T17:00:00');
  assert.strictEqual(typed.getFullYear(), 26,
    'this is the value the date input reports - a real Date, in the year 26');
  assert.strictEqual(accepted(typed.getFullYear()), false,
    'and it must not be stored as a due date');
});

test('the date the reporter meant is accepted', () => {
  const picked = new Date('2026-12-31T17:00:00');
  assert.strictEqual(picked.getFullYear(), 2026);
  assert.strictEqual(accepted(picked.getFullYear()), true,
    'the same day chosen from the calendar must go through unchanged');
});

test('the window is wide enough for the dates WeKan really holds', () => {
  // Received dates can be genuinely old and deadlines genuinely far out; this is
  // only meant to catch a year that cannot have been intended.
  for (const year of [1970, 1999, 2000, 2026, 2100, 3000]) {
    assert.strictEqual(accepted(year), true, `${year} is a date somebody may mean`);
  }
  for (const year of [1, 26, 99, 999, 10000]) {
    assert.strictEqual(accepted(year), false, `${year} cannot have been intended`);
  }
});

test('the refusal happens on submit, before the date is stored', () => {
  const check = src.indexOf('MIN_PLAUSIBLE_YEAR ||');
  const store = src.indexOf('datePicker.storeDate(newCompleteDate, datePicker.card)');
  assert.ok(check !== -1 && store !== -1 && check < store,
    'a year that cannot be right must never reach storeDate');
  assert.ok(/datePicker\.error\.set\('invalid-year'\)/.test(src),
    'and the field must say so, the same way invalid-date and invalid-time do');
  assert.ok(/evt\.target\.date\.focus\(\)/.test(src.slice(check, store)),
    'with the cursor put back in the date field, which is where the fix is');
});

test('the message tells the user what to type', () => {
  assert.ok(en['invalid-year'], 'en.i18n.json must carry the invalid-year string');
  assert.ok(/four digits/i.test(en['invalid-year']),
    'the whole confusion was a two-digit year, so the message has to name that - ' +
    `got: ${en['invalid-year']}`);
  // The neighbouring errors are still there; this is an addition, not a rename.
  assert.ok(en['invalid-date'] && en['invalid-time']);
});

test('the date is not silently corrected to the year the user probably meant', () => {
  assert.ok(!/\+ 2000|year < 100 \?|20\$\{/.test(src),
    'rewriting 0026 to 2026 would be a guess about a date other people\'s ' +
    'reminders hang off; it is refused and named instead');
});

console.log(`\n${passed} passed`);
