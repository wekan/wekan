import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import CustomFields from '/models/customFields';
import { computeSortIndexMapping } from '/models/lib/boardSortReorder';

Template.customFieldsSidebar.helpers({
  customFields() {
    // #4165: ascending by the user-settable `sort` (fields created before it
    // existed have none and fall back to name - mirrors buildCustomFieldsWD's
    // fallback in models/lib/customFieldsWD.js).
    const ret = ReactiveCache.getCustomFields(
      { boardIds: { $in: [Session.get('currentBoard')] } },
      { sort: { sort: 1, name: 1 } },
    );
    return ret;
  },
});

// #4165: drag-and-drop reordering of the board's custom fields, mirroring the
// card-labels popup's own jQuery-ui sortable (client/components/cards/labels.js) -
// the smallest existing pattern for a short settings list rewriting its whole
// order on drop, rather than Lists' fractional-index drag (which is built for
// a long, frequently-reordered column of cards). `computeSortIndexMapping` is
// the same pure helper the All Boards page uses to turn a dropped order into
// sequential integers (models/lib/boardSortReorder.js).
Template.customFieldsSidebar.onRendered(function () {
  const tpl = this;
  const $list = tpl.$('.js-custom-fields-sidebar-list');

  $list.sortable({
    handle: '.js-custom-field-drag-handle',
    axis: 'y',
    tolerance: 'pointer',
    distance: 7,
    placeholder: 'custom-field-sidebar-item placeholder',
    start(evt, ui) {
      ui.placeholder.height(ui.helper.height());
    },
    stop() {
      const orderedIds = $list
        .children('li')
        .toArray()
        .map(el => Blaze.getData(el)._id)
        .filter(Boolean);
      const mapping = computeSortIndexMapping(orderedIds);
      Object.entries(mapping).forEach(([customFieldId, sort]) => {
        CustomFields.update(customFieldId, { $set: { sort } });
      });
    },
  });
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
  'dropdownMultiSelect',
  'currency',
  'checkbox',
  'stringtemplate',
];

// The multi-select dropdown reuses the exact same option-list definition
// mechanism (settings.dropdownItems) the single-select dropdown already has -
// same options-editing UI, same storage shape for the list of choices. Only
// the VALUE stored on a card differs (an array instead of a single id).
const DROPDOWN_LIKE_TYPES = ['dropdown', 'dropdownMultiSelect'];

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
    case 'dropdown':
    case 'dropdownMultiSelect': {
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

  // The single-select dropdown and the multi-select dropdown share the exact
  // same options-editing UI (settings.dropdownItems), so the settings block
  // shows for either type instead of duplicating it.
  isDropdownTypeNotSelected() {
    return !DROPDOWN_LIKE_TYPES.includes(Template.instance().type.get());
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

  // The template iterates `{{#each dropdownItems.get}}`. This component used to
  // be a BlazeComponent, where `dropdownItems` resolved to the instance's
  // ReactiveVar; after the migration to a plain Template that binding rendered
  // nothing (so dropdown options never appeared and were lost on save). Expose
  // the ReactiveVar as a helper again so `dropdownItems.get` works.
  dropdownItems() {
    return Template.instance().dropdownItems;
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
  'click .js-field-admin-only'(evt) {
    let $target = $(evt.target);
    if (!$target.hasClass('js-field-admin-only')) {
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

    // #3141: the control itself is only rendered for a board admin (see the
    // jade template), so a non-admin's form never has `.js-field-admin-only`
    // in it at all - leave `adminOnly` out of `data` rather than writing
    // `false` and silently clearing an admin's existing flag out from under
    // them via a non-admin's save of the same field.
    if (tpl.find('.js-field-admin-only')) {
      data.adminOnly = tpl.find('.js-field-admin-only.is-checked') !== null;
    }

    const currentData = Template.currentData();
    // Insert or update, decided by whether this form was opened ON a custom
    // field - not by whether its context merely HAS an `_id`. Opened from the
    // card's Custom Fields popup the context was the card, whose `_id` is a
    // card's, and the update below then wrote to a custom field that does not
    // exist: the new field was silently never created. An id that names no
    // custom field is a new field.
    const editing =
      currentData._id && ReactiveCache.getCustomField(currentData._id);

    if (!editing) {
      data.boardIds = [Session.get('currentBoard')];
      // #4165: a new field goes to the END of the board's current order, not
      // the top - the count of fields already on this board (all of which
      // sort before an unset `sort`, or before this new integer either way).
      data.sort = ReactiveCache.getCustomFields({
        boardIds: { $in: [Session.get('currentBoard')] },
      }).length;
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
