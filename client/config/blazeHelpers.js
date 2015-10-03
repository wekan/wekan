Blaze.registerHelper('currentBoard', () => {
  const boardId = Session.get('currentBoard');
  if (boardId) {
    return Boards.findOne(boardId);
  }
});

Blaze.registerHelper('currentCard', () => {
  const cardId = Session.get('currentCard');
  if (cardId) {
    return Cards.findOne(cardId);
  }
});

Blaze.registerHelper('getUser', (userId) => Users.findOne(userId));

Blaze.registerHelper('currentLinkedBoard', () => {
  const cardId = Session.get('currentCard');
  if (cardId) {
    const lBoardId = Cards.findOne(cardId, {linkedBoardId:1});
    console.log(lBoardId);
    return lBoardId;

  }
});
