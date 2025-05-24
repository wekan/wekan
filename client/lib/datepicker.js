import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { Popup } from '/imports/ui/lib/popup';
import { Utils } from '/client/lib/utils';
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
    const $picker = this.$('.js-datepicker')
      .datepicker({
        todayHighlight: true,
        todayBtn: 'linked',
        language: TAPi18n.getLanguage(),
        weekStart: this.startDayOfWeek(),
        calendarWeeks: true,
        format: moment.localeData().longDateFormat('L').toLowerCase(),
      })
      .on(
        'changeDate',
        function(evt) {
          // Format date according to locale
          const localizedDate = moment(evt.date).format('L');
          this.find('#date').value = localizedDate;
          this.error.set('');
          const timeInput = this.find('#time');
          timeInput.focus();
          if (!timeInput.value && this.defaultTime) {
            const currentHour = evt.date.getHours();
            const defaultMoment = moment(
              currentHour > 0 ? evt.date : this.defaultTime,
            ); // default to 8:00 am local time
            timeInput.value = defaultMoment.format('LT');
          }
        }.bind(this),
      );

    if (this.date.get().isValid()) {
      $picker.datepicker('update', this.date.get().toDate());
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
    return [
      {
        'keyup .js-date-field'() {
          // parse for localized date format in strict mode
         const normalizedValue = Utils.normalizeDigits(this.find('#date').value);
          const dateMoment = moment(normalizedValue, 'L', true);
          if (dateMoment.isValid()) {
            this.error.set('');
            this.$('.js-datepicker').datepicker('update', dateMoment.toDate());
          }
        },
        'keyup .js-time-field'() {
          // parse for localized time format in strict mode
          const normalizedValue = Utils.normalizeDigits(this.find('#time').value);
          const dateMoment = moment(
           normalizedValue,
           adjustedTimeFormat(),
            true,
          );
          if (dateMoment.isValid()) {
            this.error.set('');
          }
        },
        'submit .edit-date'(evt) {
          evt.preventDefault();

          const timeValue = Utils.normalizeDigits(evt.target.time.value);
          const dateValue = Utils.normalizeDigits(evt.target.date.value);

          // Use locale-aware parsing
          const time = timeValue || moment().format('LT');
          const dateFormat = moment.localeData().longDateFormat('L');
          const timeFormat = adjustedTimeFormat();

          const newDate = moment(dateValue, dateFormat, true);
          const newTime = moment(time, timeFormat, true);
          const dateString = `${dateValue} ${time}`;
          const newCompleteDate = moment(dateString, `${dateFormat} ${timeFormat}`, true);

          if (!newTime.isValid()) {
            this.error.set('invalid-time');
            evt.target.time.focus();
          }
          if (!newDate.isValid()) {
            this.error.set('invalid-date');
            evt.target.date.focus();
          }
          if (newCompleteDate.isValid()) {
            this._storeDate(newCompleteDate.toDate());
            Popup.back();
          } else if (!this.error) {
            this.error.set('invalid');
          }
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
