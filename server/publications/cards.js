Meteor.publish('card', (cardId) => {
  check(cardId, String);
  return Cards.find({ _id: cardId });
});

Meteor.publish('boardCards', (board) => {
  check(board, String);
  return Cards.find({boardId: board},
    {fields: {
      title: 1,
      listId: 1,
      boardId: 1,
      archived: 1,
    }});
});