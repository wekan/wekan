import { ReactiveCache } from '/imports/reactiveCache';
import { publishComposite } from 'meteor/reywood:publish-composite';
import Boards from '/models/boards';
import Cards from '/models/cards';
// A client-supplied selector is run against the database, so an execution
// operator in one is not a query - it is an attempt to make the database run
// something. This publication refuses it and names WHO tried, from where, and
// what they sent (docs/Security/Remediation/WeKan.md §12.6).
//
// The check used to live here as a local helper. GHSA-phm4-4v26-j2vq was eight
// OTHER handlers taking the same shape of client-supplied selector and never
// calling it, so it moved to /server/lib/selectorGuard - unchanged - and every
// caller now shares the one copy. Leaving a second copy behind here would be the
// same mistake set up to happen again.
import { selectorIsInjection } from '/server/lib/selectorGuard';
const {
  boardCardScope,
  assignedOnlyCardScope,
  mergeCardScope,
} = require('/models/lib/boardCardScope');
const { sortWithIdTiebreaker } = require('/models/lib/cardSortTiebreaker');
const { diffCardWindow } = require('/models/lib/cardWindowDiff');
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
  // Same as the `board` publication: a bad argument from a client must end the
  // subscription, not the server process. A falsy return publishes nothing.
  // `Match.Any` marks each argument as checked for audit-argument-checks (which
  // fails a publisher that did not check them all); the validation is below.
  check(boardId, Match.Any);
  check(cardSelector, Match.Any);
  check(sort, Match.Any);
  check(limit, Match.Any);
  if (!Match.test(boardId, String) || !boardId) return;
  if (!Match.test(cardSelector, Object)) return;
  if (!Match.test(sort, Match.OneOf(Object, null, undefined))) return;
  if (!Match.test(limit, Number)) return;

  const userId = this.userId;
  const publication = this;
  let windowStarted = false;
  const lim = Math.max(1, Math.min(Math.floor(limit) || 1, MAX_WINDOW));
  const safe = selectorIsInjection(cardSelector, 'boardCardsWindow')
    ? { _id: { $in: [] } }
    : cardSelector;
  // #6511: a UNIQUE _id tiebreaker so the LIMITED published window is deterministic
  // (equal-`sort` ties would otherwise make the "first N cards" vary between polls,
  // feeding the client's #each an inconsistent ordered set).
  const sortOpt = sortWithIdTiebreaker(sort || { sort: 1 });

  // The window's card selector, scoped to the board — and, for an ASSIGNED-ONLY
  // member, to the cards they are assigned to.
  //
  // That restriction was missing here. The `board` publication has always narrowed
  // its card cursor with `assignees: { $in: [userId] }` for a member carrying
  // isReadAssignedOnly / isNormalAssignedOnly / isCommentAssignedOnly, but this
  // publication — which is what ships the cards in LAZY card-loading mode — did
  // not. So whether the restriction applied at all depended on the board's
  // card-loading mode: the same member saw only their own cards on a small board
  // and every card in the window on a big one. It has to hold in both, so it is
  // part of the window scope now, and because `windowCardIds` builds on the same
  // selector, the window's comments, attachments, checklists and checklist items
  // are narrowed with it rather than leaking the children of cards whose minicard
  // is not published.
  //
  // mergeCardScope keeps the scope at the TOP level whenever it can: FerretDB v1
  // (SQLite) does NOT push a top-level `$and` down to its index, so the wrapped
  // form full-scanned the whole `cards` table on every poll and the window never
  // became ready — cards never loaded on a big (lazy) board (10.22). It falls back
  // to `$and` only when the client selector already speaks for one of the scope's
  // keys, where a merge would silently replace one with the other — which for
  // `assignees` is the difference between enforcing the restriction and dropping
  // it, since the board Filter has an assignee filter of its own. The in-Go filter
  // remains the authority either way.
  const windowSel = board =>
    mergeCardScope(safe, {
      boardId: board._id,
      archived: false,
      ...assignedOnlyCardScope(board, userId),
    });

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
      // `members` is published because the CHILDREN below need it: publish-composite
      // hands each child the document as this cursor published it, so with the old
      // `{ _id: 1 }` projection `board.members` was undefined in every child and
      // assignedOnlyCardScope() could never see a flag to act on. It also makes the
      // restriction reactive — changing a member's assigned-only flag re-runs the
      // window instead of taking effect on the next subscribe. The board publication
      // already ships this board's members to the same client, so nothing new is
      // exposed by it.
      return Boards.find(
        { _id: boardId },
        { fields: { _id: 1, members: 1 }, limit: 1 },
      );
    },
    children: [
      // The window's cards.
      {
        async find(board) {
          // FerretDB cannot reliably establish the sorted, limited live cursor
          // that publish-composite normally observes, so keep fetching snapshots.
          // A one-time snapshot, however, made every later move/edit invisible
          // until reload (#6645). Diff successive bounded snapshots and emit the
          // same DDP added/changed/removed messages a live cursor would produce.
          if (windowStarted) return null;
          windowStarted = true;
          let stopped = false;
          let refreshing = false;
          let refreshQueued = false;
          let initializingObserver = true;
          let observerHandle;
          let cards = [];

          const refresh = async () => {
            refreshQueued = true;
            if (stopped || refreshing) return;
            refreshing = true;
            try {
              // An event can arrive while the bounded query is running. Keep
              // one follow-up queued rather than losing that change or running
              // overlapping queries for a burst of card updates.
              while (refreshQueued && !stopped) {
                refreshQueued = false;
                const next = (await ReactiveCache.getCards(
                  windowSel(board),
                  { sort: sortOpt, limit: lim },
                  false,
                )) || [];
                if (stopped) return;

                const diff = diffCardWindow(cards, next);
                for (const card of diff.added) {
                  const { _id, ...fields } = card;
                  publication.added('cards', _id, fields);
                }
                for (const card of diff.changed) {
                  publication.changed('cards', card._id, card.fields);
                }
                for (const cardId of diff.removed) {
                  publication.removed('cards', cardId);
                }
                cards = next;
              }
            } finally {
              refreshing = false;
            }
          };

          await refresh();
          publication.onStop(() => {
            stopped = true;
            if (observerHandle) observerHandle.stop();
          });

          // Observe the unrestricted selector, not the sorted/limited cursor
          // that stalls on FerretDB. Any matching card change asks refresh() to
          // fetch and diff the small visible window. Initial observer additions
          // are ignored because the first snapshot is already published.
          observerHandle = await Cards.find(windowSel(board)).observeChangesAsync({
            added: () => {
              if (initializingObserver) return;
              return refresh().catch(error => publication.error(error));
            },
            changed: () => refresh().catch(error => publication.error(error)),
            removed: () => refresh().catch(error => publication.error(error)),
          });
          if (stopped) {
            observerHandle.stop();
            return null;
          }
          initializingObserver = false;
          // Close the small race between the initial snapshot and observer setup.
          await refresh();
          return null;
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
  if (!board || selectorIsInjection(cardSelector, 'boardCardsCount')) {
    return this.ready();
  }

  // The same assigned-only narrowing as the window above: a member who may only
  // see the cards assigned to them must not be TOLD there are more. This count is
  // what the list's "load more" spinner is decided from, so leaving it unrestricted
  // both leaked how many cards the list really holds and offered to scroll in
  // cards that would never arrive.
  const sel = mergeCardScope(cardSelector, {
    boardId,
    archived: false,
    ...assignedOnlyCardScope(board, this.userId),
  });
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
  // A null board id here is the same crash: this publisher is async too.
  // Match.Any marks it checked for audit-argument-checks; the test is the guard.
  check(boardId, Match.Any);
  if (!Match.test(boardId, String) || !boardId) return this.ready();

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
      { ...boardCardScope(board), archived: false },
    ).countAsync();
    lazy = effectiveBoardCardsMode('auto', count, threshold) === 'lazy';
  }

  this.added('boardCardLoadingModes', boardId, { lazy });
  this.ready();
});
