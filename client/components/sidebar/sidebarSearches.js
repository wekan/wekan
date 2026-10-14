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

// One card further (1) or back (-1), wrapping round; the first step from
// none goes to the first card, or back to the last.
function step(tpl, direction) {
  const cards = foundCards(tpl);
  if (!cards.length) return;
  const current = tpl.step.get();
  const next = current === 0
    ? (direction > 0 ? 1 : cards.length)
    : ((current - 1 + direction + cards.length) % cards.length) + 1;
  tpl.step.set(next);
  revealOnBoard({ cardId: cards[next - 1]._id });
}

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
  // found and Shift+Enter to the previous one, wrapping round, and reveals it
  // on the board. The arrows beside the count do the same.
  'keydown .js-search-term-form input'(evt, tpl) {
    if (evt.key === 'Enter') tpl.backwards = evt.shiftKey;
  },
  'submit .js-search-term-form'(evt, tpl) {
    evt.preventDefault();
    const term = evt.target.searchTerm.value;
    const direction = tpl.backwards ? -1 : 1;
    tpl.backwards = false;
    if (term !== tpl.term.get()) {
      tpl.term.set(term);
      tpl.step.set(0);
    }
    step(tpl, direction);
  },
  'click .js-search-step'(evt, tpl) {
    evt.preventDefault();
    step(tpl, Number(evt.currentTarget.dataset.direction) < 0 ? -1 : 1);
  },
});
