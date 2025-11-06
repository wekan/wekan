import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

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

export class DatePicker extends BlazeComponent {
  template() {
    return 'datepicker';
  }

  onCreated(defaultTime = '1970-01-01 08:00:00') {
    this.error = new ReactiveVar('');
    this.card = this.data();
    this.date = new ReactiveVar(new Date('invalid'));
    this.defaultTime = defaultTime;
  }

  startDayOfWeek() {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return currentUser.getStartDayOfWeek();
    } else {
      return 1;
    }
  }

  onRendered() {
    // Set initial values for native HTML inputs
    if (isValidDate(this.date.get())) {
      const dateInput = this.find('#date');
      const timeInput = this.find('#time');
      
      if (dateInput) {
        dateInput.value = formatDate(this.date.get());
      }
      if (timeInput && !timeInput.value && this.defaultTime) {
        const defaultDate = new Date(this.defaultTime);
        timeInput.value = formatTime(defaultDate);
      } else if (timeInput && isValidDate(this.date.get())) {
        timeInput.value = formatTime(this.date.get());
      }
    }
  }

  showDate() {
    if (isValidDate(this.date.get())) return formatDate(this.date.get());
    return '';
  }
  showTime() {
    if (isValidDate(this.date.get())) return formatTime(this.date.get());
    return '';
  }
  dateFormat() {
    return 'YYYY-MM-DD';
  }
  timeFormat() {
    return 'HH:mm';
  }

  events() {
    return [
      {
        'change .js-date-field'() {
          // Native HTML date input validation
          const dateValue = this.find('#date').value;
          if (dateValue) {
            // HTML date input format is always YYYY-MM-DD
            const dateObj = new Date(dateValue + 'T12:00:00');
            if (isValidDate(dateObj)) {
              this.error.set('');
            } else {
              this.error.set('invalid-date');
            }
          }
        },
        'change .js-time-field'() {
          // Native HTML time input validation
          const timeValue = this.find('#time').value;
          if (timeValue) {
            // HTML time input format is always HH:mm
            const timeObj = new Date(`1970-01-01T${timeValue}:00`);
            if (isValidDate(timeObj)) {
              this.error.set('');
            } else {
              this.error.set('invalid-time');
            }
          }
        },
        'submit .edit-date'(evt) {
          evt.preventDefault();

          const dateValue = evt.target.date.value;
          const timeValue = evt.target.time.value || '12:00'; // Default to 12:00 if no time given
          
          if (!dateValue) {
            this.error.set('invalid-date');
            evt.target.date.focus();
            return;
          }

          // Combine date and time: HTML date input is YYYY-MM-DD, time input is HH:mm
          const dateTimeString = `${dateValue}T${timeValue}:00`;
          const newCompleteDate = new Date(dateTimeString);
          
          if (!isValidDate(newCompleteDate)) {
            this.error.set('invalid');
            return;
          }

          this._storeDate(newCompleteDate);
          Popup.back();
        },
        'click .js-delete-date'(evt) {
          evt.preventDefault();
          this._deleteDate();
          Popup.back();
        },
      },
    ];
  }
}
