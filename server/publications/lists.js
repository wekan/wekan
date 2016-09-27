Meteor.publish('lists', function() {
  // Ensure that the user is connected. If it is not, we need to return an empty
  // array to tell the client to remove the previously published docs.
  if (!Match.test(this.userId, String))
    return [];
  
  const {starredBoards = []} = Users.findOne(this.userId).profile;
  check(starredBoards, [String]);
  
  var _boards = Boards.find({
    archived: false,
    $or: [
      {
        _id: { $in: starredBoards },
        permission: 'public',
      },
      { members: { $elemMatch: { userId: this.userId, isActive: true }}},
    ],
  }, {
    fields: {
      _id: 1,
    },
  }).fetch();
  
  return Lists.find({
    archived: false,
    boardId: {$in: _.pluck(_boards,'_id')},
  }, {
    fields: {
      _id: 1,
      archived: 1,
      title: 1,
      boardId: 1,
      sort: 1,
      userId: 1,
      createdAt: 1,
    },
  });
});