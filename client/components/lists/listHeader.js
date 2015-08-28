BlazeComponent.extendComponent({
  template: function() {
    return 'listHeader';
  },

  editTitle: function(evt) {
    evt.preventDefault();
    var form = this.componentChildren('inlinedForm')[0];
    var newTitle = form.getValue();
    if ($.trim(newTitle)) {
      Lists.update(this.currentData()._id, {
        $set: {
          title: newTitle
        }
      });
    }
  },

  events: function() {
    return [{
      'click .js-open-list-menu': Popup.open('listAction'),
      submit: this.editTitle
    }];
  }
}).register('listHeader');

Template.listActionPopup.events({
  'click .js-add-card': function() {
    var listDom = document.getElementById('js-list-' + this._id);
    var listComponent = BlazeComponent.getComponentForElement(listDom);
    listComponent.openForm({ position: 'top' });
    Popup.close();
  },
  'click .js-list-subscribe': function() {},
  'click .js-select-cards': function() {
    var cardIds = Cards.find(
      {listId: this._id},
      {fields: { _id: 1 }}
    ).map(function(card) { return card._id; });
    MultiSelection.add(cardIds);
    Popup.close();
  },
  'click .js-move-cards': Popup.open('listMoveCards'),
  'click .js-archive-cards': Popup.afterConfirm('listArchiveCards', function() {
    Cards.find({listId: this._id}).forEach(function(card) {
      Cards.update(card._id, {
        $set: {
          archived: true
        }
      });
    });
    Popup.close();
  }),
  'click .js-close-list': function(evt) {
    evt.preventDefault();
    Lists.update(this._id, {
      $set: {
        archived: true
      }
    });
    Popup.close();
  }
});

Template.listMoveCardsPopup.events({
  'click .js-select-list': function() {
    var fromList = Template.parentData(2).data._id;
    var toList = this._id;
    Cards.find({listId: fromList}).forEach(function(card) {
      Cards.update(card._id, {
        $set: {
          listId: toList
        }
      });
    });
    Popup.close();
  }
});
