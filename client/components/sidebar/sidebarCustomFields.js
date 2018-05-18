BlazeComponent.extendComponent({

  customFields() {
    return CustomFields.find({
      boardId: Session.get('currentBoard'),
    });
  },

  events() {
    return [{
      'click .js-open-create-custom-field': Popup.open('createCustomField'),
      'click .js-edit-custom-field': Popup.open('editCustomField'),
    }];
  },

}).register('customFieldsSidebar');

const CreateCustomFieldPopup = BlazeComponent.extendComponent({

  _types: ['text', 'number', 'date', 'dropdown'],

  onCreated() {
    this.type = new ReactiveVar((this.data().type) ? this.data().type : this._types[0]);
    this.dropdownItems = new ReactiveVar((this.data().settings && this.data().settings.dropdownItems) ? this.data().settings.dropdownItems : []);
  },

  types() {
    const currentType = this.data().type;
    return this._types.
        map((type) => {return {
          value: type,
          name: TAPi18n.__('custom-field-${type}'),
          selected: type === currentType,
        };});
  },

  isTypeNotSelected(type) {
    return this.type.get() !== type;
  },

  getDropdownItems() {
    const items = this.dropdownItems.get();
    Array.from(this.findAll('.js-field-settings-dropdown input')).forEach((el, index) => {
      //console.log('each item!', index, el.value);
      if (!items[index]) items[index] = {
        _id: Random.id(6),
      };
      items[index].name = el.value.trim();
    });
    return items;
  },

  getSettings() {
    const settings = {};
    switch (this.type.get()) {
    case 'dropdown': {
      const dropdownItems = this.getDropdownItems().filter((item) => !!item.name.trim());
      settings.dropdownItems = dropdownItems;
      break;
    }
    }
    return settings;
  },

  events() {
    return [{
      'change .js-field-type'(evt) {
        const value = evt.target.value;
        this.type.set(value);
      },
      'keydown .js-dropdown-item.last'(evt) {
        if (evt.target.value.trim() && evt.keyCode === 13) {
          const items = this.getDropdownItems();
          this.dropdownItems.set(items);
          evt.target.value = '';
        }
      },
      'click .js-field-show-on-card'(evt) {
        let $target = $(evt.target);
        if(!$target.hasClass('js-field-show-on-card')){
          $target = $target.parent();
        }
        $target.find('.materialCheckBox').toggleClass('is-checked');
        $target.toggleClass('is-checked');
      },
      'click .primary'(evt) {
        evt.preventDefault();

        const data = {
          boardId: Session.get('currentBoard'),
          name: this.find('.js-field-name').value.trim(),
          type: this.type.get(),
          settings: this.getSettings(),
          showOnCard: this.find('.js-field-show-on-card.is-checked') !== null,
        };

        // insert or update
        if (!this.data()._id) {
          CustomFields.insert(data);
        } else {
          CustomFields.update(this.data()._id, {$set: data});
        }

        Popup.back();
      },
      'click .js-delete-custom-field': Popup.afterConfirm('deleteCustomField', function() {
        const customFieldId = this._id;
        CustomFields.remove(customFieldId);
        Popup.close();
      }),
    }];
  },

});
CreateCustomFieldPopup.register('createCustomFieldPopup');

(class extends CreateCustomFieldPopup {

  template() {
    return 'createCustomFieldPopup';
  }

}).register('editCustomFieldPopup');

/*Template.deleteCustomFieldPopup.events({
  'submit'(evt) {
    const customFieldId = this._id;
    CustomFields.remove(customFieldId);
    Popup.close();
  }
});*/
