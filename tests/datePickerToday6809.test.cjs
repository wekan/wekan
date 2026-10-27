'use strict';

// #6809: a date popup of a card without that date opens the calendar on
// today, marks today (#6751) and names it in the heading - but the form's
// date field was empty, so Save without clicking a day answered "Invalid
// date". The form starts from today now; Save saves today at the popup's
// default time.
// Run: node tests/datePickerToday6809.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

(async () => {
  const { draftDate } = await import('../imports/lib/datePickerTime.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
  console.log('datePickerToday6809:');

  test('no date yet: the form starts from today', () => {
    const now = new Date('2026-10-27T09:30:00');
    assert.strictEqual(draftDate(new Date('invalid'), now), now);
    assert.strictEqual(draftDate(undefined, now), now);
    assert.strictEqual(draftDate(null, now), now);
  });

  test('negative: a card\'s own date is kept', () => {
    const due = new Date('2026-12-24T17:00:00');
    assert.strictEqual(draftDate(due, new Date('2026-10-27')), due);
  });

  test('the form\'s date field shows the draft, so Save has a date', () => {
    const picker = read('client/lib/datepicker.js');
    assert.match(picker, /showDate\(\) \{\n\s+const dp = Template\.instance\(\)\.datePicker;\n\s+return formatDate\(draftDate\(dp\.date\.get\(\)\)\);/);
    // The form renders the date field from showDate - the value Save reads.
    assert.match(read('client/components/forms/datepicker.jade'), /\+calendarDateInput\(inputId="date" inputName="date" fieldClass="js-date-field" value=showDate inline=true\)/);
    // The calendar selects what it is given, so today is selected, not only marked.
    assert.match(read('client/components/forms/calendarDateInput.js'), /const selected = fromInput\(Template\.currentData\(\)\.value\);\n\s+this\.selectedDate\.set\(selected\);/);
  });

  test('negative: an emptied date field is still refused, and the time stays the popup\'s default', () => {
    const picker = read('client/lib/datepicker.js');
    assert.match(picker, /if \(!dateValue\) \{\n\s+datePicker\.error\.set\('invalid-date'\);/);
    // showTime is NOT drafted: an empty time takes the configured default (#1502).
    assert.match(picker, /showTime\(\) \{\n\s+const dp = Template\.instance\(\)\.datePicker;\n\s+if \(isValidDate\(dp\.date\.get\(\)\)\) return formatTime\(dp\.date\.get\(\)\);\n\s+return '';/);
  });

  console.log(`datePickerToday6809: ${passed} passed`);
})().catch(error => { console.error(error); process.exit(1); });
