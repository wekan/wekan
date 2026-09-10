'use strict';
(async () => {

// Plain-Node unit test (no Meteor) for parseTimeInput.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/datePickerTimeInput.test.cjs
//
// Regression guard for #2903 ("card due-date time entry should accept an
// hour-only input, e.g. '13' defaults to 13:00, and an empty time field
// should default to 00:00, instead of requiring both hour and minute to be
// typed"). `<input type="time">` only ever reports a complete 'HH:mm' (or ''
// when incomplete), so it can never carry a partial value like '13' - the
// time field in client/components/forms/datepicker.jade is a plain text
// input so parseTimeInput actually gets to see what was typed. This file is
// the shared date/start/end/received/vote/poker/custom-field time parser
// (client/lib/datepicker.js is the single place all of those funnel
// through, per #1502/#5752).

const assert = require('assert');
const { parseTimeInput } = await import('../imports/lib/datePickerTime.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE: the #2903 core --------------------------------------------------
test('hour-only input defaults the minute to :00 (#2903)', () => {
  assert.strictEqual(parseTimeInput('13'), '13:00');
  assert.strictEqual(parseTimeInput('7'), '07:00');
  assert.strictEqual(parseTimeInput('0'), '00:00');
  assert.strictEqual(parseTimeInput('23'), '23:00');
});

test('an empty/whitespace-only time defaults to midnight (#2903)', () => {
  assert.strictEqual(parseTimeInput(''), '00:00');
  assert.strictEqual(parseTimeInput('   '), '00:00');
});

test('existing "HH:mm" input is unaffected', () => {
  assert.strictEqual(parseTimeInput('13:45'), '13:45');
  assert.strictEqual(parseTimeInput('00:00'), '00:00');
  assert.strictEqual(parseTimeInput('9:05'), '09:05');
  assert.strictEqual(parseTimeInput('23:59'), '23:59');
});

test('12-hour am/pm input, with or without minutes, is accepted', () => {
  assert.strictEqual(parseTimeInput('1pm'), '13:00');
  assert.strictEqual(parseTimeInput('1 pm'), '13:00');
  assert.strictEqual(parseTimeInput('1am'), '01:00');
  assert.strictEqual(parseTimeInput('12am'), '00:00');
  assert.strictEqual(parseTimeInput('12pm'), '12:00');
  assert.strictEqual(parseTimeInput('11:30pm'), '23:30');
  assert.strictEqual(parseTimeInput('11:30 PM'), '23:30');
});

// --- NEGATIVE: garbage is still rejected ---------------------------------------
test('NEGATIVE: out-of-range or non-numeric input is rejected, not silently accepted', () => {
  assert.strictEqual(parseTimeInput('24'), null);
  assert.strictEqual(parseTimeInput('25:00'), null);
  assert.strictEqual(parseTimeInput('13:60'), null);
  assert.strictEqual(parseTimeInput('13pm'), null); // 12-hour hour out of 1-12 range
  assert.strictEqual(parseTimeInput('0pm'), null);
  assert.strictEqual(parseTimeInput('abc'), null);
  assert.strictEqual(parseTimeInput('13:4x'), null);
  assert.strictEqual(parseTimeInput('-1'), null);
  assert.strictEqual(parseTimeInput(undefined), null);
  assert.strictEqual(parseTimeInput(null), null);
});

console.log(`\n${passed} tests passed`);

})().catch(e => { console.error(e); process.exit(1); });
