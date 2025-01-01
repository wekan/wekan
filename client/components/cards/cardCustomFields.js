import moment from 'moment/min/moment-with-locales';
import { TAPi18n } from '/imports/i18n';
import { DatePicker } from '/client/lib/datepicker';
import Cards from '/models/cards';
import { CustomFieldStringTemplate } from '/client/lib/customFields'

Template.cardCustomFieldsPopup.helpers({
  hasCustomField() {
    const card = Utils.getCurrentCard();
    const customFieldId = this._id;
    return card.customFieldIndex(customFieldId) > -1;
  },
});

Template.cardCustomFieldsPopup.events({
  'click .js-select-field'(event) {
    const card = Utils.getCurrentCard();
    const customFieldId = this._id;
    card.toggleCustomField(customFieldId);
    event.preventDefault();
  },
  'click .js-settings'(event) {
    EscapeActions.executeUpTo('detailsPane');
    Sidebar.setView('customFields');
    event.preventDefault();
  },
});

// cardCustomField
const CardCustomField = BlazeComponent.extendComponent({
  getTemplate() {
    return `cardCustomField-${this.data().definition.type}`;
  },

  onCreated() {
    const self = this;
    self.card = Utils.getCurrentCard();
    self.customFieldId = this.data()._id;
  },
});
CardCustomField.register('cardCustomField');

// cardCustomField-text
(class extends CardCustomField {
  onCreated() {
    super.onCreated();
  }

  events() {
    return [
      {
        'submit .js-card-customfield-text'(event) {
          event.preventDefault();
          const value = this.currentComponent().getValue();
          this.card.setCustomField(this.customFieldId, value);
        },
      },
    ];
  }
}.register('cardCustomField-text'));

// cardCustomField-number
(class extends CardCustomField {
  onCreated() {
    super.onCreated();
  }

  events() {
    return [
      {
        'submit .js-card-customfield-number'(event) {
          event.preventDefault();
          const value = parseInt(this.find('input').value, 10);
          this.card.setCustomField(this.customFieldId, value);
        },
      },
    ];
  }
}.register('cardCustomField-number'));

// cardCustomField-checkbox
(class extends CardCustomField {
  onCreated() {
    super.onCreated();
  }

  toggleItem() {
    this.card.setCustomField(this.customFieldId, !this.data().value);
  }

  events() {
    return [
      {
        'click .js-checklist-item .check-box-container': this.toggleItem,
      },
    ];
  }
}.register('cardCustomField-checkbox'));

// cardCustomField-currency
(class extends CardCustomField {
  onCreated() {
    super.onCreated();

    this.currencyCode = this.data().definition.settings.currencyCode;
  }

  formattedValue() {
    const locale = TAPi18n.getLanguage();

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currencyCode,
    }).format(this.data().value);
  }

  events() {
    return [
      {
        'submit .js-card-customfield-currency'(event) {
          event.preventDefault();
          // To allow input separated by comma, the comma is replaced by a period.
          const value = Number(this.find('input').value.replace(/,/i, '.'), 10);
          this.card.setCustomField(this.customFieldId, value);
        },
      },
    ];
  }
}.register('cardCustomField-currency'));

// cardCustomField-date
(class extends CardCustomField {
  onCreated() {
    super.onCreated();
    const self = this;
    self.date = ReactiveVar();
    self.now = ReactiveVar(moment());
    window.setInterval(() => {
      self.now.set(moment());
    }, 60000);

    self.autorun(() => {
      self.date.set(moment(self.data().value));
    });
  }

  showWeek() {
    return this.date.get().week().toString();
  }

  showWeekOfYear() {
    return ReactiveCache.getCurrentUser().isShowWeekOfYear();
  }

  showDate() {
    // this will start working once mquandalle:moment
    // is updated to at least moment.js 2.10.5
    // until then, the date is displayed in the "L" format
    return this.date.get().calendar(null, {
      sameElse: 'llll',
    });
  }

  showISODate() {
    return this.date.get().toISOString();
  }

  classes() {
    if (
      this.date.get().isBefore(this.now.get(), 'minute') &&
      this.now.get().isBefore(this.data().value)
    ) {
      return 'current';
    }
    return '';
  }

  showTitle() {
    return `${TAPi18n.__('card-start-on')} ${this.date.get().format('LLLL')}`;
  }

  events() {
    return [
      {
        'click .js-edit-date': Popup.open('cardCustomField-date'),
      },
    ];
  }
}.register('cardCustomField-date'));

// cardCustomField-datePopup
(class extends DatePicker {
  onCreated() {
    super.onCreated();
    const self = this;
    self.card = Utils.getCurrentCard();
    self.customFieldId = this.data()._id;
    this.data().value && this.date.set(moment(this.data().value));
  }

  _storeDate(date) {
    this.card.setCustomField(this.customFieldId, date);
  }

  _deleteDate() {
    this.card.setCustomField(this.customFieldId, '');
  }
}.register('cardCustomField-datePopup'));

// cardCustomField-dropdown
(class extends CardCustomField {
  onCreated() {
    super.onCreated();
    this._items = this.data().definition.settings.dropdownItems;
    this.items = this._items.slice(0);
    this.items.unshift({
      _id: '',
      name: TAPi18n.__('custom-field-dropdown-none'),
    });
  }

  selectedItem() {
    const selected = this._items.find(item => {
      return item._id === this.data().value;
    });
    return selected
      ? selected.name
      : TAPi18n.__('custom-field-dropdown-unknown');
  }

  events() {
    return [
      {
        'submit .js-card-customfield-dropdown'(event) {
          event.preventDefault();
          const value = this.find('select').value;
          this.card.setCustomField(this.customFieldId, value);
        },
      },
    ];
  }
}.register('cardCustomField-dropdown'));

// cardCustomField-stringtemplate
class CardCustomFieldStringTemplate extends CardCustomField {
  onCreated() {
    super.onCreated();

    this.customField = new CustomFieldStringTemplate(this.data().definition);

    this.stringtemplateItems = new ReactiveVar(this.data().value ?? []);
  }

  formattedValue() {
    const ret = this.customField.getFormattedValue(this.data().value);
    return ret;
  }

  getItems() {
    return Array.from(this.findAll('input'))
      .map(input => input.value)
      .filter(value => !!value.trim());
  }

  events() {
    return [
      {
        'submit .js-card-customfield-stringtemplate'(event) {
          event.preventDefault();
          const items = this.stringtemplateItems.get();
          this.card.setCustomField(this.customFieldId, items);
        },

        'keydown .js-card-customfield-stringtemplate-item'(event) {
          if (event.keyCode === 13) {
            event.preventDefault();

            if (event.target.value.trim() || event.metaKey || event.ctrlKey) {
              const inputLast = this.find('input.last');

              let items = this.getItems();

              if (event.target === inputLast) {
                inputLast.value = '';
              } else if (event.target.nextSibling === inputLast) {
                inputLast.focus();
              } else {
                event.target.blur();

                const idx = Array.from(this.findAll('input')).indexOf(
                  event.target,
                );
                items.splice(idx + 1, 0, '');

                Tracker.afterFlush(() => {
                  const element = this.findAll('input')[idx + 1];
                  element.focus();
                  element.value = '';
                });
              }

              this.stringtemplateItems.set(items);
            }
            if (event.metaKey || event.ctrlKey) {
              this.find('button[type=submit]').click();
            }
          }
        },

        'blur .js-card-customfield-stringtemplate-item'(event) {
          if (
            !event.target.value.trim() ||
            event.target === this.find('input.last')
          ) {
            const items = this.getItems();
            this.stringtemplateItems.set(items);
            this.find('input.last').value = '';
          }
        },

        'click .js-close-inlined-form'(event) {
          this.stringtemplateItems.set(this.data().value ?? []);
        },
      },
    ];
  }
}
CardCustomFieldStringTemplate.register('cardCustomField-stringtemplate');
