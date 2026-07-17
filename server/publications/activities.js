import { ReactiveCache } from '/imports/reactiveCache';
import { getFeatureFlags } from '/models/lib/featureFlags';

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
  }

  const selector = showActivities
    ? { [`${kind}Id`]: { $in: linkedElmtId } }
    : { $and: [{ activityType: 'addComment' }, { [`${kind}Id`]: { $in: linkedElmtId } }] };

  const ret = await ReactiveCache.getActivities(selector,
    {
      limit,
      sort: { createdAt: -1 },
    },
    true,
  );

  return ret;
});
