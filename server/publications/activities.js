// We use activities fields at two different places:
// 1. The board sidebar
// 2. The card activity tab
// We use this publication to paginate for these two publications.

Meteor.publish('activities', (kind, id, limit, hideSystem) => {
  check(kind, Match.Where((x) => {
    return ['board', 'card'].indexOf(x) !== -1;
  }));
  check(id, String);
  check(limit, Number);
  check(hideSystem, Boolean);

  const selector = (hideSystem) ? {$and: [{activityType: 'addComment'}, {[`${kind}Id`]: id}]} : {[`${kind}Id`]: id};
  return Activities.find(selector, {
    limit,
    sort: {createdAt: -1},
  });
});
