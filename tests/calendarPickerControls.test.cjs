'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const calendars = require('../imports/lib/calendarSystems');
const months = require('../imports/lib/calendarMonth');
const times = require('../imports/lib/datePickerTime');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const iso = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
class ReactiveVar { constructor(value) { this.value = value; } get() { return this.value; } set(value) { this.value = value; } }

// Independent Intl field assertions prove the grid contains exactly one real
// month, including the leap day and calendars with a thirteenth month.
for (const system of calendars.availableCalendarSystems()) {
  const { start, end, days } = months.calendarMonthDays(new Date(2026, 8, 6, 12), system.intl);
  const first = calendars.nativeCalendarParts(start, system.intl);
  assert.equal(Number(first.day), 1, system.value);
  const reference = new Intl.DateTimeFormat('en', { calendar: system.intl, month: '2-digit', year: 'numeric' });
  for (const date of days.filter(Boolean)) assert.equal(reference.format(date), reference.format(start));
  assert.notEqual(reference.format(end), reference.format(start));
  assert.equal(days.length % 7, 0);
}
assert.equal(months.calendarMonthDays(new Date(2025, 2, 20, 12), 'persian').days.filter(Boolean).length, 30);
assert.equal(months.calendarMonthDays(new Date(2026, 2, 20, 12), 'persian').days.filter(Boolean).length, 29);
assert.equal(iso(months.shiftCalendarMonth(new Date(2026, 2, 21, 12), 1, 'persian')), '2026-04-21');

let created, helpers, events;
const data = { value: '2026-03-21', inputId: 'date' };
let tpl;
let rtl = false;
let focused = false;
const nativeInput = { value: data.value, dispatchEvent(event) { assert.equal(event.bubbles, true); } };
const context = {
  Template: {
    calendarDateInput: { onCreated(fn) { created = fn; }, helpers(map) { helpers = map; }, events(map) { events = map; } },
    currentData: () => data, instance: () => tpl,
  },
  ReactiveVar, Date, Intl, Event,
  Tracker: { afterFlush: fn => fn() },
  ReactiveCache: { getCurrentUser: () => ({ getStartDayOfWeek: () => 1 }) },
  TAPi18n: { getLanguage: () => 'en', __: key => key },
  dateDisplayPreferences: () => ({ calendarSystem: 'jalali' }),
  formatDateForDisplay: date => date ? calendars.formatNativeCalendarDate(date, 'persian', 'YYYY-MM-DD', false) : '',
  formatDate: iso,
  getComputedStyle: () => ({ direction: rtl ? 'rtl' : 'ltr' }),
  require: name => name.endsWith('calendarMonth') ? months : calendars,
};
vm.runInNewContext(read('client/components/forms/calendarDateInput.js').replace(/^import .*;\n/gm, ''), context);
tpl = { data, autorun: fn => fn(), firstNode: {}, find: selector => selector === '.js-calendar-native-value'
  ? nativeInput : { focus() { focused = true; } } };
created.call(tpl);
assert.match(helpers.selectedDateText(), /^1405-01-01/);
assert.equal(helpers.weeks().flatMap(row => row.days).filter(day => day && day.tabIndex === 0).length, 1);
const key = name => events['keydown .js-calendar-day']({ key: name, currentTarget: { dataset: { date: '2026-03-21' } },
  preventDefault() {}, stopPropagation() {} }, tpl);
key('ArrowRight'); assert.equal(iso(tpl.focusedDate.get()), '2026-03-22'); assert.equal(focused, true);
key('ArrowDown'); assert.equal(iso(tpl.focusedDate.get()), '2026-03-28');
key('PageDown'); assert.equal(iso(tpl.focusedDate.get()), '2026-04-21');
rtl = true; key('ArrowLeft'); assert.equal(iso(tpl.focusedDate.get()), '2026-03-22');
events['click .js-calendar-day']({ preventDefault() {}, currentTarget: { dataset: { date: '2026-03-22' } } }, tpl);
assert.equal(nativeInput.value, '2026-03-22', 'selecting Jalali day 2 emits a native date for the existing save handler');
assert.equal(tpl.expanded.get(), false);
assert.equal(helpers.expanded(), false, 'compact inputs retain their toggle behavior');
data.inline = true;
assert.equal(helpers.expanded(), true, 'popup calendar is visible immediately');
assert.equal(helpers.useNativeInput.call(data), false);
events['click .js-calendar-day']({ preventDefault() {}, currentTarget: { dataset: { date: '2026-03-23' } } }, tpl);
assert.equal(helpers.expanded(), true, 'popup selection keeps the calendar visible');
assert.equal(nativeInput.value, '2026-03-23');

let timeCreated, timeHelpers, timeEvents;
const timeData = { value: '', defaultTime: '1970-01-01 17:00:00' };
const timeInput = { value: '', dispatchEvent() {} };
const hour = { value: '13' }, minute = { value: '45' };
const timeTpl = { autorun: fn => fn(), find: selector => selector === '.js-calendar-hour' ? hour
  : selector === '.js-calendar-minute' ? minute : timeInput };
const timeContext = {
  Template: {
    calendarTimeInput: { onCreated(fn) { timeCreated = fn; }, helpers(map) { timeHelpers = map; }, events(map) { timeEvents = map; } },
    currentData: () => timeData, instance: () => timeTpl,
  }, ReactiveVar, Event, ...times,
};
vm.runInNewContext(read('client/components/forms/calendarTimeInput.js').replace(/^import .*;\n/gm, ''), timeContext);
timeCreated.call(timeTpl);
assert.equal(timeTpl.time.get(), '17:00', 'due-date default survives the accessible controls');
assert.equal(timeHelpers.hours().length, 24);
assert.equal(timeHelpers.minutes().length, 60);
timeEvents['change select']({}, timeTpl);
assert.equal(timeInput.value, '13:45', 'mouse/dropdown selection supplies time without writing punctuation');
assert.match(read('client/components/forms/calendarDateInput.jade'), /aria-label=title.*tabindex=tabIndex/);
assert.match(read('client/components/forms/calendarDateInput.css'), /:focus-visible/);
assert.match(read('client/components/forms/datepicker.jade'), /\+calendarDateInput\([^\n]*inline=true/);
assert.match(read('client/components/forms/calendarTimeInput.jade'), /input\.js-calendar-native-time\(type="hidden"/);
assert.doesNotMatch(read('client/components/forms/calendarTimeInput.jade'), /type="text"/);
assert.match(read('client/components/forms/datepicker.css'), /flex-direction: column/);
assert.match(read('client/components/main/popup.css'), /\.datepicker-container \.fields \{[^}]*flex-direction: column/);
const popupCss = read('client/components/main/popup.css');
assert.match(popupCss, /\.pop-over:has\(\.edit-date\) \{[^}]*overflow: auto;/);
assert.match(read('client/components/main/popup.js'), /setPointerCapture\(evt.pointerId\)/);
assert.match(read('client/components/main/popup.tpl.jade'), /button\.js-date-popup-resize\(type="button" aria-label=/);
assert.match(popupCss, /\.pop-over:has\(\.edit-date\) \.content-wrapper \{[^}]*max-height: none !important;[^}]*overflow: visible !important;/);
assert.doesNotMatch(popupCss, /max-height: (50|60)vh|padding-bottom: 100px/,
  'date popups must not reintroduce the nested height limits from the screenshots');

for (const file of ['client/components/forms/datepicker.jade', 'client/components/cards/labels.jade',
  'client/components/lists/listBody.jade', 'client/components/rules/triggers/scheduledTriggers.jade']) {
  assert.match(read(file), /\+calendarDateInput\(/);
  assert.doesNotMatch(read(file), /type="date"|type="datetime-local"/);
}
console.log('calendarPickerControls: real month grids, leap days, mouse selection, keyboard navigation and time selection passed');
