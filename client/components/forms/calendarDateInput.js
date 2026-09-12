import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { formatDate } from '/imports/lib/dateUtils';
import { formatDateForDisplay, dateDisplayPreferences } from '/client/lib/dateDisplay';
const { CALENDAR_SYSTEMS, nativeCalendarParts } = require('/imports/lib/calendarSystems');
const { calendarMonthDays, calendarMonthRange, shiftedDay, shiftCalendarMonth, shiftCalendarYear } = require('/imports/lib/calendarMonth');

function fromInput(value) {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

Template.calendarDateInput.onCreated(function () {
  this.selectedDate = new ReactiveVar(null);
  this.shownDate = new ReactiveVar(new Date());
  this.expanded = new ReactiveVar(false);
  this.focusedDate = new ReactiveVar(null);
  this.autorun(() => {
    const selected = fromInput(Template.currentData().value);
    this.selectedDate.set(selected);
    if (selected) this.shownDate.set(selected);
  });
});

function selectedSystem() {
  const selected = dateDisplayPreferences().calendarSystem;
  return CALENDAR_SYSTEMS.find(item => item.value === selected) || CALENDAR_SYSTEMS[0];
}

function writeValue(tpl, date) {
  const input = tpl.find('.js-calendar-native-value');
  const withTime = tpl.data.withTime;
  let value = date ? formatDate(date) : '';
  if (date && withTime) {
    const time = tpl.find('.js-calendar-time').value || '12:00';
    const [hours, minutes] = time.split(':').map(Number);
    date = new Date(date);
    date.setHours(hours, minutes, 0, 0);
    value += `T${time}`;
  }
  tpl.selectedDate.set(date);
  input.value = value;
  // Existing parents receive the native value and keep their existing save
  // methods, validation and notification behavior.
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

Template.calendarDateInput.helpers({
  useNativeInput() { return !this.inline && dateDisplayPreferences().calendarSystem === 'gregorian'; },
  inputType() { return this.withTime ? 'datetime-local' : 'date'; },
  selectedDateText() { return formatDateForDisplay(Template.instance().selectedDate.get(), false); },
  headingDateText() {
    const tpl = Template.instance();
    return formatDateForDisplay(tpl.selectedDate.get() || tpl.shownDate.get(), false);
  },
  expanded() { return !!Template.instance().data.inline || Template.instance().expanded.get(); },
  calendarName() { return TAPi18n.__(selectedSystem().labelKey); },
  monthLabel() {
    const date = Template.instance().shownDate.get();
    try {
      return new Intl.DateTimeFormat(TAPi18n.getLanguage() || 'en', {
        calendar: selectedSystem().intl, month: 'long',
        ...(Template.instance().data.inline ? {} : { year: 'numeric' }), numberingSystem: 'latn',
      }).format(date);
    } catch (error) { return formatDateForDisplay(date, false); }
  },
  weekdays() {
    const user = ReactiveCache.getCurrentUser();
    const firstDay = user ? user.getStartDayOfWeek() : 1;
    const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return Array.from({ length: 7 }, (_, index) => TAPi18n.__(names[(firstDay + index) % 7]));
  },
  weeks() {
    const tpl = Template.instance();
    const user = ReactiveCache.getCurrentUser();
    const firstDay = user ? user.getStartDayOfWeek() : 1;
    const { days } = calendarMonthDays(tpl.shownDate.get(), selectedSystem().intl, firstDay);
    const wantedFocus = tpl.focusedDate.get() || tpl.selectedDate.get();
    const focusDate = wantedFocus && days.some(date => date && formatDate(date) === formatDate(wantedFocus))
      ? wantedFocus : days.find(Boolean);
    const rows = [];
    for (let index = 0; index < days.length; index += 7) {
      rows.push({ days: days.slice(index, index + 7).map(date => date && ({
        iso: formatDate(date),
        label: nativeCalendarParts(date, selectedSystem().intl).day,
        title: formatDateForDisplay(date, false),
        selected: tpl.selectedDate.get() && formatDate(tpl.selectedDate.get()) === formatDate(date),
        tabIndex: focusDate && formatDate(focusDate) === formatDate(date) ? 0 : -1,
      })) });
    }
    return rows;
  },
  timeValue() {
    const date = Template.instance().selectedDate.get();
    return date ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : '12:00';
  },
});

Template.calendarDateInput.events({
  'click .js-calendar-toggle'(event, tpl) {
    event.preventDefault();
    tpl.expanded.set(!tpl.expanded.get());
    if (tpl.expanded.get()) Tracker.afterFlush(() => tpl.find('.js-calendar-day[tabindex="0"]')?.focus());
  },
  'click .js-calendar-previous'(event, tpl) {
    event.preventDefault();
    tpl.shownDate.set(shiftedDay(calendarMonthRange(tpl.shownDate.get(), selectedSystem().intl).start, -1));
  },
  'click .js-calendar-next'(event, tpl) {
    event.preventDefault();
    tpl.shownDate.set(calendarMonthRange(tpl.shownDate.get(), selectedSystem().intl).end);
  },
  'click .js-calendar-year-previous'(event, tpl) { event.preventDefault(); tpl.shownDate.set(shiftCalendarYear(tpl.shownDate.get(), -1, selectedSystem().intl)); },
  'click .js-calendar-year-next'(event, tpl) { event.preventDefault(); tpl.shownDate.set(shiftCalendarYear(tpl.shownDate.get(), 1, selectedSystem().intl)); },
  'click .js-calendar-day'(event, tpl) {
    event.preventDefault();
    writeValue(tpl, fromInput(event.currentTarget.dataset.date));
    tpl.focusedDate.set(fromInput(event.currentTarget.dataset.date));
    tpl.expanded.set(false);
    Tracker.afterFlush(() => tpl.find(tpl.data.inline
      ? '.js-calendar-day[tabindex="0"]' : '.js-calendar-toggle')?.focus());
  },
  'keydown .js-calendar-day'(event, tpl) {
    const date = fromInput(event.currentTarget.dataset.date);
    let next;
    const horizontal = getComputedStyle(tpl.firstNode).direction === 'rtl' ? -1 : 1;
    const offsets = { ArrowLeft: -horizontal, ArrowRight: horizontal, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in offsets) next = shiftedDay(date, offsets[event.key]);
    else if (event.key === 'PageUp' || event.key === 'PageDown') {
      next = (event.shiftKey ? shiftCalendarYear : shiftCalendarMonth)(date, event.key === 'PageUp' ? -1 : 1, selectedSystem().intl);
    } else if (event.key === 'Home' || event.key === 'End') {
      const user = ReactiveCache.getCurrentUser();
      const firstDay = user ? user.getStartDayOfWeek() : 1;
      const offset = (date.getDay() - firstDay + 7) % 7;
      next = shiftedDay(date, event.key === 'Home' ? -offset : 6 - offset);
    } else if (event.key === 'Escape' && !tpl.data.inline) {
      event.preventDefault(); event.stopPropagation(); tpl.expanded.set(false);
      Tracker.afterFlush(() => tpl.find('.js-calendar-toggle')?.focus());
      return;
    } else return;
    event.preventDefault(); event.stopPropagation();
    tpl.focusedDate.set(next); tpl.shownDate.set(next);
    Tracker.afterFlush(() => tpl.find(`.js-calendar-day[data-date="${formatDate(next)}"]`)?.focus());
  },
  'change .js-calendar-time'(event, tpl) { if (tpl.selectedDate.get()) writeValue(tpl, tpl.selectedDate.get()); },
  'click .js-calendar-clear'(event, tpl) { event.preventDefault(); writeValue(tpl, null); },
});
