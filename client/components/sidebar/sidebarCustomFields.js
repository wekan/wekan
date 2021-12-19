BlazeComponent.extendComponent({
  customFields() {
    return CustomFields.find({
      boardIds: { $in: [Session.get('currentBoard')] },
    });
  },

  events() {
    return [
      {
        'click .js-open-create-custom-field': Popup.open('createCustomField'),
        'click .js-edit-custom-field': Popup.open('editCustomField'),
      },
    ];
  },
}).register('customFieldsSidebar');

const CreateCustomFieldPopup = BlazeComponent.extendComponent({
  _types: [
    'text',
    'number',
    'date',
    'dropdown',
    'currency',
    'checkbox',
    'stringtemplate',
  ],

  _currencyList: [
    {
      name: 'US Dollar',
      code: 'USD',
    },
    {
      name: 'Euro',
      code: 'EUR',
    },
    {
      name: 'Yen',
      code: 'JPY',
    },
    {
      name: 'Pound Sterling',
      code: 'GBP',
    },
    {
      name: 'Australian Dollar',
      code: 'AUD',
    },
    {
      name: 'Canadian Dollar',
      code: 'CAD',
    },
    {
      name: 'Swiss Franc',
      code: 'CHF',
    },
    {
      name: 'Yuan Renminbi',
      code: 'CNY',
    },
    {
      name: 'Hong Kong Dollar',
      code: 'HKD',
    },
    {
      name: 'New Zealand Dollar',
      code: 'NZD',
    },
  ],

  onCreated() {
    this.type = new ReactiveVar(
      this.data().type ? this.data().type : this._types[0],
    );

    this.currencyCode = new ReactiveVar(
      this.data().settings && this.data().settings.currencyCode
        ? this.data().settings.currencyCode
        : this._currencyList[0].code,
    );

    this.dropdownItems = new ReactiveVar(
      this.data().settings && this.data().settings.dropdownItems
        ? this.data().settings.dropdownItems
        : [],
    );

    this.stringtemplateFormat = new ReactiveVar(
      this.data().settings && this.data().settings.stringtemplateFormat
        ? this.data().settings.stringtemplateFormat
        : '',
    );

    this.stringtemplateSeparator = new ReactiveVar(
      this.data().settings && this.data().settings.stringtemplateSeparator
        ? this.data().settings.stringtemplateSeparator
        : '',
    );
  },

  types() {
    const currentType = this.data().type;
    return this._types.map(type => {
      return {
        value: type,
        name: TAPi18n.__(`custom-field-${type}`),
        selected: type === currentType,
      };
    });
  },

  isTypeNotSelected(type) {
    return this.type.get() !== type;
  },

  getCurrencyCodes() {
    const currentCode = this.currencyCode.get();

    return this._currencyList.map(({ name, code }) => {
      return {
        name: `${code} - ${name}`,
        value: code,
        selected: code === currentCode,
      };
    });
  },

  getDropdownItems() {
    const items = this.dropdownItems.get();
    Array.from(this.findAll('.js-field-settings-dropdown input')).forEach(
      (el, index) => {
        //console.log('each item!', index, el.value);
        if (!items[index])
          items[index] = {
            _id: Random.id(6),
          };
        items[index].name = el.value.trim();
      },
    );
    return items;
  },

  getStringtemplateFormat() {
    return this.stringtemplateFormat.get();
  },

  getStringtemplateSeparator() {
    return this.stringtemplateSeparator.get();
  },

  getSettings() {
    const settings = {};
    switch (this.type.get()) {
      case 'currency': {
        const currencyCode = this.currencyCode.get();
        settings.currencyCode = currencyCode;
        break;
      }
      case 'dropdown': {
        const dropdownItems = this.getDropdownItems().filter(
          item => !!item.name.trim(),
        );
        settings.dropdownItems = dropdownItems;
        break;
      }
      case 'stringtemplate': {
        const stringtemplateFormat = this.stringtemplateFormat.get();
        settings.stringtemplateFormat = stringtemplateFormat;

        const stringtemplateSeparator = this.stringtemplateSeparator.get();
        settings.stringtemplateSeparator = stringtemplateSeparator;
        break;
      }
    }
    return settings;
  },

  events() {
    return [
      {
        'change .js-field-type'(evt) {
          const value = evt.target.value;
          this.type.set(value);
        },
        'change .js-field-currency'(evt) {
          const value = evt.target.value;
          this.currencyCode.set(value);
        },
        'keydown .js-dropdown-item.last'(evt) {
          if (evt.target.value.trim() && evt.keyCode === 13) {
            const items = this.getDropdownItems();
            this.dropdownItems.set(items);
            evt.target.value = '';
          }
        },
        'input .js-field-stringtemplate-format'(evt) {
          const value = evt.target.value;
          this.stringtemplateFormat.set(value);
        },
        'input .js-field-stringtemplate-separator'(evt) {
          const value = evt.target.value;
          this.stringtemplateSeparator.set(value);
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
        'click .primary'(evt) {
          evt.preventDefault();

          const data = {
            name: this.find('.js-field-name').value.trim(),
            type: this.type.get(),
            settings: this.getSettings(),
            showOnCard: this.find('.js-field-show-on-card.is-checked') !== null,
            showLabelOnMiniCard:
              this.find('.js-field-showLabel-on-card.is-checked') !== null,
            automaticallyOnCard:
              this.find('.js-field-automatically-on-card.is-checked') !== null,
            alwaysOnCard:
              this.find('.js-field-always-on-card.is-checked') !== null,
            showSumAtTopOfList:
              this.find('.js-field-show-sum-at-top-of-list.is-checked') !== null,
          };

          // insert or update
          if (!this.data()._id) {
            data.boardIds = [Session.get('currentBoard')];
            CustomFields.insert(data);
          } else {
            CustomFields.update(this.data()._id, { $set: data });
          }

          Popup.back();
        },
        'click .js-delete-custom-field': Popup.afterConfirm(
          'deleteCustomField',
          function() {
            const customField = CustomFields.findOne(this._id);
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
      },
    ];
  },
});
CreateCustomFieldPopup.register('createCustomFieldPopup');

(class extends CreateCustomFieldPopup {
  template() {
    return 'createCustomFieldPopup';
  }
}.register('editCustomFieldPopup'));

/*Template.deleteCustomFieldPopup.events({
  'submit'(evt) {
    const customFieldId = this._id;
    CustomFields.remove(customFieldId);
    Popup.back();
  }
});*/
