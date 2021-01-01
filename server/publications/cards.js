Meteor.publish('card', cardId => {
  check(cardId, String);
  return Cards.find({ _id: cardId });
});

Meteor.publish('myCards', function() {
  const userId = this.userId;

  return Cards.find(
    {
      archived: false,
      $or: [{ members: userId }, { assignees: userId }],
    },
    {
      fields: {
        _id: 1,
        archived: 1,
        boardId: 1,
        swimlaneId: 1,
        listId: 1,
        title: 1,
        type: 1,
        sort: 1,
        members: 1,
        assignees: 1,
        colors: 1,
        dueAt: 1,
      },
      // sort: {
      //   sort: ['boardId', 'listId', 'sort'],
      // },
    },
  );
});
