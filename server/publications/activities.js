import { ReactiveCache } from '/imports/reactiveCache';

// We use activities fields at two different places:
// 1. The board sidebar
// 2. The card activity tab
// We use this publication to paginate for these two publications.

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

  // Return empty cursor if id is null or undefined
  if (!id) {
    return this.ready();
  }

  if (!this.userId) {
    return this.ready();
  }

  let linkedElmtId = [id];
  let board;

  if (kind === 'board') {
    board = await ReactiveCache.getBoard(id);
    if (!board || !board.isVisibleBy(this.userId)) {
      return this.ready();
    }

    // Get linked boards, but only those visible to the user
    const linkedCards = await ReactiveCache.getCards({
      "type": "cardType-linkedBoard",
      "boardId": id
    });
    for (const card of linkedCards) {
      const linkedBoard = await ReactiveCache.getBoard(card.linkedId);
      if (linkedBoard && linkedBoard.isVisibleBy(this.userId)) {
        linkedElmtId.push(card.linkedId);
      }
    }
  } else if (kind === 'card') {
    const card = await ReactiveCache.getCard(id);
    if (!card) {
      return this.ready();
    }
    board = await ReactiveCache.getBoard(card.boardId);
    if (!board || !board.isVisibleBy(this.userId)) {
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
