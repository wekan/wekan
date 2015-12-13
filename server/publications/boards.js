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
      { members: { $elemMatch: { userId: this.userId, isActive: true }}},
      { _id: { $in: starredBoards } },
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

Meteor.publishComposite('board', function(boardId) {
  check(boardId, String);
  return {
    find() {
      return Boards.find({
        _id: boardId,
        archived: false,
        // If the board is not public the user has to be a member of it to see
        // it.
        $or: [
          { permission: 'public' },
          { members: { $elemMatch: { userId: this.userId, isActive: true }}},
        ],
      }, { limit: 1 });
    },
    children: [
      // Lists
      {
        find(board) {
          return Lists.find({
            boardId: board._id,
          });
        },
      },

      // Cards and cards comments
      // XXX Originally we were publishing the card documents as a child of the
      // list publication defined above using the following selector `{ listId:
      // list._id }`. But it was causing a race condition in publish-composite,
      // that I documented here:
      //
      //   https://github.com/englue/meteor-publish-composite/issues/29
      //
      // I then tried to replace publish-composite by cottz:publish, but it had
      // a similar problem:
      //
      //   https://github.com/Goluis/cottz-publish/issues/4
      //   https://github.com/wekan/wekan/pull/78
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
      {
        find(board) {
          return Cards.find({
            boardId: board._id,
          });
        },

        children: [
          // comments
          {
            find(card) {
              return CardComments.find({
                cardId: card._id,
              });
            },
          },
          // Attachments
          {
            find(card) {
              return Attachments.find({
                cardId: card._id,
              });
            },
          },
        ],
      },

      // Board members. This publication also includes former board members that
      // aren't members anymore but may have some activities attached to them in
      // the history.
      {
        find(board) {
          return Users.find({
            _id: { $in: _.pluck(board.members, 'userId') },
          });
        },
        // Presence indicators
        children: [{
          find(user) {
            return presences.find({userId: user._id});
          },
        }],
      },
    ],
  };
});
