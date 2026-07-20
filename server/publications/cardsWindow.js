import { ReactiveCache } from '/imports/reactiveCache';
import { publishComposite } from 'meteor/reywood:publish-composite';
import Boards from '/models/boards';
import Cards from '/models/cards';
const { hasWhere } = require('/models/lib/mongoSelectorSafety');
const {
  effectiveBoardCardsMode,
  DEFAULT_LAZY_THRESHOLD,
} = require('/models/lib/cardsLoading');

// ─────────────────────────────────────────────────────────────────────────────
// Lazy (windowed) card loading — used only when CARDS_LOADING=lazy / Admin Panel
// Features → "Card loading" = lazy. See server/cards-loading.js.
//
// In lazy mode the `board` publication does NOT ship every card. Instead each
// list (per swimlane) subscribes to `boardCardsWindow` for just the cards it is
// about to render (the infinite-scroll window), and to `boardListCardCount` for
// the total count so it knows whether to show the "load more" spinner. As the
// user scrolls the client raises the limit and re-subscribes, streaming in more
// cards on demand. Default mode ('all') never touches these and is unchanged.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_WINDOW = 5000; // hard cap on how many cards one list window may request

// hasWhere() (reject a client selector carrying $where server-side JS execution)
// is imported from /models/lib/mongoSelectorSafety so it can be unit-tested.

async function boardVisibleTo(userId, boardId) {
  const board = await ReactiveCache.getBoard(boardId);
  if (!board) return null;
  if (board.permission === 'public') return board;
  if (!userId) return null;
  const user = await ReactiveCache.getUser(userId);
  return board.isVisibleBy(user) ? board : null;
}

// Publish the cards of ONE list/swimlane window (client passes the exact selector
// it renders with — listId/swimlane/filter — which we AND with the board scope),
// plus each card's comments, attachments, checklists and checklist items.
publishComposite('boardCardsWindow', function(boardId, cardSelector, sort, limit) {
  check(boardId, String);
  check(cardSelector, Object);
  check(sort, Match.OneOf(Object, null, undefined));
  check(limit, Number);

  const userId = this.userId;
  const lim = Math.max(1, Math.min(Math.floor(limit) || 1, MAX_WINDOW));
  const safe = hasWhere(cardSelector) ? { _id: { $in: [] } } : cardSelector;
  const sortOpt = sort || { sort: 1 };

  // The window's card selector, ANDed with the board scope.
  const windowSel = board => ({ $and: [safe, { boardId: board._id, archived: false }] });

  // The ids of the cards in this window. Used to publish the window's comments,
  // attachments, checklists and checklist items with ONE cursor each
  // ({ cardId: { $in: ids } }) instead of one live cursor PER card — the same N+1
  // that pinned FerretDB CPU on big boards in eager mode (#6480). These are
  // recomputed whenever the client re-subscribes (scroll grows `limit`, or the
  // filter/sort changes), which is how the window stays current. A card ADDED to
  // the live cards cursor after subscribe still renders (its minicard); its
  // comments/checklists refresh on the next re-subscribe — and when the card is
  // OPENED it gets full, live children from the dedicated `openCardData`
  // subscription (see server/publications/cards.js), so nothing is missed there.
  const windowCardIds = async board => {
    const cards = await ReactiveCache.getCards(
      windowSel(board),
      { sort: sortOpt, limit: lim, fields: { _id: 1 } },
      false,
    );
    return (cards || []).map(c => c._id);
  };

  return {
    async find() {
      const board = await boardVisibleTo(userId, boardId);
      if (!board) return [];
      return Boards.find({ _id: boardId }, { fields: { _id: 1 }, limit: 1 });
    },
    children: [
      // The window's cards.
      {
        async find(board) {
          return await ReactiveCache.getCards(windowSel(board), { sort: sortOpt, limit: lim }, true);
        },
      },
      // The window's comments — one cursor for the whole window (not per card).
      {
        async find(board) {
          const ids = await windowCardIds(board);
          if (ids.length === 0) return null;
          return await ReactiveCache.getCardComments({ cardId: { $in: ids } }, {}, true);
        },
      },
      // The window's attachments.
      {
        async find(board) {
          const ids = await windowCardIds(board);
          if (ids.length === 0) return null;
          const result = await ReactiveCache.getAttachments({ 'meta.cardId': { $in: ids } }, {}, true);
          return result.cursor || result;
        },
      },
      // The window's checklists.
      {
        async find(board) {
          const ids = await windowCardIds(board);
          if (ids.length === 0) return null;
          return await ReactiveCache.getChecklists({ cardId: { $in: ids } }, {}, true);
        },
      },
      // The window's checklist items.
      {
        async find(board) {
          const ids = await windowCardIds(board);
          if (ids.length === 0) return null;
          return await ReactiveCache.getChecklistItems({ cardId: { $in: ids } }, {}, true);
        },
      },
    ],
  };
});

// Reactive count of a list/swimlane window's cards, independent of the window
// limit, published as a single doc into the client-only `boardListCardCounts`
// collection (Meteor's standard publish-a-count pattern). The client uses it to
// decide whether more cards remain to be scrolled in.
Meteor.publish('boardListCardCount', async function(countId, boardId, cardSelector) {
  check(countId, String);
  check(boardId, String);
  check(cardSelector, Object);

  const board = await boardVisibleTo(this.userId, boardId);
  if (!board || hasWhere(cardSelector)) {
    return this.ready();
  }

  const sel = { $and: [cardSelector, { boardId, archived: false }] };
  let count = 0;
  let initializing = true;

  const handle = await Cards.find(sel, { fields: { _id: 1 } }).observeChangesAsync({
    added: () => {
      count += 1;
      if (!initializing) this.changed('boardListCardCounts', countId, { count });
    },
    removed: () => {
      count = Math.max(0, count - 1);
      this.changed('boardListCardCounts', countId, { count });
    },
  });

  initializing = false;
  this.added('boardListCardCounts', countId, { boardId, count });
  this.ready();
  this.onStop(() => handle.stop());
});

// Tell the client whether THIS board loads lazily, so client rendering and the
// server board publication agree per board in 'auto' mode. Publishes a single
// client-only `boardCardLoadingModes` doc { _id: boardId, lazy: bool }. The client
// subscribes to this on board open and reads it in isLazyCards(boardId). Computed
// once at subscribe (the mode only changes as a board crosses the threshold, which
// is rare and picked up on the next board open). #6480.
Meteor.publish('boardCardsLoadingMode', async function(boardId) {
  check(boardId, String);

  const board = await boardVisibleTo(this.userId, boardId);
  if (!board) {
    return this.ready();
  }

  const mode = (Meteor.settings.public && Meteor.settings.public.cardsLoading) || 'auto';
  let lazy;
  if (mode === 'lazy') {
    lazy = true;
  } else if (mode === 'all') {
    lazy = false;
  } else {
    const t = Number(Meteor.settings.public && Meteor.settings.public.cardsLoadingLazyThreshold);
    const threshold = Number.isFinite(t) && t >= 0 ? t : DEFAULT_LAZY_THRESHOLD;
    const count = await Cards.find(
      { boardId: { $in: [board._id, board.subtasksDefaultBoardId] }, archived: false },
    ).countAsync();
    lazy = effectiveBoardCardsMode('auto', count, threshold) === 'lazy';
  }

  this.added('boardCardLoadingModes', boardId, { lazy });
  this.ready();
});
