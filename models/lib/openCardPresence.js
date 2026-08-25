'use strict';

// Decide whether a card-details window still belongs on the board where it was
// opened. A missing card means another client deleted/archived it (or moved it
// outside the current publication); a changed boardId means it was moved to a
// different board while another subscription still happens to retain it.
function openCardIsUnavailable(card, openedBoardId) {
  return !card || !openedBoardId || card.boardId !== openedBoardId;
}

module.exports = { openCardIsUnavailable };
