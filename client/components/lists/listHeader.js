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


BlazeComponent.extendComponent({
  events() {
    return [{
      submit(evt) {
        evt.preventDefault();
        const jsonData = $(evt.currentTarget).find('textarea').val();
        const firstCardDom = $(`#js-list-${this.currentData()._id} .js-minicard:first`).get(0);
        const sortIndex = Utils.calculateIndex(null, firstCardDom).base;
        let trelloCard;
        try {
          trelloCard = JSON.parse(jsonData);
        } catch (e) {
          this.setError('error-json-malformed');
          return;
        }
        Meteor.call('importTrelloCard', trelloCard, this.currentData()._id, sortIndex,
          (error, response) => {
            if (error) {
              this.setError(error.error);
            } else {
              Filter.addException(response);
              Popup.close();
            }
          }
        );
      },
    }];
  },

  onCreated() {
    this.error = new ReactiveVar('');
  },

  setError(error) {
    this.error.set(error);
  },
}).register('listImportCardPopup');

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
