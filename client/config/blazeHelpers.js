Blaze.registerHelper('currentBoard', function() {
  var boardId = Session.get('currentBoard');
  if (boardId) {
    return Boards.findOne(boardId);
  }
});

Blaze.registerHelper('currentCard', function() {
  var cardId = Session.get('currentCard');
  if (cardId) {
    return Cards.findOne(cardId);
  }
});
