import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { getCurrentCardFromContext } from '/client/lib/currentCard';

// Helper to check if a date is valid
function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  if (!isValidDate(date)) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format time as HH:mm
function formatTime(date) {
  if (!isValidDate(date)) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Sets up datepicker state on a template instance.
 * Call from onCreated. Stores state on tpl.datePicker.
 *
 * @param {TemplateInstance} tpl - The Blaze template instance
 * @param {Object} options
 * @param {string} [options.defaultTime='1970-01-01 08:00:00'] - Default time string
 * @param {Date} [options.initialDate] - Initial date to set (if valid)
 */
export function setupDatePicker(tpl, { defaultTime = '1970-01-01 08:00:00', initialDate } = {}) {
  const card = getCurrentCardFromContext() || Template.currentData();
  tpl.datePicker = {
    error: new ReactiveVar(''),
    card,
    date: new ReactiveVar(initialDate && isValidDate(new Date(initialDate)) ? new Date(initialDate) : new Date('invalid')),
    defaultTime,
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
  if (isValidDate(dp.date.get())) {
    const dateInput = tpl.find('#date');
    const timeInput = tpl.find('#time');

    if (dateInput) {
      dateInput.value = formatDate(dp.date.get());
    }
    if (timeInput && !timeInput.value && dp.defaultTime) {
      const defaultDate = new Date(dp.defaultTime);
      timeInput.value = formatTime(defaultDate);
    } else if (timeInput && isValidDate(dp.date.get())) {
      timeInput.value = formatTime(dp.date.get());
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
 * @param {Object} callbacks
 * @param {Function} callbacks.storeDate - Called with (date) when form is submitted
 * @param {Function} callbacks.deleteDate - Called when delete button is clicked
 */
export function datePickerEvents({ storeDate, deleteDate }) {
  return {
    'change .js-date-field'(evt, tpl) {
      // Native HTML date input validation
      const dateValue = tpl.find('#date').value;
      if (dateValue) {
        // HTML date input format is always YYYY-MM-DD
        const dateObj = new Date(dateValue + 'T12:00:00');
        if (isValidDate(dateObj)) {
          tpl.datePicker.error.set('');
        } else {
          tpl.datePicker.error.set('invalid-date');
        }
      }
    },
    'change .js-time-field'(evt, tpl) {
      // Native HTML time input validation
      const timeValue = tpl.find('#time').value;
      if (timeValue) {
        // HTML time input format is always HH:mm
        const timeObj = new Date(`1970-01-01T${timeValue}:00`);
        if (isValidDate(timeObj)) {
          tpl.datePicker.error.set('');
        } else {
          tpl.datePicker.error.set('invalid-time');
        }
      }
    },
    'submit .edit-date'(evt, tpl) {
      evt.preventDefault();

      const dateValue = evt.target.date.value;
      const timeValue = evt.target.time.value || '12:00'; // Default to 12:00 if no time given

      if (!dateValue) {
        tpl.datePicker.error.set('invalid-date');
        evt.target.date.focus();
        return;
      }

      // Combine date and time: HTML date input is YYYY-MM-DD, time input is HH:mm
      const dateTimeString = `${dateValue}T${timeValue}:00`;
      const newCompleteDate = new Date(dateTimeString);

      if (!isValidDate(newCompleteDate)) {
        tpl.datePicker.error.set('invalid');
        return;
      }

      storeDate.call(tpl, newCompleteDate);
      Popup.back();
    },
    'click .js-delete-date'(evt, tpl) {
      evt.preventDefault();
      deleteDate.call(tpl);
      Popup.back();
    },
  };
}
