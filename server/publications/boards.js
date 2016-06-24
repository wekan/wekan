// This is the publication used to display the board list. We publish all the
// non-archived boards:
// 1. that the user is a member of
// 2. the user has starred
Meteor.publish('boards', function() {
  // Ensure that the user is connected. If it is not, we need to return an empty
  // array to tell the client to remove the previously published docs.
  if (!Match.test(this.userId, String))
    return [];

  // Defensive programming to verify that starredBoards has the expected
  // format -- since the field is in the `profile` a user can modify it.
  const {starredBoards = []} = Users.findOne(this.userId).profile;
  check(starredBoards, [String]);

  return Boards.find({
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
      archived: 1,
      slug: 1,
      title: 1,
      description: 1,
      color: 1,
      members: 1,
      permission: 1,
    },
  });
});

Meteor.publish('archivedBoards', function() {
  if (!Match.test(this.userId, String))
    return [];

  return Boards.find({
    archived: true,
    members: {
      $elemMatch: {
        userId: this.userId,
        isAdmin: true,
      },
    },
  }, {
    fields: {
      _id: 1,
      archived: 1,
      slug: 1,
      title: 1,
    },
  });
});

Meteor.publishRelations('board', function(boardId) {
  check(boardId, String);

  this.cursor(Boards.find({
    _id: boardId,
    archived: false,
    // If the board is not public the user has to be a member of it to see
    // it.
    $or: [
      { permission: 'public' },
      { members: { $elemMatch: { userId: this.userId, isActive: true }}},
    ],
  }, { limit: 1 }), function(boardId, board) {
    this.cursor(Lists.find({ boardId }));

    // Cards and cards comments
    // XXX Originally we were publishing the card documents as a child of the
    // list publication defined above using the following selector `{ listId:
    // list._id }`. But it was causing a race condition in publish-composite,
    // that I documented here:
    //
    //   https://github.com/englue/meteor-publish-composite/issues/29
    //
    // cottz:publish had a similar problem:
    //
    //   https://github.com/Goluis/cottz-publish/issues/4
    //
    // The current state of relational publishing in meteor is a bit sad,
    // there are a lot of various packages, with various APIs, some of them
    // are unmaintained. Fortunately this is something that will be fixed by
    // meteor-core at some point:
    //
    //   https://trello.com/c/BGvIwkEa/48-easy-joins-in-subscriptions
    //
    // And in the meantime our code below works pretty well -- it's not even a
    // hack!
    this.cursor(Cards.find({ boardId }), function(cardId) {
      this.cursor(CardComments.find({ cardId }));
      this.cursor(Attachments.find({ cardId }));
      this.cursor(Checklists.find({ cardId }));
    });

    // Board members. This publication also includes former board members that
    // aren't members anymore but may have some activities attached to them in
    // the history.
    //
    this.cursor(Users.find({
      _id: { $in: _.pluck(board.members, 'userId') },
    }, { fields: {
      'username': 1,
      'profile.fullname': 1,
      'profile.avatarUrl': 1,
    }}), function(userId) {
      // Presence indicators
      this.cursor(presences.find({ userId }));
    });
  });

  return this.ready();
});
