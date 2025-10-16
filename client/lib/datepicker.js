import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import moment from 'moment/min/moment-with-locales';

// Helper function to replace HH with H for 24 hours format, because H allows also single-digit hours
function adjustedTimeFormat() {
  return moment
    .localeData()
    .longDateFormat('LT');
}

//   .replace(/HH/i, 'H');

export class DatePicker extends BlazeComponent {
  template() {
    return 'datepicker';
  }

  onCreated(defaultTime = '1970-01-01 08:00:00') {
    this.error = new ReactiveVar('');
    this.card = this.data();
    this.date = new ReactiveVar(moment.invalid());
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
    if (this.date.get().isValid()) {
      const dateInput = this.find('#date');
      const timeInput = this.find('#time');
      
      if (dateInput) {
        dateInput.value = this.date.get().format('YYYY-MM-DD');
      }
      if (timeInput && !timeInput.value && this.defaultTime) {
        const defaultMoment = moment(this.defaultTime);
        timeInput.value = defaultMoment.format('HH:mm');
      } else if (timeInput && this.date.get().isValid()) {
        timeInput.value = this.date.get().format('HH:mm');
      }
    }
  }

  showDate() {
    if (this.date.get().isValid()) return this.date.get().format('YYYY-MM-DD');
    return '';
  }
  showTime() {
    if (this.date.get().isValid()) return this.date.get().format('HH:mm');
    return '';
  }
  dateFormat() {
    return moment.localeData().longDateFormat('L');
  }
  timeFormat() {
    return moment.localeData().longDateFormat('LT');
  }

  events() {
    return [
      {
        'change .js-date-field'() {
          // Native HTML date input validation
          const dateValue = this.find('#date').value;
          if (dateValue) {
            const dateMoment = moment(dateValue, 'YYYY-MM-DD', true);
            if (dateMoment.isValid()) {
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
            const timeMoment = moment(timeValue, 'HH:mm', true);
            if (timeMoment.isValid()) {
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

          const newCompleteDate = moment(`${dateValue} ${timeValue}`, 'YYYY-MM-DD HH:mm', true);
          
          if (!newCompleteDate.isValid()) {
            this.error.set('invalid');
            return;
          }

          this._storeDate(newCompleteDate.toDate());
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
