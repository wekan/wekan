'use strict';

// #6815: card numbers are board-wide and meant to be unique (#5813 / #4743), but a card
// added in the browser (add-card form, template, link, checklist item to card)
// brings the number the browser computed itself: the highest number among the
// cards it HAS, plus one. With lazy card loading the browser only has the cards
// in view, so it reissues numbers that cards outside its view already carry -
// and two people adding a card at the same moment get the same number. The
// server's atomic counter (Boards.getNextCardNumber) never saw those numbers, so
// it reissued them too. One production board set had 842 numbers used twice on
// 452 boards; 231 of the pairs were created more than a day apart.
//
// The server therefore checks every new card's number (server/models/cards.js,
// Cards.before.insert): a number another card on the board already has is
// replaced by a fresh one from the counter, and the counter is raised to any
// number it did not issue, so it never hands that one out again.

const counterName = boardId => `cardNumber-${boardId}`;

// Only a real number is checked: 0 / missing means "no number" and stays so.
function isCardNumber(n) {
  return Number.isSafeInteger(n) && n > 0;
}

function needsNewCardNumber(cardNumber, takenByAnotherCard) {
  return isCardNumber(cardNumber) && !!takenByAnotherCard;
}

// #6815: what the counter is raised to for a free number: that number, or the
// board's highest one when the counter is new and that is higher.
function counterFloor(cardNumber, boardTop) {
  return isCardNumber(boardTop) ? Math.max(cardNumber, boardTop) : cardNumber;
}

module.exports = { counterName, isCardNumber, needsNewCardNumber, counterFloor };
