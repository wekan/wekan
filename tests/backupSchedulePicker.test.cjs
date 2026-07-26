'use strict';

// Admin Panel / Attachments / Backup, the schedule's day.
//
// It was a text field for the weekly day - which only ever accepted an English day
// name, typed exactly right, from an admin reading a translated page - and a number
// spinner for the monthly date, which took 27 clicks to reach the end of the month
// and never showed that the 29th to the 31st are not offered at all.
//
// Both are buttons now. The day names are translated; the STORED value stays the
// English name, because that is the language the cron schedule sentence is written
// in (models/lib/backupPaths.js scheduleText) - getting that backwards would write a
// schedule synced-cron cannot parse.
//
// Run: node tests/backupSchedulePicker.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const jade = read('client/components/settings/attachments.jade');
const js = read('client/components/settings/attachments.js');
const css = read('client/components/settings/settingBody.css');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

console.log('backupSchedulePicker:');

test('the text field and the spinner are gone', () => {
  assert.ok(!/js-backup-dow\(type="text"/.test(jade), 'no day-of-week text field');
  assert.ok(!/js-backup-dom\(type="number"/.test(jade), 'no day-of-month spinner');
  assert.ok(!/\.js-backup-dow'\)\.val\(\)/.test(js) && !/\.js-backup-dom'\)\.val\(\)/.test(js),
    'and nothing reads them any more');
});

test('seven day buttons, translated, with the English name as the value', () => {
  const days = [...js.matchAll(/\{ day: '(\w+)', labelKey: '(\w+)' \}/g)];
  assert.strictEqual(days.length, 7, 'one entry per day');
  assert.strictEqual(days[0][1], 'Sunday', 'Sunday first, as the schedule text defaults');
  for (const [, day, key] of days) {
    // The label is translated; the value is not - the cron sentence is English.
    assert.strictEqual(en[key], day, `${key} must be the English name of ${day}`);
  }
  assert.ok(/data-day="\{\{day\}\}"[\s\S]*?\{\{_ labelKey\}\}/.test(jade),
    'the button carries the English day and shows the translated one');
});

test('28 date buttons, and only 28', () => {
  assert.ok(/const BACKUP_MONTH_DAYS = Array\.from\(\{ length: 28 \}/.test(js),
    'the 29th to the 31st are not offered: a schedule there would skip February');
  assert.ok(/each backupMonthDays/.test(jade));
  assert.ok(/js-backup-dom-btn/.test(jade));
});

test('the chosen day is state, seeded from the saved schedule', () => {
  // It cannot be read back out of the DOM the way a field was, and it must not be
  // overwritten by the schedule arriving after the admin has already picked one.
  assert.ok(/this\.backupDayOfWeek = new ReactiveVar\('Sunday'\);/.test(js));
  assert.ok(/this\.backupDayOfMonth = new ReactiveVar\(1\);/.test(js));
  assert.ok(/if \(this\.backupDayTouched\) return;/.test(js),
    'a picked day is not clobbered when the saved schedule arrives');
  assert.ok(/tpl\.backupDayTouched = true;/.test(js), 'and clicking a button marks it');
  assert.ok(/dayOfWeek: tpl\.backupDayOfWeek\.get\(\) \|\| 'Sunday',/.test(js),
    'Save writes the chosen day');
  assert.ok(/dayOfMonth: tpl\.backupDayOfMonth\.get\(\) \|\| 1,/.test(js),
    'and the chosen date');
});

test('a date that is not one of the 28 is refused', () => {
  const handler = js.slice(js.indexOf("'click .js-backup-dom-btn'"));
  assert.ok(/if \(!BACKUP_MONTH_DAYS\.includes\(day\)\) return;/.test(handler.slice(0, 400)),
    'the click handler checks the value it was handed');
});

test('the buttons look like the rest of the Admin Panel', () => {
  const active = css.slice(css.indexOf('.setting-content .schedule-day-btn.active {'));
  assert.ok(/background: var\(--theme-accent, #2980b9\);/.test(active.slice(0, 200)),
    'the chosen one is filled with the theme colour, like the selected menu entry');
  const row = css.slice(css.indexOf('.setting-content .schedule-day-buttons {'));
  assert.ok(/flex-wrap: wrap;/.test(row.slice(0, 200)),
    'they wrap onto further lines rather than squeezing');
  assert.ok(/\.schedule-day-numbers \.schedule-day-btn \{[\s\S]*?min-width:/.test(css),
    'and the dates are equal-width, so the numbers line up');
});

test('the schedule sentence is still built from the English name', () => {
  const paths = read('models/lib/backupPaths.js');
  assert.ok(/on \$\{settings\.dayOfWeek \|\| 'Sunday'\}/.test(paths),
    'scheduleText interpolates the stored day straight into an English sentence');
  assert.ok(/on the \$\{settings\.dayOfMonth \|\| 1\} day of the month/.test(paths));
});

console.log(`\n${passed} tests passed`);
