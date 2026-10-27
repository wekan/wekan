'use strict';

// Decide whether a card-details window still belongs on the board where it was
// opened. A missing card means another client deleted/archived it (or moved it
// outside the current publication); a changed boardId means it was moved to a
// different board while another subscription still happens to retain it.
function openCardIsUnavailable(card, openedBoardId) {
  return !card || !openedBoardId || card.boardId !== openedBoardId;
}

// #6808: what the opened card's window does about what Minimongo says now.
//
// A card missing from Minimongo is not yet a card that is gone. Behind a
// reverse proxy the DDP connection can drop and come back while the page is
// still loading (a WebSocket upgrade the proxy refuses, SockJS falling back);
// on the way back every subscription is re-run, and one re-run before the
// resumed login answers with nothing - the card leaves Minimongo for a moment
// and comes back. Closing on that moment closed a card the link had just
// opened. So:
//
//   'keep'    - the card is here, on the board it was opened on;
//   'wait'    - something is still settling (the subscription, the
//               connection, the login): decide when it has;
//   'confirm' - it looks gone with everything settled: ask the server, and
//               close only if the server says so and Minimongo still agrees.
function openCardCloseDecision({ subReady, connected, loggingIn, card, openedBoardId }) {
  if (!openCardIsUnavailable(card, openedBoardId)) return 'keep';
  if (!subReady || !connected || loggingIn) return 'wait';
  return 'confirm';
}

module.exports = { openCardIsUnavailable, openCardCloseDecision };
