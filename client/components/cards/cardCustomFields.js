import { TAPi18n } from '/imports/i18n';
import {
  setupDatePicker,
  datePickerRendered,
  datePickerHelpers,
  datePickerEvents,
} from '/client/lib/datepicker';
import { ReactiveCache } from '/imports/reactiveCache';
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
import { CustomFieldStringTemplate } from '/client/lib/customFields'
import { getCurrentCardFromContext } from '/client/lib/currentCard';
import { EscapeActions } from '/client/lib/escapeActions';
import { getSidebarInstance } from '/client/features/sidebar/service';

Template.cardCustomFieldsPopup.helpers({
  hasCustomField() {
    const card = getCurrentCardFromContext();
    if (!card) return false;
    const customFieldId = this._id;
    return card.customFieldIndex(customFieldId) > -1;
  },
});

Template.cardCustomFieldsPopup.events({
  'click .js-select-field'(event) {
    const card = getCurrentCardFromContext();
    if (!card) return;
    const customFieldId = this._id;
    card.toggleCustomField(customFieldId);
    event.preventDefault();
  },
  'click .js-settings'(event) {
    EscapeActions.executeUpTo('detailsPane');
    const sidebar = getSidebarInstance();
    if (sidebar) {
      sidebar.setView('customFields');
    }
    event.preventDefault();
  },
});

// cardCustomField
Template.cardCustomField.helpers({
  getTemplate() {
    return `cardCustomField-${this.definition.type}`;
  },
});

Template.cardCustomField.onCreated(function () {
  this.card = getCurrentCardFromContext();
  this.customFieldId = Template.currentData()._id;
});

// cardCustomField-text
Template['cardCustomField-text'].onCreated(function () {
  this.card = getCurrentCardFromContext();
  this.customFieldId = Template.currentData()._id;
});

Template['cardCustomField-text'].events({
  'submit .js-card-customfield-text'(event, tpl) {
    event.preventDefault();
    const value = tpl.currentComponent ? tpl.currentComponent().getValue() : tpl.$('textarea').val();
    tpl.card.setCustomField(tpl.customFieldId, value);
  },
});

// cardCustomField-number
Template['cardCustomField-number'].onCreated(function () {
  this.card = getCurrentCardFromContext();
  this.customFieldId = Template.currentData()._id;
});

Template['cardCustomField-number'].events({
  'submit .js-card-customfield-number'(event, tpl) {
    event.preventDefault();
    const value = parseInt(tpl.find('input').value, 10);
    tpl.card.setCustomField(tpl.customFieldId, value);
  },
});

// cardCustomField-checkbox
Template['cardCustomField-checkbox'].onCreated(function () {
  this.card = getCurrentCardFromContext();
  this.customFieldId = Template.currentData()._id;
});

Template['cardCustomField-checkbox'].events({
  'click .js-checklist-item .check-box-unicode'(event, tpl) {
    tpl.card.setCustomField(tpl.customFieldId, !Template.currentData().value);
  },
  'click .js-checklist-item .check-box-container'(event, tpl) {
    tpl.card.setCustomField(tpl.customFieldId, !Template.currentData().value);
  },
});

// cardCustomField-currency
Template['cardCustomField-currency'].onCreated(function () {
  this.card = getCurrentCardFromContext();
  this.customFieldId = Template.currentData()._id;
  this.currencyCode = Template.currentData().definition.settings.currencyCode;
});

Template['cardCustomField-currency'].helpers({
  formattedValue() {
    const locale = TAPi18n.getLanguage();
    const tpl = Template.instance();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: tpl.currencyCode,
    }).format(this.value);
  },
});

Template['cardCustomField-currency'].events({
  'submit .js-card-customfield-currency'(event, tpl) {
    event.preventDefault();
    // To allow input separated by comma, the comma is replaced by a period.
    const value = Number(tpl.find('input').value.replace(/,/i, '.'), 10);
    tpl.card.setCustomField(tpl.customFieldId, value);
  },
});

// cardCustomField-date
Template['cardCustomField-date'].onCreated(function () {
  this.card = getCurrentCardFromContext();
  this.customFieldId = Template.currentData()._id;
  const self = this;
  self.date = ReactiveVar();
  self.now = ReactiveVar(now());
  window.setInterval(() => {
    self.now.set(now());
  }, 60000);

  self.autorun(() => {
    self.date.set(new Date(Template.currentData().value));
  });
});

Template['cardCustomField-date'].helpers({
  showWeek() {
    return getISOWeek(Template.instance().date.get()).toString();
  },
  showWeekOfYear() {
    const user = ReactiveCache.getCurrentUser();
    if (!user) {
      return false;
    }
    return user.isShowWeekOfYear();
  },
  showDate() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(Template.instance().date.get(), dateFormat, true);
  },
  showISODate() {
    return Template.instance().date.get().toISOString();
  },
  classes() {
    const tpl = Template.instance();
    if (
      isBefore(tpl.date.get(), tpl.now.get(), 'minute') &&
      isBefore(tpl.now.get(), this.value, 'minute')
    ) {
      return 'current';
    }
    return '';
  },
  showTitle() {
    return `${TAPi18n.__('card-start-on')} ${Template.instance().date.get().toLocaleString()}`;
  },
});

Template['cardCustomField-date'].events({
  'click .js-edit-date': Popup.open('cardCustomField-date'),
});

// cardCustomField-datePopup
Template['cardCustomField-datePopup'].onCreated(function () {
  const data = Template.currentData();
  setupDatePicker(this, {
    initialDate: data.value ? data.value : undefined,
  });
  // Override card and store customFieldId for store/delete callbacks
  this.datePicker.card = getCurrentCardFromContext();
  this.customFieldId = data._id;
});

Template['cardCustomField-datePopup'].onRendered(function () {
  datePickerRendered(this);
});

Template['cardCustomField-datePopup'].helpers(datePickerHelpers());

Template['cardCustomField-datePopup'].events(datePickerEvents({
  storeDate(date) {
    this.datePicker.card.setCustomField(this.customFieldId, date);
  },
  deleteDate() {
    this.datePicker.card.setCustomField(this.customFieldId, '');
  },
}));

// cardCustomField-dropdown
Template['cardCustomField-dropdown'].onCreated(function () {
  this.card = getCurrentCardFromContext();
  this.customFieldId = Template.currentData()._id;
  this._items = Template.currentData().definition.settings.dropdownItems;
  this.items = this._items.slice(0);
  this.items.unshift({
    _id: '',
    name: TAPi18n.__('custom-field-dropdown-none'),
  });
});

Template['cardCustomField-dropdown'].helpers({
  items() {
    return Template.instance().items;
  },
  selectedItem() {
    const tpl = Template.instance();
    const selected = tpl._items.find(item => {
      return item._id === this.value;
    });
    return selected
      ? selected.name
      : TAPi18n.__('custom-field-dropdown-unknown');
  },
});

Template['cardCustomField-dropdown'].events({
  'submit .js-card-customfield-dropdown'(event, tpl) {
    event.preventDefault();
    const value = tpl.find('select').value;
    tpl.card.setCustomField(tpl.customFieldId, value);
  },
});

// cardCustomField-stringtemplate
Template['cardCustomField-stringtemplate'].onCreated(function () {
  this.card = getCurrentCardFromContext();
  this.customFieldId = Template.currentData()._id;
  this.customField = new CustomFieldStringTemplate(Template.currentData().definition);
  this.stringtemplateItems = new ReactiveVar(Template.currentData().value ?? []);
});

Template['cardCustomField-stringtemplate'].helpers({
  formattedValue() {
    const tpl = Template.instance();
    const ret = tpl.customField.getFormattedValue(this.value);
    return ret;
  },
  stringtemplateItems() {
    return Template.instance().stringtemplateItems.get();
  },
});

Template['cardCustomField-stringtemplate'].events({
  'submit .js-card-customfield-stringtemplate'(event, tpl) {
    event.preventDefault();
    const items = tpl.stringtemplateItems.get();
    tpl.card.setCustomField(tpl.customFieldId, items);
  },

  'keydown .js-card-customfield-stringtemplate-item'(event, tpl) {
    if (event.keyCode === 13) {
      event.preventDefault();

      if (event.target.value.trim() || event.metaKey || event.ctrlKey) {
        const inputLast = tpl.find('input.last');

        let items = Array.from(tpl.findAll('input'))
          .map(input => input.value)
          .filter(value => !!value.trim());

        if (event.target === inputLast) {
          inputLast.value = '';
        } else if (event.target.nextSibling === inputLast) {
          inputLast.focus();
        } else {
          event.target.blur();

          const idx = Array.from(tpl.findAll('input')).indexOf(
            event.target,
          );
          items.splice(idx + 1, 0, '');

          Tracker.afterFlush(() => {
            const element = tpl.findAll('input')[idx + 1];
            element.focus();
            element.value = '';
          });
        }

        tpl.stringtemplateItems.set(items);
      }
      if (event.metaKey || event.ctrlKey) {
        tpl.find('button[type=submit]').click();
      }
    }
  },

  'blur .js-card-customfield-stringtemplate-item'(event, tpl) {
    if (
      !event.target.value.trim() ||
      event.target === tpl.find('input.last')
    ) {
      const items = Array.from(tpl.findAll('input'))
        .map(input => input.value)
        .filter(value => !!value.trim());
      tpl.stringtemplateItems.set(items);
      tpl.find('input.last').value = '';
    }
  },

  'click .js-close-inlined-form'(event, tpl) {
    tpl.stringtemplateItems.set(Template.currentData().value ?? []);
  },
});
