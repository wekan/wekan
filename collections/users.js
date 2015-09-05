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
    return Boards.find({archived: false, _id: {$in: starredBoardIds}});
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
  isOrganizationMember: function() {
    var org = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
    return org && _.contains(_.pluck(org.members, 'userId'), this._id) &&
                         _.where(org.members, {userId: this._id})[0].isActive;
  },
  isOrganizationAdmin: function() {
    var org = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
    if (org && this.isOrganizationMember(org))
      return _.where(org.members, {userId: this._id})[0].isAdmin;
  },
  getInitials: function() {
    var profile = this.profile || {};
    if (profile.initials)
      return profile.initials;

    else if (profile.fullname) {
      return _.reduce(profile.fullname.split(/\s+/), function(memo, word) {
        return memo + word[0];
      }, '').toUpperCase();

    } else {
      return this.username[0].toUpperCase();
    }
  },

  toggleBoardStar: function(boardId) {
    var queryType = this.hasStarred(boardId) ? '$pull' : '$addToSet';
    var query = {};
    query[queryType] = {
      'profile.starredBoards': boardId
    };
    Meteor.users.update(this._id, query);
  }
});

Meteor.methods({
  setUsername: function(username) {
    check(username, String);
    var nUsersWithUsername = Users.find({username: username}).count();
    if (nUsersWithUsername > 0) {
      throw new Meteor.Error('username-already-taken');
    } else {
      Users.update(this.userId, {$set: {
        username: username
      }});
    }
  }
});

Users.before.insert(function(userId, doc) {
  doc.profile = doc.profile || {};

  if (! doc.username && doc.profile.name) {
    doc.username = doc.profile.name.toLowerCase().replace(/\s/g, '');
  }
});

if (Meteor.isServer) {
  // Let mongoDB ensure username unicity
  Meteor.startup(function() {
    Users._collection._ensureIndex({
      username: 1
    }, { unique: true });
  });

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

// Presence indicator
if (Meteor.isClient) {
  Presence.state = function() {
    return {
      currentBoardId: Session.get('currentBoard')
    };
  };
}
