BlazeComponent.extendComponent({
  template() {
    return 'listHeader';
  },

  editTitle(evt) {
    evt.preventDefault();
    const newTitle = this.componentChildren('inlinedForm')[0].getValue();
    const list = this.currentData();
    if ($.trim(newTitle)) {
      list.rename(newTitle);
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
    const cardIds = this.allCards().map((card) => card._id);
    MultiSelection.add(cardIds);
    Popup.close();
  },
  'click .js-import-card': Popup.open('listImportCard'),
  'click .js-move-cards': Popup.open('listMoveCards'),
  'click .js-archive-cards': Popup.afterConfirm('listArchiveCards', function() {
    this.allCards().forEach((card) => {
      card.archive();
    });
    Popup.close();
  }),

  'click .js-close-list'(evt) {
    evt.preventDefault();
    this.archive();
    Popup.close();
  },
});

Template.listImportCardPopup.events({
  submit(evt, template) {
    // 1. get the json data out of the form and parse it
    evt.preventDefault();
    const jsonData = $(evt.currentTarget).find('textarea').val();
    const data = JSON.parse(jsonData);
    // 2. map all fields for the card to create
    const firstCardDom = $(`#js-list-${this._id} .js-minicard:first`).get(0);
    sortIndex = Utils.calculateIndex(null, firstCardDom).base;
    const cardToCreate = {
      title: data.name,
      listId: this._id,
      boardId: this.boardId,
      userId: Meteor.userId(),
      sort: sortIndex,
    }
    // 3. finally, insert new card into list
    const _id = Cards.insert(cardToCreate);
    // In case the filter is active we need to add the newly inserted card in
    // the list of exceptions -- cards that are not filtered. Otherwise the
    // card will disappear instantly.
    // See https://github.com/wekan/wekan/issues/80
    Filter.addException(_id);
  }
});

Template.listMoveCardsPopup.events({
  'click .js-select-list'() {
    const fromList = Template.parentData(2).data;
    const toList = this._id;
    fromList.allCards().forEach((card) => {
      card.move(toList);
    });
    Popup.close();
  },
});
