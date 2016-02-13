Blaze.registerHelper('currentBoard', () => {
  const boardId = Session.get('currentBoard');
  if (boardId) {
    return Boards.findOne(boardId);
  } else {
    return null;
  }
});

Blaze.registerHelper('currentCard', () => {
  const cardId = Session.get('currentCard');
  if (cardId) {
    return Cards.findOne(cardId);
  } else {
    return null;
  }
});

Blaze.registerHelper('getUser', (userId) => Users.findOne(userId));

Blaze.registerHelper('concat', function (...args) {
  return Array.prototype.slice.call(args, 0, -1).join('');
});
