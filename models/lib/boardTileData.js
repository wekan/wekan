'use strict';

// Pure helpers for the All Boards page board tiles: the per-list card-count
// line ("To Do: 3  Doing: 1 ...") and the board-member avatar row shown on
// each board tile. Extracted so the decision logic is unit-testable in plain
// Node without Meteor (mirrors models/lib/boardSortReorder.js).
//
// Background (#5174 screenshots / #4825 / #4214):
//   - The original client helpers computed the counts from reactive
//     ReactiveCache.getLists()/getCards() cursors inside the tile helpers,
//     which made the All Boards icons re-render in a loop ("icons random
//     dance", #4214). They were stubbed out to `return []`, so NO tile ever
//     showed its card counts or member avatars again, regardless of the
//     Admin Panel settings (hideCardCounterList / hideBoardMemberList) or the
//     per-board flags.
//   - Before the stubbing, tiles rendered inconsistently (#4825: "Show card
//     count per list doesn't deactivate", members never shown): the per-board
//     flags (allowsCardCounterList / allowsBoardMemberList, opt-in, default
//     false) were evaluated loosely and boards created before the feature
//     (#4691) have no field at all.
//
// The fix: a Meteor method (getAllBoardsTileData, server/publications/
// boards.js) computes everything ONCE server-side — list titles + card counts
// via a single grouped query, member ids from the board doc — and the client
// stores the result in a ReactiveVar it sets exactly once (no reactive
// cursors), so #4214 cannot return. These helpers are the pure core:
//
//   - showsCardCounterList / showsBoardMemberList: the per-board flags are
//     honored STRICTLY (=== true). Disabled or missing flag -> hidden, for
//     every board, deterministically (fixes both directions of #4825).
//   - buildBoardTileData: folds boards + lists + card counts into the map the
//     tiles render from, already gated by those flags so a disabled board
//     never even carries the data.

// Whether this board opted in to showing the per-list card counter line on
// its All Boards tile. The schema default is false (opt-in via the board
// sidebar "Show card count per list" checkbox); boards created before the
// feature existed have no field, which must mean "off" — not "sometimes on"
// (#4825).
function showsCardCounterList(board) {
  return !!(board && board.allowsCardCounterList === true);
}

// Whether this board opted in to showing the member avatar row on its tile
// ("Show Board members avatars" checkbox). Same strict semantics.
function showsBoardMemberList(board) {
  return !!(board && board.allowsBoardMemberList === true);
}

// One entry of the tile's card-counter line, e.g. "To Do: 3".
function formatListCount(title, count) {
  const n = typeof count === 'number' && count > 0 ? count : 0;
  return `${title || ''}: ${n}`;
}

// Fold card docs (only their listId is needed) into { listId: count }. Used
// by the server method as the portable alternative to a $group aggregation.
function countCardsByListId(cards) {
  const counts = {};
  (cards || []).forEach((card) => {
    if (card && card.listId) {
      counts[card.listId] = (counts[card.listId] || 0) + 1;
    }
  });
  return counts;
}

// Build the per-board tile data map:
//   { [boardId]: { showLists, showMembers, lists: ['Title: N', ...],
//                  memberIds: ['userId', ...] } }
//
// - boards: board docs with _id, members, allowsCardCounterList,
//   allowsBoardMemberList.
// - lists: list docs with _id, boardId, title, sort (non-archived lists of
//   the boards that show counters). Rendered in board order (sort asc, title
//   as tiebreaker), like the lists on the board itself.
// - cardCountByListId: { listId: count } for non-archived cards.
//
// Boards whose flag is off (or missing) get empty arrays, so the tile shows
// nothing for them even if a caller forgets to check the show* flags.
function buildBoardTileData(boards, lists, cardCountByListId) {
  const counts = cardCountByListId || {};
  const tiles = {};
  (boards || []).forEach((board) => {
    if (!board || !board._id) return;
    const showMembers = showsBoardMemberList(board);
    tiles[board._id] = {
      showLists: showsCardCounterList(board),
      showMembers,
      lists: [],
      memberIds: showMembers
        ? (board.members || [])
            .filter((m) => m && m.userId && m.isActive !== false)
            .map((m) => m.userId)
        : [],
    };
  });
  const orderedLists = (lists || []).slice().sort((a, b) => {
    const sa = a && typeof a.sort === 'number' ? a.sort : 0;
    const sb = b && typeof b.sort === 'number' ? b.sort : 0;
    if (sa !== sb) return sa - sb;
    return String((a && a.title) || '').localeCompare(String((b && b.title) || ''));
  });
  orderedLists.forEach((list) => {
    if (!list || !list.boardId || !list._id) return;
    const tile = tiles[list.boardId];
    if (!tile || !tile.showLists) return;
    tile.lists.push(formatListCount(list.title, counts[list._id]));
  });
  return tiles;
}

module.exports = {
  showsCardCounterList,
  showsBoardMemberList,
  formatListCount,
  countCardsByListId,
  buildBoardTileData,
};
