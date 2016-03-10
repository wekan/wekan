Blaze.registerHelper('currentBoard', () => {
  const boardId = Session.get('currentBoard');
  return boardId
    ? Boards.findOne(boardId)
    : undefined;
});

Blaze.registerHelper('currentCard', () => {
  const cardId = Session.get('currentCard');
  return cardId
   ? Cards.findOne(cardId)
   : undefined;
});

Blaze.registerHelper('getUser', (userId) => Users.findOne(userId));

Blaze.registerHelper('concat', function (...args) {
  return Array.prototype.slice.call(args, 0, -1).join('');
});
