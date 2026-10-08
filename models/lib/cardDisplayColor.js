'use strict';

// #4756: the colour a card is shown in. A card's own colour always wins; a
// card without one takes its list's colour when the list says so
// (cardsUseListColor, set in the list's colour popup). Nothing is written to
// the card: dragging it to another list changes the colour it is shown in,
// which is the point - "by merely dragging cards around the colors would
// change". 'white' is the palette's "no colour".
//
// Pure: tested by tests/cardDisplayColor.test.cjs.
function effectiveCardColor(card, list) {
  const own = card && card.color;
  if (own) return own;
  if (list && list.cardsUseListColor === true && list.color && list.color !== 'white') return list.color;
  return null;
}

module.exports = { effectiveCardColor };
