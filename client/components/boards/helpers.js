Blaze.registerHelper('currentBoard', function() {
  var boardId = Session.get('currentBoard');
  if (boardId) {
    return Boards.findOne(boardId);
  }
});
