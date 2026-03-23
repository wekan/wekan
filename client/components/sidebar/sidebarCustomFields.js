import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import CustomFields from '/models/customFields';

Template.customFieldsSidebar.helpers({
  customFields() {
    const ret = ReactiveCache.getCustomFields({
      boardIds: { $in: [Session.get('currentBoard')] },
    });
    return ret;
  },
});

Template.customFieldsSidebar.events({
  'click .js-open-create-custom-field': Popup.open('createCustomField'),
  'click .js-edit-custom-field': Popup.open('editCustomField'),
});

const CUSTOM_FIELD_TYPES = [
  'text',
  'number',
  'date',
  'dropdown',
  'currency',
  'checkbox',
  'stringtemplate',
];

const CURRENCY_LIST = [
  { name: 'US Dollar', code: 'USD' },
  { name: 'Euro', code: 'EUR' },
  { name: 'Yen', code: 'JPY' },
  { name: 'Pound Sterling', code: 'GBP' },
  { name: 'Australian Dollar', code: 'AUD' },
  { name: 'Canadian Dollar', code: 'CAD' },
  { name: 'Swiss Franc', code: 'CHF' },
  { name: 'Yuan Renminbi', code: 'CNY' },
  { name: 'Hong Kong Dollar', code: 'HKD' },
  { name: 'New Zealand Dollar', code: 'NZD' },
];

function getDropdownItems(tpl) {
  const items = tpl.dropdownItems.get();
  Array.from(tpl.findAll('.js-field-settings-dropdown input')).forEach(
    (el, index) => {
      if (!items[index])
        items[index] = {
          _id: Random.id(6),
        };
      items[index].name = el.value.trim();
    },
  );
  return items;
}

function getSettings(tpl) {
  const settings = {};
  switch (tpl.type.get()) {
    case 'currency': {
      const currencyCode = tpl.currencyCode.get();
      settings.currencyCode = currencyCode;
      break;
    }
    case 'dropdown': {
      const dropdownItems = getDropdownItems(tpl).filter(
        item => !!item.name.trim(),
      );
      settings.dropdownItems = dropdownItems;
      break;
    }
    case 'stringtemplate': {
      const stringtemplateFormat = tpl.stringtemplateFormat.get();
      settings.stringtemplateFormat = stringtemplateFormat;

      const stringtemplateSeparator = tpl.stringtemplateSeparator.get();
      settings.stringtemplateSeparator = stringtemplateSeparator;
      break;
    }
  }
  return settings;
}

Template.createCustomFieldPopup.onCreated(function () {
  const data = Template.currentData();
  this.type = new ReactiveVar(
    data.type ? data.type : CUSTOM_FIELD_TYPES[0],
  );

  this.currencyCode = new ReactiveVar(
    data.settings && data.settings.currencyCode
      ? data.settings.currencyCode
      : CURRENCY_LIST[0].code,
  );

  this.dropdownItems = new ReactiveVar(
    data.settings && data.settings.dropdownItems
      ? data.settings.dropdownItems
      : [],
  );

  this.stringtemplateFormat = new ReactiveVar(
    data.settings && data.settings.stringtemplateFormat
      ? data.settings.stringtemplateFormat
      : '',
  );

  this.stringtemplateSeparator = new ReactiveVar(
    data.settings && data.settings.stringtemplateSeparator
      ? data.settings.stringtemplateSeparator
      : '',
  );
});

Template.createCustomFieldPopup.helpers({
  types() {
    const currentType = Template.currentData().type;
    return CUSTOM_FIELD_TYPES.map(type => {
      return {
        value: type,
        name: TAPi18n.__(`custom-field-${type}`),
        selected: type === currentType,
      };
    });
  },

  isTypeNotSelected(type) {
    return Template.instance().type.get() !== type;
  },

  getCurrencyCodes() {
    const currentCode = Template.instance().currencyCode.get();

    return CURRENCY_LIST.map(({ name, code }) => {
      return {
        name: `${code} - ${name}`,
        value: code,
        selected: code === currentCode,
      };
    });
  },

  getDropdownItems() {
    return getDropdownItems(Template.instance());
  },

  getStringtemplateFormat() {
    return Template.instance().stringtemplateFormat.get();
  },

  getStringtemplateSeparator() {
    return Template.instance().stringtemplateSeparator.get();
  },
});

Template.createCustomFieldPopup.events({
  'change .js-field-type'(evt, tpl) {
    const value = evt.target.value;
    tpl.type.set(value);
  },
  'change .js-field-currency'(evt, tpl) {
    const value = evt.target.value;
    tpl.currencyCode.set(value);
  },
  'keydown .js-dropdown-item.last'(evt, tpl) {
    if (evt.target.value.trim() && evt.keyCode === 13) {
      const items = getDropdownItems(tpl);
      tpl.dropdownItems.set(items);
      evt.target.value = '';
    }
  },
  'input .js-field-stringtemplate-format'(evt, tpl) {
    const value = evt.target.value;
    tpl.stringtemplateFormat.set(value);
  },
  'input .js-field-stringtemplate-separator'(evt, tpl) {
    const value = evt.target.value;
    tpl.stringtemplateSeparator.set(value);
  },
  'click .js-field-show-on-card'(evt) {
    let $target = $(evt.target);
    if (!$target.hasClass('js-field-show-on-card')) {
      $target = $target.parent();
    }
    $target.find('.materialCheckBox').toggleClass('is-checked');
    $target.toggleClass('is-checked');
  },
  'click .js-field-automatically-on-card'(evt) {
    let $target = $(evt.target);
    if (!$target.hasClass('js-field-automatically-on-card')) {
      $target = $target.parent();
    }
    $target.find('.materialCheckBox').toggleClass('is-checked');
    $target.toggleClass('is-checked');
  },
  'click .js-field-always-on-card'(evt) {
    let $target = $(evt.target);
    if (!$target.hasClass('js-field-always-on-card')) {
      $target = $target.parent();
    }
    $target.find('.materialCheckBox').toggleClass('is-checked');
    $target.toggleClass('is-checked');
  },
  'click .js-field-showLabel-on-card'(evt) {
    let $target = $(evt.target);
    if (!$target.hasClass('js-field-showLabel-on-card')) {
      $target = $target.parent();
    }
    $target.find('.materialCheckBox').toggleClass('is-checked');
    $target.toggleClass('is-checked');
  },
  'click .js-field-show-sum-at-top-of-list'(evt) {
    let $target = $(evt.target);
    if (!$target.hasClass('js-field-show-sum-at-top-of-list')) {
      $target = $target.parent();
    }
    $target.find('.materialCheckBox').toggleClass('is-checked');
    $target.toggleClass('is-checked');
  },
  'click .primary'(evt, tpl) {
    evt.preventDefault();

    const data = {
      name: tpl.find('.js-field-name').value.trim(),
      type: tpl.type.get(),
      settings: getSettings(tpl),
      showOnCard: tpl.find('.js-field-show-on-card.is-checked') !== null,
      showLabelOnMiniCard:
        tpl.find('.js-field-showLabel-on-card.is-checked') !== null,
      automaticallyOnCard:
        tpl.find('.js-field-automatically-on-card.is-checked') !== null,
      alwaysOnCard:
        tpl.find('.js-field-always-on-card.is-checked') !== null,
      showSumAtTopOfList:
        tpl.find('.js-field-show-sum-at-top-of-list.is-checked') !== null,
    };

    const currentData = Template.currentData();
    // insert or update
    if (!currentData._id) {
      data.boardIds = [Session.get('currentBoard')];
      CustomFields.insert(data);
    } else {
      CustomFields.update(currentData._id, { $set: data });
    }

    Popup.back();
  },
  'click .js-delete-custom-field': Popup.afterConfirm(
    'deleteCustomField',
    function() {
      const customField = ReactiveCache.getCustomField(this._id);
      if (customField.boardIds.length > 1) {
        CustomFields.update(customField._id, {
          $pull: {
            boardIds: Session.get('currentBoard'),
          },
        });
      } else {
        CustomFields.remove(customField._id);
      }
      Popup.back();
    },
  ),
});

/*Template.deleteCustomFieldPopup.events({
  'submit'(evt) {
    const customFieldId = this._id;
    CustomFields.remove(customFieldId);
    Popup.back();
  }
});*/
