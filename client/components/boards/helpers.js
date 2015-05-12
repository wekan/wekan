Template.boards.helpers({
  boards: function() {
    return Boards.find({}, {
      sort: ['title']
    });
  },

  starredBoards: function() {
    var cursor = Boards.find({
      _id: { $in: Meteor.user().profile.starredBoards || [] }
    }, {
      sort: ['title']
    });
    return cursor.count() === 0 ? null : cursor;
  },

  isStarred: function() {
    var user = Meteor.user();
    return user && user.hasStarred(this._id);
  }
});

Template.boardChangePermissionPopup.helpers({
  check: function(perm) {
    return this.permission === perm;
  }
});

Template.boardChangeColorPopup.helpers({
  backgroundColors: function() {
    return Boards.simpleSchema()._schema.color.allowedValues;
  },

  isSelected: function() {
    var currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.color === this.toString();
  }
});

Blaze.registerHelper('currentBoard', function() {
  var boardId = Session.get('currentBoard');
  if (boardId) {
    return Boards.findOne(boardId);
  }
});
