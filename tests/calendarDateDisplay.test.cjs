'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const calendars = require('../imports/lib/calendarSystems');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

(async () => {
  const { formatDateByUserPreference } = await import('../imports/lib/dateUtils.js');
  const { formatJalaliDate, gregorianToJalali } = await import('../imports/lib/jalaliDate.js');
  let profile = { calendar: 'gregorian', format: 'YYYY-MM-DD' };
  let storage = { calendarSystem: 'jalali', dateFormat: 'DD-MM-YYYY' };
  const context = {
    ReactiveCache: { getCurrentUser: () => profile && ({
      getCalendarSystem: () => profile.calendar,
      getDateFormat: () => profile.format,
    }) },
    window: { localStorage: { getItem: key => storage[key] } },
    TAPi18n: { getLanguage: () => 'en', __: key => key },
    formatDateByUserPreference, formatJalaliDate, gregorianToJalali,
    require: name => name.endsWith('calendarMonth') ? require('../imports/lib/calendarMonth') : calendars, Date, Intl,
  };
  const source = read('client/lib/dateDisplay.js');
  vm.runInNewContext(source.replace(/^import .*;\n/gm, '').replace(/export function/g, 'function'), context);
  const display = context.formatDateForDisplay;
  const date = new Date(2026, 2, 21, 9, 5);
  const timestamp = date.getTime();
  assert.equal(display(date), '2026-03-21 09:05');
  assert.equal(display(date, false, () => 'old Gregorian text'), 'old Gregorian text');
  profile.calendar = 'jalali';
  assert.equal(display(date), '1405-01-01 09:05');
  assert.equal(display(date, false, () => 'must not append Gregorian'), '1405-01-01');
  profile.format = 'DD-MM-YYYY';
  assert.equal(display(date, false), '01-01-1405');
  assert.equal(date.getTime(), timestamp, 'display must not mutate stored dates');
  for (const invalid of [null, undefined, '', 'invalid']) assert.equal(display(invalid), '');
  assert.notEqual(display(new Date(5000, 0, 1), false, () => 'Gregorian must not appear'), 'Gregorian must not appear');
  profile = null;
  assert.equal(display(date, false), '01-01-1405', 'anonymous setting is honored');
  context.window.localStorage.getItem = () => { throw new Error('storage blocked'); };
  assert.equal(display(date, false), '2026-03-21');

  profile = { calendar: 'gregorian', format: 'YYYY-MM-DD' };
  assert.equal(Object.keys(context.calendarDateDisplayOptions()).length, 0);
  profile.calendar = 'jalali';
  const options = context.calendarDateDisplayOptions();
  assert.equal(options.dayCellContent({ date }), '1');
  assert.equal(options.dayHeaderContent({ date, view: { type: 'timeGridWeek' } }), '1405-01-01');
  assert.equal(options.dayHeaderContent({ date, text: 'Sat', view: { type: 'dayGridMonth' } }), 'Sat');
  assert.equal(options.titleFormat({ start: { year: 2026, month: 2, day: 21 } }), '1405-01-01');
  assert.equal(options.titleFormat({ start: { year: 2026, month: 2, day: 21 },
    end: { year: 2026, month: 2, day: 22 }, defaultSeparator: ' – ' }), '1405-01-01 – 1405-01-02');
  assert.equal(options.listDaySideFormat(), '');

  const available = calendars.availableCalendarSystems();
  assert.deepEqual(available.slice(0, 2).map(item => item.value), ['gregorian', 'jalali']);
  for (const calendar of Intl.supportedValuesOf('calendar')) {
    assert.ok(calendars.CALENDAR_SYSTEMS.some(item => item.intl === calendar), calendar);
  }
  for (const system of available.filter(item => !['gregorian', 'jalali'].includes(item.value))) {
    profile.calendar = system.value;
    const result = display(date, false);
    const reference = calendars.formatNativeCalendarDate(date, system.intl, profile.format, false, 'en');
    assert.equal(result, reference, system.value);
    assert.ok(result, system.value);
  }
  profile.calendar = 'japanese';
  assert.match(display(date, false), /Reiwa/);
  profile.calendar = 'unknown';
  assert.equal(display(date, false), '2026-03-21');

  // Every previously missed display uses the shared policy. Input and storage
  // utilities must not implicitly depend on a user's display calendar.
  for (const file of ['cards/cardCustomFields.js', 'cards/checklists.js',
    'notifications/notification.js', 'history/historyTable.js', 'cards/attachments.js',
    'boards/boardsList.js', 'boards/timelineView.js', 'boards/originalPositionsView.js',
    'boards/groupByAssigneeView.js', 'lists/listHeader.js', 'cards/labels.js', 'settings/adminProblems.js',
    'settings/peopleBody.js', 'settings/attachments.js', 'gantt/gantt.js',
    'gantt/frappeGantt.js', 'gantt/dhtmlxGantt.js']) {
    assert.match(read('client/components/' + file), /formatDateForDisplay\(/, file);
  }
  assert.match(read('client/config/blazeHelpers.js'), /formatDateForDisplay\(date/);
  for (const file of ['client/lib/datepicker.js', 'imports/lib/dateUtils.js']) {
    assert.doesNotMatch(read(file), /dateDisplay|calendarSystems|formatJalaliDate/);
  }
  for (const file of ['client/components/cards/cardDate.js', 'client/components/cards/checklists.js',
    'client/components/cards/cardCustomFields.js']) assert.match(read(file), /date.get\(\).toISOString\(\)/);
  assert.match(read('models/users.js'), /allowedValues: CALENDAR_SYSTEM_IDS/);
  assert.match(read('server/models/users.js'), /CALENDAR_SYSTEM_IDS.includes\(calendarSystem\)/);
  assert.match(read('server/models/users.js'), /return await user.setCalendarSystem\(calendarSystem\)/);
  assert.match(read('client/components/users/userHeader.js'), /availableCalendarSystems\(\)/);

  const english = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const system of calendars.CALENDAR_SYSTEMS) assert.ok(english[system.labelKey]);
  for (const file of fs.readdirSync(path.join(__dirname, '../imports/i18n/data')).filter(file => file.endsWith('.i18n.json'))) {
    const locale = JSON.parse(read('imports/i18n/data/' + file));
    assert.deepEqual(Object.keys(locale), Object.keys(english), file + ' key order');
    for (const system of calendars.CALENDAR_SYSTEMS) {
      assert.ok(locale[system.labelKey], file + system.labelKey);
      const tokens = text => text.match(/__[A-Za-z0-9_]+__|%\d*\$?[sdif]/g) || [];
      assert.deepEqual(tokens(locale[system.labelKey]), tokens(english[system.labelKey]));
    }
  }
  console.log('calendarDateDisplay: all calendars, preferences, display coverage and Gregorian storage checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
