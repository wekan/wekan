Template.listActionPopup.events({
  'click .js-add-card': function() {
    // XXX We need a better API and architecture here. See
    // https://github.com/peerlibrary/meteor-blaze-components/issues/19
    var listDom = document.getElementById('js-list-' + this._id);
    var listComponent = Blaze.getView(listDom).templateInstance().get('component');
    listComponent.openForm();
    Popup.close();
  },
  'click .js-list-subscribe': function() {},
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
