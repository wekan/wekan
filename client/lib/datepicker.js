import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import moment from 'moment/min/moment-with-locales';
import { Utils } from './utils';

// Helper function to replace HH with H for 24 hours format
function adjustedTimeFormat() {
  return moment.localeData().longDateFormat('LT');
}

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
    const $picker = this.$('.js-datepicker')
      .datepicker({
        todayHighlight: true,
        todayBtn: 'linked',
        language: TAPi18n.getLanguage(),
        weekStart: this.startDayOfWeek(),
        calendarWeeks: true,
        beforeParse: (value) => Utils.normalizeDigits(value),
      })
      .on(
        'changeDate',
        function(evt) {
          const normalizedDate = moment(evt.date).format('L');
          this.find('#date').value = normalizedDate;
          this.error.set('');
          this._handleTimeInput(evt);
        }.bind(this),
      );

    if (this.date.get().isValid()) {
      $picker.datepicker('update', this.date.get().toDate());
    }
  }

  _handleTimeInput(evt) {
    const timeInput = this.find('#time');
    timeInput.focus();
    if (!timeInput.value && this.defaultTime) {
      const currentHour = evt.date.getHours();
      const defaultMoment = moment(
        currentHour > 0 ? evt.date : this.defaultTime,
      );
      timeInput.value = defaultMoment.format('LT');
    }
  }

  showDate() {
    if (this.date.get().isValid()) return this.date.get().format('L');
    return '';
  }
  showTime() {
    if (this.date.get().isValid()) return this.date.get().format('LT');
    return '';
  }
  dateFormat() {
    return moment.localeData().longDateFormat('L');
  }
  timeFormat() {
    return moment.localeData().longDateFormat('LT');
  }

  events() {
    return [{
      'keyup .js-date-field'() {
        const rawValue = this.find('#date').value;
        const normalizedValue = Utils.normalizeDigits(rawValue);
        const dateMoment = moment(normalizedValue, 'L', true);

        if (dateMoment.isValid()) {
          this.error.set('');
          this.$('.js-datepicker').datepicker('update', dateMoment.toDate());
        }
      },

      'keyup .js-time-field'() {
        const rawValue = this.find('#time').value;
        const normalizedValue = Utils.normalizeDigits(rawValue);
        const timeMoment = moment(normalizedValue, adjustedTimeFormat(), true);

        if (timeMoment.isValid()) {
          this.error.set('');
        }
      },

      'submit .edit-date'(evt) {
        evt.preventDefault();

        const dateValue = Utils.normalizeDigits(evt.target.date.value);
        const timeValue = Utils.normalizeDigits(evt.target.time.value) ||
                         moment(new Date().setHours(12, 0, 0)).format('LT');

        const dateString = `${dateValue} ${timeValue}`;
        const format = `L ${adjustedTimeFormat()}`;
        const newDate = moment(dateString, format, true);

        if (!newDate.isValid()) {
          this._handleDateTimeError(evt, dateValue, timeValue);
          return;
        }

        this._storeDate(newDate.toDate());
        Popup.back();
      },

      'click .js-delete-date'(evt) {
        evt.preventDefault();
        this._deleteDate();
        Popup.back();
      }
    }];
  }

  _handleDateTimeError(evt, dateValue, timeValue) {
    const dateMoment = moment(dateValue, 'L', true);
    const timeMoment = moment(timeValue, adjustedTimeFormat(), true);

    if (!timeMoment.isValid()) {
      this.error.set('invalid-time');
      evt.target.time.focus();
    } else if (!dateMoment.isValid()) {
      this.error.set('invalid-date');
      evt.target.date.focus();
    } else {
      this.error.set('invalid');
    }
  }
}
