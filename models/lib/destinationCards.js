'use strict';

// Pure, Meteor-free helpers for the `destinationCards` publication (#6917).
// Unit-tested in tests/destinationCards6917.test.cjs.
//
// The destination pickers - Copy / Move checklist, Copy checklist from a
// template card, Move / Copy card, Link card, and the parent-card picker -
// list the cards of ANOTHER board, which they used to read from the `board` publication. On a
// board that loads lazily (Admin Panel / Features / Card loading = lazy, or
// 'auto' with more cards than the threshold) that publication ships NO cards:
// each list of an open board fetches its own window. A picker opens no board
// view, so nothing ever fetched its window and the card dropdown stayed empty
// for good. `destinationCards` publishes what a picker shows, whatever the
// board's card-loading mode: the title and place of each card of one list (or,
// for the parent-card picker, of the whole board), and nothing else.

import { listCardsSelector } from './swimlaneFilter.js';

// The fields a picker needs: the option text, the sort order, what
// list.cardsUnfiltered()'s selector tests in minimongo, and `type` / `linkedId`,
// with which the link-card picker leaves out linked cards and the cards it
// already mirrors. No description, no members, no assignees - a picker reveals
// no more than a minicard's title.
const DESTINATION_CARD_FIELDS = Object.freeze({
  _id: 1,
  title: 1,
  sort: 1,
  boardId: 1,
  listId: 1,
  swimlaneId: 1,
  archived: 1,
  type: 1,
  linkedId: 1,
});

// A board's biggest list stays under this; it bounds what one subscribe asks
// of the database (the windowed publication's own cap is the same).
const MAX_DESTINATION_CARDS = 5000;

// The client half of the selector: one list's cards in one swimlane, exactly as
// list.cardsUnfiltered() selects them in minimongo (orphaned cards included in
// the first swimlane), or every active card of the board when no list is
// named. The server ANDs it with the board and role scope.
function destinationCardsSelector(listId, swimlaneId, otherSwimlaneIds) {
  if (!listId) return { archived: false };
  // The link-card picker names a list without a swimlane: the whole list.
  return listCardsSelector(listId, swimlaneId || undefined, otherSwimlaneIds);
}

export { DESTINATION_CARD_FIELDS, MAX_DESTINATION_CARDS, destinationCardsSelector };
