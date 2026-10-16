'use strict';

// models/lib/calendarBaseOptions.js: the FullCalendar options the Calendar and
// Multi Board Calendar views share. Each view used to write them out; they are
// built once now, and each view adds only what differs.
//
// Run: node tests/calendarBaseOptions.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { calendarBaseOptions } = require('../models/lib/calendarBaseOptions.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const base = over => calendarBaseOptions({
  id: 'calendar-view', displayOptions: {}, firstDay: 1,
  weekNumberOf: (date, firstDay) => `w${firstDay}`, translate: key => `T:${key}`,
  locale: 'fi', rtl: false, ...over,
});

console.log('calendarBaseOptions:');

test('the shared options carry the user\'s first day into the week numbers', () => {
  const o = base({ firstDay: 0 });
  assert.strictEqual(o.firstDay, 0);
  assert.strictEqual(o.weekNumberCalculation(new Date()), 'w0');
  assert.strictEqual(o.initialView, 'dayGridMonth');
  assert.strictEqual(o.locale, 'fi');
  assert.strictEqual(o.buttonText.today, 'T:today');
});

test('a display option overrides the default view, and RTL sets the direction', () => {
  assert.strictEqual(base({ displayOptions: { initialView: 'selectedCalendarMonth' } }).initialView, 'selectedCalendarMonth');
  assert.strictEqual(base({ rtl: true }).direction, 'rtl');
  assert.strictEqual(base().direction, 'ltr');
});

test('an untranslated label falls back to English, never the key (negative)', () => {
  const o = base({ translate: key => key });
  assert.strictEqual(o.buttonText.prev, 'Previous');
  assert.strictEqual(o.buttonText.list, 'List');
  assert.ok(!('editable' in o) && !('selectable' in o) && !('navLinks' in o),
    'what differs between the two views is left to each view');
});

test('both views build on it and set only what differs', () => {
  for (const [file, editable] of [['client/components/boards/boardBody.js', true],
    ['client/components/boards/multiboardCalendarView.js', false]]) {
    const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.match(src, /\.\.\.calendarBaseOptions\(\{/, `${file} uses the shared options`);
    assert.match(src, new RegExp(`editable: ${editable},`), `${file} keeps editable: ${editable}`);
    assert.ok(!src.includes('headerToolbar:'), `${file} has no second copy of the toolbar`);
  }
});

console.log(`\ncalendarBaseOptions: ${passed} tests passed`);
