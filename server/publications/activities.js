import { ReactiveCache } from '/imports/reactiveCache';
import { getFeatureFlags } from '/models/lib/featureFlags';

const { isAssignedOnlyMember, mayCopyFromBoard } = require('/models/lib/boardCardScope');

// We use activities fields at two different places:
// 1. The board sidebar
// 2. The card activity tab
// We use this publication to paginate for these two publications.
//
// #2539 ("Load only visible activities etc"): this is already satisfied. Like the
// visible-cards infinite scroll (#2144), activities are loaded progressively: the
// client passes an increasing `limit` (page * activitiesPerPage) via loadNextPage,
// and the publication below only ships the most-recent `limit` activities
// (sort createdAt:-1). So a board with tens of thousands of activities never loads
// them all at once, and no manual cleanup is required to keep the board fast.

Meteor.publish('activities', async function(kind, id, limit, showActivities) {
  check(
    kind,
    Match.Where(x => {
      return ['board', 'card'].indexOf(x) !== -1;
    }),
  );
  check(id, Match.Maybe(String));
  check(limit, Number);
  check(showActivities, Boolean);

  // Admin Panel / Features / Notifications (#5820): hide all activity-feed
  // entries (existing and new) when activities are disabled. After check() so the
  // argument-checks audit is satisfied.
  if (getFeatureFlags().disableActivities) {
    return this.ready();
  }

  // Return empty cursor if id is null or undefined
  if (!id) {
    return this.ready();
  }

  if (!this.userId) {
    return this.ready();
  }

  // isVisibleBy() expects a user object with _id, not a raw userId string
  const userForVisibility = { _id: this.userId };

  let linkedElmtId = [id];
  let board;

  if (kind === 'board') {
    board = await ReactiveCache.getBoard(id);
    if (!board || !board.isVisibleBy(userForVisibility)) {
      return this.ready();
    }

    // Get linked boards, but only those visible to the user
    const linkedCards = await ReactiveCache.getCards({
      "type": "cardType-linkedBoard",
      "boardId": id
    });
    for (const card of linkedCards) {
      const linkedBoard = await ReactiveCache.getBoard(card.linkedId);
      if (linkedBoard && linkedBoard.isVisibleBy(userForVisibility)) {
        linkedElmtId.push(card.linkedId);
      }
    }
  } else if (kind === 'card') {
    const card = await ReactiveCache.getCard(id);
    if (!card) {
      return this.ready();
    }
    board = await ReactiveCache.getBoard(card.boardId);
    if (!board || !board.isVisibleBy(userForVisibility)) {
      return this.ready();
    }
    // An assigned-only member sees only their assigned cards' history.
    if (!mayCopyFromBoard(board, this.userId, card)) {
      return this.ready();
    }
  }

  const clauses = [{ [`${kind}Id`]: { $in: linkedElmtId } }];
  if (!showActivities) clauses.push({ activityType: 'addComment' });
  // On a board an assigned-only member reads the board's own activities that
  // concern no card, and those of the cards assigned to them; a linked board's
  // activities stay under that board's own visibility check above.
  if (kind === 'board' && isAssignedOnlyMember(board, this.userId)) {
    const assigned = await ReactiveCache.getCards({ boardId: board._id, assignees: this.userId }, { fields: { _id: 1 } });
    clauses.push({ $or: [
      { boardId: { $ne: board._id } },
      { cardId: { $exists: false } },
      { cardId: null },
      { cardId: { $in: (assigned || []).map(c => c._id) } },
    ] });
  }
  const selector = clauses.length === 1 ? clauses[0] : { $and: clauses };

  const ret = await ReactiveCache.getActivities(selector,
    {
      limit,
      sort: { createdAt: -1 },
    },
    true,
  );

  return ret;
});
