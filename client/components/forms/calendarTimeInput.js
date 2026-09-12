import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { initialTimeValue, parseTimeInput } from '/imports/lib/datePickerTime';

Template.calendarTimeInput.onCreated(function () {
  this.time = new ReactiveVar('12:00');
  this.autorun(() => {
    const data = Template.currentData();
    this.time.set((data.value ? parseTimeInput(data.value) : null) || initialTimeValue(null, data.defaultTime) || '12:00');
  });
});

Template.calendarTimeInput.helpers({
  hours() {
    const selected = Template.instance().time.get().split(':')[0];
    return Array.from({ length: 24 }, (_, number) => {
      const value = String(number).padStart(2, '0');
      return { value, selected: value === selected };
    });
  },
  minutes() {
    const selected = Template.instance().time.get().split(':')[1];
    return Array.from({ length: 60 }, (_, number) => {
      const value = String(number).padStart(2, '0');
      return { value, selected: value === selected };
    });
  },
  nativeTime() { return Template.instance().time.get(); },
});

Template.calendarTimeInput.events({
  'change .js-calendar-native-time'(event, tpl) {
    const value = parseTimeInput(event.currentTarget.value);
    if (value) tpl.time.set(value);
  },
  'change select'(event, tpl) {
    const value = `${tpl.find('.js-calendar-hour').value}:${tpl.find('.js-calendar-minute').value}`;
    tpl.time.set(value);
    const input = tpl.find('.js-calendar-native-time');
    input.value = value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  },
});
