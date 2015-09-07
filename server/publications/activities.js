// We use activities fields at two different places:
// 1. The board sidebar
// 2. The card activity tab
// We use this publication to paginate for these two publications.

Meteor.publish('activities', (kind, id, limit) => {
  check(kind, Match.Where((x) => {
    return ['board', 'card'].indexOf(x) !== -1;
  }));
  check(id, String);
  check(limit, Number);

  return Activities.find({
    [`${kind}Id`]: id,
  }, {
    limit,
    sort: {createdAt: -1},
  });
});
