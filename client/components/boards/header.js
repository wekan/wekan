Template.headerBoard.helpers({
  isStarred: function() {
    var boardId = Session.get('currentBoard');
    var user = Meteor.user();
    return boardId && user && user.hasStarred(boardId);
  }
});
