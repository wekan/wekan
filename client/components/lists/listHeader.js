BlazeComponent.extendComponent({
  template() {
    return 'listHeader';
  },

  editTitle(evt) {
    evt.preventDefault();
    const form = this.componentChildren('inlinedForm')[0];
    const newTitle = form.getValue();
    if ($.trim(newTitle)) {
      Lists.update(this.currentData()._id, {
        $set: {
          title: newTitle,
        },
      });
    }
  },

  events() {
    return [{
      'click .js-open-list-menu': Popup.open('listAction'),
      submit: this.editTitle,
    }];
  },
}).register('listHeader');

Template.listActionPopup.events({
  'click .js-add-card'() {
    const listDom = document.getElementById(`js-list-${this._id}`);
    const listComponent = BlazeComponent.getComponentForElement(listDom);
    listComponent.openForm({ position: 'top' });
    Popup.close();
  },
  'click .js-list-subscribe'() {},
  'click .js-select-cards'() {
    const cardIds = Cards.find(
      {listId: this._id},
      {fields: { _id: 1 }}
    ).map((card) => card._id);
    MultiSelection.add(cardIds);
    Popup.close();
  },
  'click .js-move-cards': Popup.open('listMoveCards'),
  'click .js-archive-cards': Popup.afterConfirm('listArchiveCards', () => {
    Cards.find({listId: this._id}).forEach((card) => {
      Cards.update(card._id, {
        $set: {
          archived: true,
        },
      });
    });
    Popup.close();
  }),
  'click .js-close-list'(evt) {
    evt.preventDefault();
    Lists.update(this._id, {
      $set: {
        archived: true,
      },
    });
    Popup.close();
  },
});

Template.listMoveCardsPopup.events({
  'click .js-select-list'() {
    const fromList = Template.parentData(2).data._id;
    const toList = this._id;
    Cards.find({ listId: fromList }).forEach((card) => {
      Cards.update(card._id, {
        $set: {
          listId: toList,
        },
      });
    });
    Popup.close();
  },
});
