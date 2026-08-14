import { ReactiveVar } from 'meteor/reactive-var';

// Which menu the card's action popup was opened from.
//
// `cardDetailsActionsPopup` is ONE template opened from two places: the
// hamburger on an opened card, and the hamburger on a minicard on the board.
// Almost everything in it is the same from both - it acts on the same card -
// but the first entry is not: the card's menu offers "Show on Card" and the
// minicard's offers "Show on Minicard", because that is the thing you are
// looking at when you reach for the menu.
//
// The popup cannot tell where it was opened from by itself (its data context is
// the card either way), so the opener says so here and the popup reads it. A
// module-level ReactiveVar rather than a field on the data context: the context
// is a Card document, and a field added to one is gone the next time Blaze
// re-renders the popup with a fresh copy of it (the same trap #6479 described
// for the confirmation popups).
const source = new ReactiveVar('card');

export function setCardMenuSource(next) {
  source.set(next === 'minicard' ? 'minicard' : 'card');
}

export function cardMenuSource() {
  return source.get();
}
