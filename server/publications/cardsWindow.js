import { ReactiveCache } from '/imports/reactiveCache';
import { publishComposite } from 'meteor/reywood:publish-composite';
import Boards from '/models/boards';
import Cards from '/models/cards';
const { hasWhere } = require('/models/lib/mongoSelectorSafety');

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

  return {
    async find() {
      const board = await boardVisibleTo(userId, boardId);
      if (!board) return [];
      return Boards.find({ _id: boardId }, { fields: { _id: 1 }, limit: 1 });
    },
    children: [
      {
        async find(board) {
          const sel = { $and: [safe, { boardId: board._id, archived: false }] };
          return await ReactiveCache.getCards(sel, { sort: sort || { sort: 1 }, limit: lim }, true);
        },
        children: [
          {
            async find(card) {
              return await ReactiveCache.getCardComments({ cardId: card._id }, {}, true);
            },
          },
          {
            async find(card) {
              const result = await ReactiveCache.getAttachments({ 'meta.cardId': card._id }, {}, true);
              return result.cursor || result;
            },
          },
          {
            async find(card) {
              return await ReactiveCache.getChecklists({ cardId: card._id }, {}, true);
            },
          },
          {
            async find(card) {
              return await ReactiveCache.getChecklistItems({ cardId: card._id }, {}, true);
            },
          },
        ],
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
