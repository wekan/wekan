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

Template.createCustomFieldPopup.helpers({
  types() {
    var currentType = this.type;
    return ['text', 'number', 'checkbox', 'date', 'dropdown'].
      map(type => {return {
        type: type,
        name: TAPi18n.__('custom-field-' + type),
        selected: type == currentType,
      }});
  },
});

Template.createCustomFieldPopup.events({
  'click .js-field-show-on-card'(event) {
    let $target = $(event.target);
    if(!$target.hasClass('js-field-show-on-card')){
      $target = $target.parent();
    }
    $target.find('.materialCheckBox').toggleClass('is-checked');
    $target.toggleClass('is-checked');
  },
  'submit'(evt, tpl) {
    evt.preventDefault();

    const name = tpl.find('.js-field-name').value.trim();
    const type = tpl.find('.js-field-type').value.trim();
    const showOnCard = tpl.find('.js-field-show-on-card.is-checked') != null;
    //console.log('Create',name,type,showOnCard);

    CustomFields.insert({
      boardId: Session.get('currentBoard'),
      name: name,
      type: type,
      showOnCard: showOnCard
    });

    Popup.back();
  },
  'click .js-delete-custom-field': Popup.afterConfirm('deleteCustomField', function() {
    const customFieldId = this._id;
    CustomFields.remove(customFieldId);
    Popup.close();
  }),
});

/*Template.deleteCustomFieldPopup.events({
  'submit'(evt) {
    const customFieldId = this._id;
    CustomFields.remove(customFieldId);
    Popup.close();
  }
});*/