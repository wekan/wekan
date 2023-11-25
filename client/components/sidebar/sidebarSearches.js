BlazeComponent.extendComponent({
  onCreated() {
    this.term = new ReactiveVar('');
  },

  cards() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard.searchCards(this.term.get());
  },

  lists() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard.searchLists(this.term.get());
  },

  clickOnMiniCard(evt) {
    if (Utils.isMiniScreen()) {
      evt.preventDefault();
      Session.set('popupCardId', this.currentData()._id);
      this.cardDetailsPopup(evt);
    }
  },

  cardDetailsPopup(event) {
    if (!Popup.isOpen()) {
      Popup.open("cardDetails")(event);
    }
  },

  events() {
    return [
      {
        'click .js-minicard': this.clickOnMiniCard,
        'submit .js-search-term-form'(evt) {
          evt.preventDefault();
          this.term.set(evt.target.searchTerm.value);
        },
      },
    ];
  },
}).register('searchSidebar');
