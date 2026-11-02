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
assert.match(helpers.monthLabel(), /^Farvardin 1405/, 'the popup heading names the year too (#6853)');
assert.doesNotMatch(read('client/components/forms/calendarDateInput.js'), /inline \? \{\} : \{ year/, 'no mode of the picker leaves the year out (#6853)');
// #6853: month and year above the calendar, never the YYYY-MM-DD of the day;
// year, month and day drop-downs under it pick any date by a click.
{
  const jade = read('client/components/forms/calendarDateInput.jade');
  assert.doesNotMatch(jade, /selected-calendar-date|headingDateText/, 'no date text in the heading');
  assert.equal(helpers.headingDateText, undefined);
  assert.match(jade, /\.selected-calendar-picker[\s\S]*\.selected-calendar-selects[\s\S]*js-calendar-year[\s\S]*js-calendar-month[\s\S]*js-calendar-day-select/,
    'the drop-downs come after the calendar, in year, month, day order');
  const selectedBefore = tpl.selectedDate.get(); const shownBefore = tpl.shownDate.get();
  assert.equal(helpers.yearValue(), 1405, 'the year field shows the shown year');
  assert.equal(helpers.monthOptions().length, 12);
  assert.equal(helpers.monthOptions().filter(option => option.selected).length, 1);
  assert.equal(helpers.dayOptions().length, 31, 'Farvardin has 31 days');
  assert.equal(helpers.dayOptions().filter(option => option.selected).length, 1);
  assert.equal(helpers.noDaySelected(), false);
  const change = (name, value) => events[`change .${name}`]({ currentTarget: { value } }, tpl);
  // A year pick keeps the day of the year; a month pick keeps the day of the
  // month; a day pick takes that day. Each selects the date and shows its month.
  const yearInput = { value: '1410' };
  const changeYear = value => { yearInput.value = value; events['change .js-calendar-year']({ currentTarget: yearInput }, tpl); };
  changeYear('1410');
  assert.match(helpers.monthLabel(), /^Farvardin 1410/);
  assert.match(helpers.selectedDateText(), /^1410-01-02/);
  // Any year by typing: far back and far ahead, in the calendar in use.
  changeYear('4000'); assert.equal(helpers.yearValue(), 4000);
  assert.match(helpers.monthLabel(), /^Farvardin 4000/);
  changeYear('-2500'); assert.equal(helpers.yearValue(), -2500);
  assert.match(helpers.monthLabel(), /2501 AP|BP|Farvardin/);
  changeYear('1410');
  // Nothing that is not a year changes the date; the field goes back.
  const before = iso(tpl.shownDate.get());
  for (const bad of ['', 'abc', '1.5', '99999999']) {
    changeYear(bad);
    assert.equal(iso(tpl.shownDate.get()), before, `"${bad}" is refused`);
    assert.equal(yearInput.value, 1410, `"${bad}": the field shows the shown year again`);
  }
  const month = helpers.monthOptions()[5].value;
  change('js-calendar-month', month);
  assert.match(helpers.monthLabel(), /^Shahrivar 1410/);
  assert.match(helpers.selectedDateText(), /^1410-06-02/);
  change('js-calendar-day-select', helpers.dayOptions()[30].value);
  assert.match(helpers.selectedDateText(), /^1410-06-31/);
  // Shahrivar's 31st into Mehr (30 days) lands on Mehr's last day, not Aban.
  change('js-calendar-month', helpers.monthOptions()[7].value);
  assert.match(helpers.selectedDateText(), /^1410-08-30/);
  change('js-calendar-day-select', '');
  assert.match(helpers.selectedDateText(), /^1410-08-30/, 'the empty placeholder changes nothing');
  tpl.selectedDate.set(null);
  assert.equal(helpers.noDaySelected(), true, 'no day selected shows the placeholder');
  tpl.selectedDate.set(selectedBefore); tpl.shownDate.set(shownBefore);
}
assert.doesNotMatch(read('client/components/forms/datepicker.jade'), /label \{\{_ 'date'\}\}/);
assert.equal(helpers.useNativeInput.call(data), false);
// #6838: every week and every cell, empty ones too, has a unique _id that
// names its month - Blaze reused cells by position without one, and a month
// navigated back to was drawn "29, empty, 30, empty" without its 31st.
{
  const rows = helpers.weeks();
  const ids = rows.flatMap(row => [row._id, ...row.days.map(day => day._id)]);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  assert.ok(rows.flatMap(row => row.days).some(day => day.empty), 'empty cells are objects with their own id');
  assert.ok(rows.flatMap(row => row.days).filter(day => !day.empty).every(day => day._id === day.iso));
  const before = rows[0]._id;
  events['click .js-calendar-next']({ preventDefault() {} }, tpl);
  assert.notEqual(helpers.weeks()[0]._id, before, 'another month is other cells');
  events['click .js-calendar-previous']({ preventDefault() {} }, tpl);
  assert.equal(helpers.weeks()[0]._id, before);
  assert.match(read('client/components/forms/calendarDateInput.jade'), /td\(class="\{\{#if this\.today\}\}is-today-cell\{\{\/if\}\}"\)\n\s+unless this\.empty/);
}
// #6838: Today shows today's month from wherever the arrows went, focuses
// today, and selects nothing: the chosen date and the form value stay.
{
  const valueBefore = nativeInput.value;
  const selectedBefore = tpl.selectedDate.get();
  for (let i = 0; i < 14; i++) events['click .js-calendar-next']({ preventDefault() {} }, tpl);
  assert.notEqual(iso(tpl.shownDate.get()).slice(0, 7), iso(new Date()).slice(0, 7));
  focused = false;
  events['click .js-calendar-today']({ preventDefault() {} }, tpl);
  assert.equal(iso(tpl.shownDate.get()), iso(new Date()), 'today\'s month is shown');
  assert.equal(focused, true, 'and today has the focus');
  assert.equal(nativeInput.value, valueBefore, 'negative: the form value is unchanged');
  assert.equal(tpl.selectedDate.get(), selectedBefore, 'negative: nothing is selected');
  const jade = read('client/components/forms/calendarDateInput.jade');
  assert.match(jade, /button\.primary\.js-calendar-today\(type="button" aria-label="\{\{_ 'today'\}\}"\) \{\{_ 'today'\}\}\n\s+button\.primary\.js-calendar-next/);
}
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
