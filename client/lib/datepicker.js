import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { getCurrentCardFromContext } from '/client/lib/currentCard';
import { normalizeDigits } from '/imports/lib/dateUtils';

// The window a typed year has to fall in. Wide on purpose: WeKan holds real
// historical received dates and long-dated deadlines, so this is only meant to
// catch a year that cannot have been intended - the two-digit one a browser
// reports verbatim (0026), and the five-digit slip in the other direction.
const MIN_PLAUSIBLE_YEAR = 1000;
const MAX_PLAUSIBLE_YEAR = 9999;
import {
  isValidDate,
  formatTime,
  initialTimeValue,
  fallbackSubmitTime,
} from '/imports/lib/datePickerTime';

// Format date as YYYY-MM-DD
function formatDate(date) {
  if (!isValidDate(date)) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Sets up datepicker state on a template instance.
 * Call from onCreated. Stores state on tpl.datePicker.
 *
 * @param {TemplateInstance} tpl - The Blaze template instance
 * @param {Object} options
 * @param {string} [options.defaultTime='1970-01-01 08:00:00'] - Default time string
 * @param {Date} [options.initialDate] - Initial date to set (if valid)
 * @param {Function} options.storeDate - Stores a valid date for this popup
 * @param {Function} options.deleteDate - Clears the date for this popup
 */
export function setupDatePicker(tpl, {
  defaultTime = '1970-01-01 08:00:00',
  initialDate,
  storeDate,
  deleteDate,
} = {}) {
  const card = getCurrentCardFromContext() || Template.currentData();
  tpl.datePicker = {
    error: new ReactiveVar(''),
    card,
    date: new ReactiveVar(initialDate && isValidDate(new Date(initialDate)) ? new Date(initialDate) : new Date('invalid')),
    defaultTime,
    storeDate,
    deleteDate,
  };
}

/**
 * onRendered logic for datepicker templates.
 * Sets initial input values from the datePicker state.
 *
 * @param {TemplateInstance} tpl - The Blaze template instance
 */
export function datePickerRendered(tpl) {
  const dp = tpl.datePicker;
  const dateInput = tpl.find('#date');
  const timeInput = tpl.find('#time');

  if (dateInput && isValidDate(dp.date.get())) {
    dateInput.value = formatDate(dp.date.get());
  }
  // Pre-fill the time input: an existing card date keeps its own time; a
  // card without this date gets the configured default (e.g. 17:00 for due
  // dates) instead of an empty field that would silently save as 12:00
  // (#1502). The template already fills the input for existing dates, so
  // only ever write into an empty input.
  if (timeInput && !timeInput.value) {
    const initial = initialTimeValue(dp.date.get(), dp.defaultTime);
    if (initial) {
      timeInput.value = initial;
    }
  }
}

/**
 * Returns helpers object for datepicker templates.
 * All helpers read from Template.instance().datePicker.
 */
export function datePickerHelpers() {
  return {
    error() {
      return Template.instance().datePicker.error;
    },
    datePicker() {
      return Template.instance().datePicker;
    },
    showDate() {
      const dp = Template.instance().datePicker;
      if (isValidDate(dp.date.get())) return formatDate(dp.date.get());
      return '';
    },
    showTime() {
      const dp = Template.instance().datePicker;
      if (isValidDate(dp.date.get())) return formatTime(dp.date.get());
      return '';
    },
    dateFormat() {
      return 'YYYY-MM-DD';
    },
    timeFormat() {
      return 'HH:mm';
    },
    startDayOfWeek() {
      const currentUser = ReactiveCache.getCurrentUser();
      if (currentUser) {
        return currentUser.getStartDayOfWeek();
      } else {
        return 1;
      }
    },
  };
}

/**
 * Returns events object for datepicker templates.
 *
 */
export function datePickerEvents() {
  // The form is a child template of each named popup. Blaze deliberately does
  // not send events across a template boundary, so the shared form owns these
  // handlers and receives its popup's state as a template argument (#6607).
  const getDatePicker = tpl => tpl.datePicker || Template.currentData()?.datePicker;
  return {
    'change .js-date-field'(evt, tpl) {
      const datePicker = getDatePicker(tpl);
      // Native HTML date input validation. Normalize any non-Latin digits
      // (e.g. Persian/Arabic-Indic) so parsing works in those locales (#5752).
      const dateValue = normalizeDigits(tpl.find('#date').value);
      if (dateValue) {
        // HTML date input format is always YYYY-MM-DD
        const dateObj = new Date(dateValue + 'T12:00:00');
        if (isValidDate(dateObj)) {
          const currentDate = datePicker.date.get();
          if (isValidDate(currentDate)) {
            dateObj.setHours(
              currentDate.getHours(),
              currentDate.getMinutes(),
              currentDate.getSeconds(),
              currentDate.getMilliseconds(),
            );
          }
          // Keep the reactive draft in step with the native input. Otherwise
          // any unrelated Blaze rerender can restore the old date after the
          // user edited it but before the form is submitted.
          datePicker.date.set(dateObj);
          datePicker.error.set('');
        } else {
          datePicker.error.set('invalid-date');
        }
      }
    },
    'change .js-time-field'(evt, tpl) {
      const datePicker = getDatePicker(tpl);
      // Native HTML time input validation. Normalize any non-Latin digits
      // (e.g. Persian/Arabic-Indic) so parsing works in those locales (#5752).
      const timeValue = normalizeDigits(tpl.find('#time').value);
      if (timeValue) {
        // HTML time input format is always HH:mm
        const timeObj = new Date(`1970-01-01T${timeValue}:00`);
        if (isValidDate(timeObj)) {
          const currentDate = datePicker.date.get();
          if (isValidDate(currentDate)) {
            const draftDate = new Date(currentDate);
            draftDate.setHours(
              timeObj.getHours(),
              timeObj.getMinutes(),
              0,
              0,
            );
            datePicker.date.set(draftDate);
          }
          datePicker.error.set('');
        } else {
          datePicker.error.set('invalid-time');
        }
      }
    },
    async 'submit .edit-date'(evt, tpl) {
      evt.preventDefault();
      const datePicker = getDatePicker(tpl);

      // Normalize any non-Latin digits (e.g. Persian/Arabic-Indic) before
      // parsing so due/start/end dates work in those locales (#5752).
      // An empty time falls back to the popup's configured default time
      // (e.g. 17:00 for due dates), then 12:00 (#1502).
      const dateValue = normalizeDigits(evt.target.date.value);
      const timeValue =
        normalizeDigits(evt.target.time.value) ||
        fallbackSubmitTime(datePicker.defaultTime);

      if (!dateValue) {
        datePicker.error.set('invalid-date');
        evt.target.date.focus();
        return;
      }

      // Combine date and time: HTML date input is YYYY-MM-DD, time input is HH:mm
      const dateTimeString = `${dateValue}T${timeValue}:00`;
      const newCompleteDate = new Date(dateTimeString);

      if (!isValidDate(newCompleteDate)) {
        datePicker.error.set('invalid');
        return;
      }

      // A TWO-DIGIT YEAR is a real date that is not the one anybody meant.
      // `<input type="date">` reports YYYY-MM-DD, but the browser lets the year
      // sub-field be typed as two digits and reports that literally: typing
      // 31-12-26 gives "0026-12-31", the year 26 AD. Nothing above rejects it -
      // it is a perfectly valid Date - so the card got a due date two thousand
      // years in the past, which is why the reporter saw a date they had TYPED
      // come out red (overdue) while the same date picked from the calendar,
      // which always fills four digits, came out yellow (due soon). The colour
      // was right; the year was wrong.
      //
      // Refused rather than corrected: 0026 could be meant as 2026, but guessing
      // silently rewrites what somebody typed, and this is a date other people's
      // reminders hang off. The error names the year so the fix is obvious.
      const year = newCompleteDate.getFullYear();
      if (year < MIN_PLAUSIBLE_YEAR || year > MAX_PLAUSIBLE_YEAR) {
        datePicker.error.set('invalid-year');
        evt.target.date.focus();
        return;
      }

      await datePicker.storeDate(newCompleteDate, datePicker.card);
      // FerretDB does not always wake Meteor's already-running observer for an
      // update made through the async collection path. Restart the current
      // board publication so the saved badge replaces the add-date control
      // immediately instead of appearing only after a later navigation.
      Session.set(
        'boardSubscriptionGeneration',
        (Session.get('boardSubscriptionGeneration') || 0) + 1,
      );
      Popup.back();
    },
    async 'click .js-delete-date'(evt, tpl) {
      evt.preventDefault();
      const datePicker = getDatePicker(tpl);
      await datePicker.deleteDate(datePicker.card);
      Session.set(
        'boardSubscriptionGeneration',
        (Session.get('boardSubscriptionGeneration') || 0) + 1,
      );
      Popup.back();
    },
  };
}

// All seven date popups render this one child template, so register the event
// map on the child that actually contains the form.
Template.editDateForm.events(datePickerEvents());
