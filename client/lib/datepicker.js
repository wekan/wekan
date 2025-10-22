import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { 
  formatDateTime, 
  formatDate, 
  formatDateByUserPreference,
  formatTime, 
  getISOWeek, 
  isValidDate, 
  isBefore, 
  isAfter, 
  isSame, 
  add, 
  subtract, 
  startOf, 
  endOf, 
  format, 
  parseDate, 
  now, 
  createDate, 
  fromNow, 
  calendar 
} from '/imports/lib/dateUtils';

// Helper function to get time format for 24 hours
function adjustedTimeFormat() {
  return 'HH:mm';
}

//   .replace(/HH/i, 'H');

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
    // Set initial values for text and time inputs
    if (isValidDate(this.date.get())) {
      const dateInput = this.find('#date');
      const timeInput = this.find('#time');
      
      if (dateInput) {
        // Use user's preferred format for text input
        const currentUser = ReactiveCache.getCurrentUser();
        const userFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
        dateInput.value = formatDateByUserPreference(this.date.get(), userFormat, false);
      }
      if (timeInput) {
        if (!timeInput.value && this.defaultTime) {
          const defaultDate = new Date(this.defaultTime);
          timeInput.value = formatTime(defaultDate);
        } else if (isValidDate(this.date.get())) {
          timeInput.value = formatTime(this.date.get());
        }
      }
    }
  }

  showDate() {
    if (isValidDate(this.date.get())) {
      // Use user's preferred format for display, but HTML date input needs YYYY-MM-DD
      const currentUser = ReactiveCache.getCurrentUser();
      const userFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
      return formatDateByUserPreference(this.date.get(), userFormat, false);
    }
    return '';
  }
  showTime() {
    if (isValidDate(this.date.get())) return formatTime(this.date.get());
    return '';
  }
  dateFormat() {
    const currentUser = ReactiveCache.getCurrentUser();
    const userFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    // Convert format to localized placeholder
    switch (userFormat) {
      case 'DD-MM-YYYY':
        return TAPi18n.__('date-format-dd-mm-yyyy') || 'PP-KK-VVVV';
      case 'MM-DD-YYYY':
        return TAPi18n.__('date-format-mm-dd-yyyy') || 'KK-PP-VVVV';
      case 'YYYY-MM-DD':
      default:
        return TAPi18n.__('date-format-yyyy-mm-dd') || 'VVVV-KK-PP';
    }
  }
  timeFormat() {
    return 'LT';
  }

  events() {
    return [
      {
        'change .js-date-field'() {
          // Text input date validation
          const dateInput = this.find('#date');
          if (!dateInput) return;
          
          const dateValue = dateInput.value;
          if (dateValue) {
            // Try to parse different date formats
            const formats = [
              'YYYY-MM-DD',
              'DD-MM-YYYY', 
              'MM-DD-YYYY',
              'DD/MM/YYYY',
              'MM/DD/YYYY',
              'DD.MM.YYYY',
              'MM.DD.YYYY'
            ];
            
            let parsedDate = null;
            for (const format of formats) {
              parsedDate = parseDate(dateValue, [format], true);
              if (parsedDate) break;
            }
            
            // Fallback to native Date parsing
            if (!parsedDate) {
              parsedDate = new Date(dateValue);
            }

            if (isValidDate(parsedDate)) {
              this.error.set('');
            } else {
              this.error.set('invalid-date');
            }
          }
        },
        'change .js-time-field'() {
          // Native HTML time input validation
          const timeInput = this.find('#time');
          if (!timeInput) return;
          
          const timeValue = timeInput.value;
          if (timeValue) {
            const timeObj = new Date(`1970-01-01T${timeValue}`);
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

          // Try to parse different date formats
          const formats = [
            'YYYY-MM-DD',
            'DD-MM-YYYY', 
            'MM-DD-YYYY',
            'DD/MM/YYYY',
            'MM/DD/YYYY',
            'DD.MM.YYYY',
            'MM.DD.YYYY'
          ];
          
          let parsedDate = null;
          for (const format of formats) {
            parsedDate = parseDate(dateValue, [format], true);
            if (parsedDate) break;
          }
          
          // Fallback to native Date parsing
          if (!parsedDate) {
            parsedDate = new Date(dateValue);
          }

          if (!isValidDate(parsedDate)) {
            this.error.set('invalid');
            return;
          }

          // Combine with time
          const timeObj = new Date(`1970-01-01T${timeValue}`);
          if (!isValidDate(timeObj)) {
            this.error.set('invalid-time');
            return;
          }

          // Set the time on the parsed date
          parsedDate.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);

          this._storeDate(parsedDate);
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
