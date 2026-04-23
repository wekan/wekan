import {
  setupDatePicker,
  datePickerRendered,
  datePickerHelpers,
  datePickerEvents,
} from '/client/lib/datepicker';

Template.datepicker.onCreated(function () {
  setupDatePicker(this);
});

Template.datepicker.onRendered(function () {
  datePickerRendered(this);
});

Template.datepicker.helpers(datePickerHelpers());
