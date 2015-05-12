// We use activities fields at three different places:
// 1. The home page that contains
// 2. The board
// 3.
// We use publish paginate for these three publications.

Meteor.publish('activities', function(mode, id, limit) {
  check(mode, Match.Where(function(x) {
    return ['board', 'card'].indexOf(x) !== -1;
  }));
  check(id, String);
  check(limit, Number);

  var selector = {};
  if (mode === 'board')
    selector.boardId = id;
  else if (mode === 'card')
    selector.cardId = id;

  return Activities.find(selector, {
    sort: {createdAt: -1},
    limit: limit
  });
});
