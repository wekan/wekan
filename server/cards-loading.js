// CARDS_LOADING controls how a board loads its cards.
//
//   auto (default) — per board: a board with more than
//                    CARDS_LOADING_LAZY_THRESHOLD (500) cards loads as `lazy`,
//                    a smaller one as `all` (#6480). Every platform's default,
//                    the snap's too since #6745.
//   all            — the `board` publication ships every non-archived card into
//                    the client's minimongo. Filtering, search, counts, sorting
//                    and drag-and-drop all run client-side. Simple and fully
//                    featured, but a board with thousands of cards pushes a large
//                    dataset to every viewer.
//   lazy           — each list loads only the cards currently visible (the
//                    infinite-scroll window) via a per-list windowed publication,
//                    and card counts come from a reactive server count. The board
//                    publication then does NOT ship all cards. Lower memory / less
//                    data for very large boards.
//
// models/lib/cardsLoading.js holds the rules.
//
// Exposed to the client as Meteor.settings.public.cardsLoading so both the
// publications (server) and the board rendering (client) agree on the mode.
const {
  resolveCardsLoadingMode,
  cardsLoadingLazyThreshold,
} = require('/models/lib/cardsLoading');

Meteor.startup(() => {
  if (!Meteor.settings.public) Meteor.settings.public = {};
  // server/models/settings.js is authoritative — it mirrors the STORED admin
  // setting. Only fill an env-derived fallback if it has not run yet, so whichever
  // startup block runs first, the stored setting always wins in the end.
  if (Meteor.settings.public.cardsLoading == null) {
    Meteor.settings.public.cardsLoading = resolveCardsLoadingMode(process.env.CARDS_LOADING);
  }
  if (Meteor.settings.public.cardsLoadingLazyThreshold == null) {
    Meteor.settings.public.cardsLoadingLazyThreshold =
      cardsLoadingLazyThreshold(process.env.CARDS_LOADING_LAZY_THRESHOLD);
  }
});
