import { Utils } from '/client/lib/utils';
import { revealOnBoard } from '/client/lib/revealOnBoard';

Template.searchSidebar.onCreated(function () {
  this.term = new ReactiveVar('');
  // #2171: which card found is shown on the board (0 = none yet).
  this.step = new ReactiveVar(0);
});

function foundCards(tpl) {
  const currentBoard = Utils.getCurrentBoard();
  return currentBoard ? currentBoard.searchCards(tpl.term.get()) : [];
}

Template.searchSidebar.helpers({
  cards() {
    return foundCards(Template.instance());
  },

  lists() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard.searchLists(Template.instance().term.get());
  },

  matchCount() {
    const tpl = Template.instance();
    return tpl.term.get() ? foundCards(tpl).length : 0;
  },
  stepNumber() { return Template.instance().step.get(); },
});

Template.searchSidebar.events({
  'click .js-minicard'(evt) {
    if (Utils.isMiniScreen()) {
      evt.preventDefault();
      Session.set('popupCardId', Template.currentData()._id);
      if (!Popup.isOpen()) {
        Popup.open("cardDetails")(evt);
      }
      return;
    }
    // #2171: the card opens, and the board shows where it is.
    revealOnBoard({ cardId: evt.currentTarget.dataset.cardId });
  },
  'click .js-minilist'(evt) {
    revealOnBoard({ listId: evt.currentTarget.dataset.listId });
  },
  // #2171: a new term searches; Enter on the same term steps to the next card
  // found, wrapping round, and reveals it on the board.
  'submit .js-search-term-form'(evt, tpl) {
    evt.preventDefault();
    const term = evt.target.searchTerm.value;
    if (term !== tpl.term.get()) {
      tpl.term.set(term);
      tpl.step.set(0);
    }
    const cards = foundCards(tpl);
    if (!cards.length) return;
    const next = (tpl.step.get() % cards.length) + 1;
    tpl.step.set(next);
    revealOnBoard({ cardId: cards[next - 1]._id });
  },
});
