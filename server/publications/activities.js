import { ReactiveCache } from '/imports/reactiveCache';

// We use activities fields at two different places:
// 1. The board sidebar
// 2. The card activity tab
// We use this publication to paginate for these two publications.

Meteor.publish('activities', (kind, id, limit, showActivities) => {
  check(
    kind,
    Match.Where(x => {
      return ['board', 'card'].indexOf(x) !== -1;
    }),
  );
  check(id, String);
  check(limit, Number);
  check(showActivities, Boolean);

  // Get linkedBoard
  let linkedElmtId = [id];
  if (kind == 'board') {
    ReactiveCache.getCards({
      "type": "cardType-linkedBoard",
      "boardId": id}
      ).forEach(card => {
        linkedElmtId.push(card.linkedId);
    });
  }

  const selector = showActivities
    ? { [`${kind}Id`]: { $in: linkedElmtId } }
    : { $and: [{ activityType: 'addComment' }, { [`${kind}Id`]: { $in: linkedElmtId } }] };
  const ret = ReactiveCache.getActivities(selector,
    {
      limit,
      sort: { createdAt: -1 },
    },
    true,
  );
  return ret;
});
