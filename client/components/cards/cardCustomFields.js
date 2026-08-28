import { TAPi18n } from '/imports/i18n';
import {
  setupDatePicker,
  datePickerRendered,
  datePickerHelpers,
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
import { formatNumberValue } from '/imports/lib/customNumberFormat';
import { Utils } from '/client/lib/utils';
import { subscribeDateNowTicker } from '/client/lib/dateNowTicker';

Template.customFieldCopyButton.events({
  'click .js-copy-custom-field'(event, tpl) {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget.closest('form');
    const checkbox = form?.querySelector('input[type="checkbox"]');
    const select = form?.querySelector('select');
    const date = form?.querySelector('input[type="date"]');
    const time = form?.querySelector('input[type="time"]');
    const stringItems = form?.querySelectorAll(
      '.js-card-customfield-stringtemplate-item',
    );
    const editor = form?.querySelector(
      'textarea, input[type="text"], input[type="number"]',
    );
    let rawValue = Template.currentData()?.value;
    if (checkbox) {
      rawValue = checkbox.checked;
    } else if (select) {
      rawValue = select.selectedOptions[0]?.textContent?.trim() ?? '';
    } else if (date) {
      rawValue = [date.value, time?.value].filter(Boolean).join(' ');
    } else if (stringItems?.length) {
      rawValue = Array.from(stringItems)
        .map(input => input.value)
        .filter(value => value.trim());
    } else if (editor) {
      rawValue = editor.value;
    }
    let value;
    if (rawValue instanceof Date) {
      value = rawValue.toISOString();
    } else if (Array.isArray(rawValue)) {
      value = rawValue.join('\n');
    } else {
      value = rawValue == null ? '' : String(rawValue);
    }
    const promise = Utils.copyTextToClipboard(value);
    Utils.showCopied(promise, tpl.$('.copied-tooltip'));
  },
});

Template.cardCustomFieldsPopup.helpers({
  board() {
    const card = getCurrentCardFromContext();
    return card?.getRealBoard ? card.getRealBoard() : card?.board?.();
  },
  hasCustomField() {
    const card = getCurrentCardFromContext();
    if (!card) return false;
    const customFieldId = this._id;
    return card.customFieldIndex(customFieldId) > -1;
  },
});

Template.cardCustomFieldsPopup.events({
  async 'click .js-select-field'(event) {
    event.preventDefault();
    const card = getCurrentCardFromContext();
    if (!card) return;
    const customFieldId = this._id;
    const assigned = card.customFieldIndex(customFieldId) < 0;
    try {
      await Meteor.callAsync(
        'setCardCustomFieldAssigned', card.getRealId(), customFieldId, assigned);
    } catch (error) {
      alert(error.reason || error.message || TAPi18n.__('server-error'));
    }
  },
  // Editing a field, and making one, open in this same pop-over on top of the
  // list, so the back arrow returns to it and the card stays open behind. They
  // are the board's own forms - the same templates the sidebar list opens - so
  // there is one create form and one edit form, not a second pair for cards.
  // client/components/sidebar/sidebarCustomFields.jade
  'click .js-edit-custom-field': Popup.open('editCustomField'),
  // "Add custom field" sits OUTSIDE the list, so its data context is this
  // popup's own - which is the CARD. The form reads its context as the field
  // being edited, and a card has an `_id`, so it was read as an edit of a
  // custom field that does not exist and the new field was never inserted.
  // A new field is made from nothing, so it is handed nothing.
  'click .js-open-create-custom-field'(event) {
    Popup.open('createCustomField').call({}, event);
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

function openCustomFieldValueEditor(event, tpl) {
  // The Checkbox square is the direct on/off control. Only its surrounding row
  // uses this shared editor route.
  if (event.target.closest('.check-box-container')) return;
  event.preventDefault();
  event.stopPropagation();
  const trigger = tpl.find('.js-custom-field-edit-trigger');
  if (trigger) trigger.click();
}

function openCustomFieldValueEditorFromKeyboard(event) {
  if (event.currentTarget.matches('a, button')) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.currentTarget.click();
}

Template.cardCustomField.events({
  'click .js-edit-card-custom-field-value': openCustomFieldValueEditor,
  'keydown .js-edit-card-custom-field-value': openCustomFieldValueEditorFromKeyboard,
});

function persistedEditValue() {
  return Template.instance().data?.value;
}

// Titles belong to Template.cardCustomField, while displayed values belong to
// these nested type templates. Register on both sides of the Blaze boundary so
// every title, value and type-specific empty edit area behaves consistently.
[
  'text',
  'number',
  'checkbox',
  'currency',
  'dropdown',
  'stringtemplate',
].forEach(type => {
  Template[`cardCustomField-${type}`].events({
    'click .js-edit-card-custom-field-value': openCustomFieldValueEditor,
    'keydown .js-edit-card-custom-field-value': openCustomFieldValueEditorFromKeyboard,
  });
});

// cardCustomField-text
Template['cardCustomField-text'].onCreated(function () {
  this.card = getCurrentCardFromContext();
  this.customFieldId = Template.currentData()._id;
});

Template['cardCustomField-text'].helpers({
  editValue: persistedEditValue,
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

Template['cardCustomField-number'].helpers({
  editValue: persistedEditValue,
  // Render blank / cleared / non-numeric values as empty instead of "NaN" (#2091).
  formattedValue() {
    return formatNumberValue(this.value);
  },
});

Template['cardCustomField-number'].events({
  'submit .js-card-customfield-number'(event, tpl) {
    event.preventDefault();
    const rawValue = tpl.find('input').value;
    // A cleared/blank input parses to NaN; store '' instead so it renders empty
    // rather than as "NaN" (#2091).
    const parsed = parseInt(rawValue, 10);
    const value = Number.isNaN(parsed) ? '' : parsed;
    tpl.card.setCustomField(tpl.customFieldId, value);
  },
});

// cardCustomField-checkbox
Template['cardCustomField-checkbox'].onCreated(function () {
  this.card = getCurrentCardFromContext();
  this.customFieldId = Template.currentData()._id;
});

Template['cardCustomField-checkbox'].helpers({
  editValue: persistedEditValue,
});

Template['cardCustomField-checkbox'].events({
  'change .js-card-customfield-checkbox-input'(event, tpl) {
    // Editing is staged until Save, but its square must still show the staged
    // value immediately. The persisted `value` remains unchanged until submit,
    // so update only the editor's visual checkbox here.
    tpl.$('.js-card-customfield-checkbox-editor .materialCheckBox')
      .toggleClass('is-checked', event.currentTarget.checked);
  },
  async 'submit .js-card-customfield-checkbox-editor'(event, tpl) {
    event.preventDefault();
    const value = Boolean(
      tpl.find('.js-card-customfield-checkbox-input')?.checked,
    );
    try {
      await Meteor.callAsync(
        'setCardCustomFieldCheckbox', tpl.card.getRealId(), tpl.customFieldId, value);
    } catch (error) {
      alert(error.reason || error.message || TAPi18n.__('server-error'));
    }
  },
  async 'click .js-card-custom-field-checkbox .check-box-container'(event, tpl) {
    event.preventDefault();
    event.stopPropagation();
    // This template context is rebuilt from customFieldsWD whenever the saved
    // value changes. Using the Card object captured at onCreated kept the old
    // value after the first click, so a second click tried to save true again.
    const currentField = Template.currentData();
    if (!currentField || currentField._id !== tpl.customFieldId) return;
    const value = !Boolean(currentField.value);
    try {
      await Meteor.callAsync(
        'setCardCustomFieldCheckbox', tpl.card.getRealId(), tpl.customFieldId, value);
    } catch (error) {
      alert(error.reason || error.message || TAPi18n.__('server-error'));
    }
  },
});

// cardCustomField-currency
Template['cardCustomField-currency'].onCreated(function () {
  this.card = getCurrentCardFromContext();
  this.customFieldId = Template.currentData()._id;
  this.currencyCode = Template.currentData().definition.settings.currencyCode;
});

Template['cardCustomField-currency'].helpers({
  editValue: persistedEditValue,
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
  async 'submit .js-card-customfield-currency'(event, tpl) {
    event.preventDefault();
    // To allow input separated by comma, the comma is replaced by a period.
    const value = Number(tpl.find('input').value.trim().replace(/,/g, '.'));
    if (!Number.isFinite(value)) return;
    try {
      await Meteor.callAsync(
        'setCardCustomFieldCurrency',
        tpl.card.getRealId(),
        tpl.customFieldId,
        value,
      );
    } catch (error) {
      alert(error.reason || error.message || TAPi18n.__('server-error'));
    }
  },
});

// cardCustomField-date
Template['cardCustomField-date'].onCreated(function () {
  this.card = getCurrentCardFromContext();
  this.customFieldId = Template.currentData()._id;
  const self = this;
  self.date = ReactiveVar();
  const dateNowTicker = subscribeDateNowTicker();
  self.now = dateNowTicker.now;
  self.view.onViewDestroyed(dateNowTicker.unsubscribe);

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
    const dateFormat = currentUser ? currentUser.getDateFormat() : (window.localStorage.getItem('dateFormat') || 'YYYY-MM-DD');
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

// Date keeps its original direct popup opener. Clicking the title activates
// this same visible element through `.js-custom-field-edit-trigger`, while a
// click on the displayed datetime is handled here without a template hop.
Template['cardCustomField-date'].events({
  'click .js-edit-date': Popup.open('cardCustomField-date'),
});

// cardCustomField-datePopup
Template['cardCustomField-datePopup'].onCreated(function () {
  const data = Template.currentData();
  setupDatePicker(this, {
    initialDate: data.value ? data.value : undefined,
    storeDate: (date, card) => card.setCustomField(data._id, date),
    deleteDate: card => card.setCustomField(data._id, ''),
  });
  // A custom-field popup's data is the field definition, not the card.
  this.datePicker.card = getCurrentCardFromContext();
});

Template['cardCustomField-datePopup'].onRendered(function () {
  datePickerRendered(this);
});

Template['cardCustomField-datePopup'].helpers(datePickerHelpers());

// cardCustomField-dropdown
Template['cardCustomField-dropdown'].onCreated(function () {
  const data = Template.currentData();
  this.card = getCurrentCardFromContext();
  this.customFieldId = data._id;
  this._items = data.definition.settings.dropdownItems;
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
  isSelectedItem(itemId) {
    return (Template.instance().data.value ?? '') === itemId;
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
