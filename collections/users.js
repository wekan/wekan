Users = Meteor.users;

// Search a user in the complete server database by its name or username. This
// is used for instance to add a new user to a board.
var searchInFields = ['username', 'profile.name'];
Users.initEasySearch(searchInFields, {
  use: 'mongo-db',
  returnFields: searchInFields
});

Users.helpers({
  boards: function() {
    return Boards.find({ userId: this._id });
  },
  starredBoards: function() {
    var starredBoardIds = this.profile.starredBoards || [];
    return Boards.find({_id: {$in: starredBoardIds}});
  },
  hasStarred: function(boardId) {
    var starredBoardIds = this.profile.starredBoards || [];
    return _.contains(starredBoardIds, boardId);
  },
  isBoardMember: function() {
    var board = Boards.findOne(Session.get('currentBoard'));
    return board && _.contains(_.pluck(board.members, 'userId'), this._id) &&
                         _.where(board.members, {userId: this._id})[0].isActive;
  },
  isBoardAdmin: function() {
    var board = Boards.findOne(Session.get('currentBoard'));
    if (this.isBoardMember(board))
      return _.where(board.members, {userId: this._id})[0].isAdmin;
  },

  toggleBoardStar: function(boardId) {
    var queryType = Meteor.user().hasStarred(boardId) ? '$pull' : '$addToSet';
    var query = {};
    query[queryType] = {
      'profile.starredBoards': boardId
    };
    Meteor.users.update(Meteor.userId(), query);
  }
});

Users.before.insert(function(userId, doc) {
  doc.profile = doc.profile || {};

  // connect profile.status default
  doc.profile.status = 'offline';
});

if (Meteor.isServer) {
  // Each board document contains the de-normalized number of users that have
  // starred it. If the user star or unstar a board, we need to update this
  // counter.
  // We need to run this code on the server only, otherwise the incrementation
  // will be done twice.
  Users.after.update(function(userId, user, fieldNames) {
    // The `starredBoards` list is hosted on the `profile` field. If this
    // field hasn't been modificated we don't need to run this hook.
    if (! _.contains(fieldNames, 'profile'))
      return;

    // To calculate a diff of board starred ids, we get both the previous
    // and the newly board ids list
    var getStarredBoardsIds = function(doc) {
      return doc.profile && doc.profile.starredBoards;
    };
    var oldIds = getStarredBoardsIds(this.previous);
    var newIds = getStarredBoardsIds(user);

    // The _.difference(a, b) method returns the values from a that are not in
    // b. We use it to find deleted and newly inserted ids by using it in one
    // direction and then in the other.
    var incrementBoards = function(boardsIds, inc) {
      _.forEach(boardsIds, function(boardId) {
        Boards.update(boardId, {$inc: {stars: inc}});
      });
    };
    incrementBoards(_.difference(oldIds, newIds), -1);
    incrementBoards(_.difference(newIds, oldIds), +1);
  });

  // XXX i18n
  Users.after.insert(function(userId, doc) {
    var ExampleBoard = {
      title: 'Welcome Board',
      userId: doc._id,
      permission: 'private'
    };

    // Insert the Welcome Board
    Boards.insert(ExampleBoard, function(err, boardId) {

      _.forEach(['Basics', 'Advanced'], function(title) {
        var list = {
          title: title,
          boardId: boardId,
          userId: ExampleBoard.userId,

          // XXX Not certain this is a bug, but we except these fields get
          // inserted by the Lists.before.insert collection-hook. Since this
          // hook is not called in this case, we have to dublicate the logic and
          // set them here.
          archived: false,
          createdAt: new Date()
        };

        Lists.insert(list);
      });
    });
  });
}
