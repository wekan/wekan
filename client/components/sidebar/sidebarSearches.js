import { Utils } from '/client/lib/utils';

Template.searchSidebar.onCreated(function () {
  this.term = new ReactiveVar('');
});

Template.searchSidebar.helpers({
  cards() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard.searchCards(Template.instance().term.get());
  },

  lists() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard.searchLists(Template.instance().term.get());
  },
});

Template.searchSidebar.events({
  'click .js-minicard'(evt) {
    if (Utils.isMiniScreen()) {
      evt.preventDefault();
      Session.set('popupCardId', Template.currentData()._id);
      if (!Popup.isOpen()) {
        Popup.open("cardDetails")(evt);
      }
    }
  },
  'submit .js-search-term-form'(evt, tpl) {
    evt.preventDefault();
    tpl.term.set(evt.target.searchTerm.value);
  },
});
