Meteor.publish('card', cardId => {
  check(cardId, String);
  return Cards.find({ _id: cardId });
});

Meteor.publish('myCards', function() {
  const userId = Meteor.userId();

  const archivedBoards = [];
  Boards.find({ archived: true }).forEach(board => {
    archivedBoards.push(board._id);
  });

  const archivedSwimlanes = [];
  Swimlanes.find({ archived: true }).forEach(swimlane => {
    archivedSwimlanes.push(swimlane._id);
  });

  const archivedLists = [];
  Lists.find({ archived: true }).forEach(list => {
    archivedLists.push(list._id);
  });

  selector = {
    archived: false,
    boardId: { $nin: archivedBoards },
    swimlaneId: { $nin: archivedSwimlanes },
    listId: { $nin: archivedLists },
    $or: [{ members: userId }, { assignees: userId }],
  };

  const cards = Cards.find(selector, {
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
  });

  const boards = [];
  const swimlanes = [];
  const lists = [];
  const users = [];

  cards.forEach(card => {
    if (card.boardId) boards.push(card.boardId);
    if (card.swimlaneId) swimlanes.push(card.swimlaneId);
    if (card.listId) lists.push(card.listId);
    if (card.members) {
      card.members.forEach(userId => {
        users.push(userId);
      });
    }
    if (card.assignees) {
      card.assignees.forEach(userId => {
        users.push(userId);
      });
    }
  });

  return [
    cards,
    Boards.find({ _id: { $in: boards } }),
    Swimlanes.find({ _id: { $in: swimlanes } }),
    Lists.find({ _id: { $in: lists } }),
    Users.find({ _id: { $in: users } }, { fields: Users.safeFields }),
  ];
});

Meteor.publish('dueCards', function(allUsers = false) {
  check(allUsers, Boolean);

  // eslint-disable-next-line no-console
  // console.log('all users:', allUsers);

  const user = Users.findOne({ _id: this.userId });

  const archivedBoards = [];
  Boards.find({ archived: true }).forEach(board => {
    archivedBoards.push(board._id);
  });

  const permiitedBoards = [];
  let selector = {
    archived: false,
  };

  selector.$or = [
    { permission: 'public' },
    { members: { $elemMatch: { userId: user._id, isActive: true } } },
  ];

  Boards.find(selector).forEach(board => {
    permiitedBoards.push(board._id);
  });

  const archivedSwimlanes = [];
  Swimlanes.find({ archived: true }).forEach(swimlane => {
    archivedSwimlanes.push(swimlane._id);
  });

  const archivedLists = [];
  Lists.find({ archived: true }).forEach(list => {
    archivedLists.push(list._id);
  });

  selector = {
    archived: false,
    boardId: { $nin: archivedBoards, $in: permiitedBoards },
    swimlaneId: { $nin: archivedSwimlanes },
    listId: { $nin: archivedLists },
    dueAt: { $ne: null },
    endAt: null,
  };

  if (!allUsers) {
    selector.$or = [{ members: user._id }, { assignees: user._id }];
  }

  const cards = Cards.find(selector, {
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
  });

  const boards = [];
  const swimlanes = [];
  const lists = [];
  const users = [];

  cards.forEach(card => {
    if (card.boardId) boards.push(card.boardId);
    if (card.swimlaneId) swimlanes.push(card.swimlaneId);
    if (card.listId) lists.push(card.listId);
    if (card.members) {
      card.members.forEach(userId => {
        users.push(userId);
      });
    }
    if (card.assignees) {
      card.assignees.forEach(userId => {
        users.push(userId);
      });
    }
  });

  return [
    cards,
    Boards.find({ _id: { $in: boards } }),
    Swimlanes.find({ _id: { $in: swimlanes } }),
    Lists.find({ _id: { $in: lists } }),
    Users.find({ _id: { $in: users } }, { fields: Users.safeFields }),
  ];
});

Meteor.publish('globalSearch', function(queryParams) {
  check(queryParams, Object);

  // eslint-disable-next-line no-console
  // console.log('queryParams:', queryParams);

  const cards = Cards.globalSearch(queryParams).cards;

  if (!cards) {
    return [];
  }

  SessionData.upsert(
    { userId: this.userId },
    {
      $set: {
        totalHits: cards.count(),
        lastHit: cards.count() > 50 ? 50 : cards.count(),
      },
    },
  );

  const boards = [];
  const swimlanes = [];
  const lists = [];
  const users = [this.userId];

  cards.forEach(card => {
    if (card.boardId) boards.push(card.boardId);
    if (card.swimlaneId) swimlanes.push(card.swimlaneId);
    if (card.listId) lists.push(card.listId);
    if (card.members) {
      card.members.forEach(userId => {
        users.push(userId);
      });
    }
    if (card.assignees) {
      card.assignees.forEach(userId => {
        users.push(userId);
      });
    }
  });

  // eslint-disable-next-line no-console
  // console.log('users:', users);
  return [
    cards,
    Boards.find({ _id: { $in: boards } }),
    Swimlanes.find({ _id: { $in: swimlanes } }),
    Lists.find({ _id: { $in: lists } }),
    Users.find({ _id: { $in: users } }, { fields: Users.safeFields }),
    SessionData.find({ userId: this.userId }),
  ];
});

Meteor.publish('brokenCards', function() {
  const user = Users.findOne({ _id: this.userId });

  const permiitedBoards = [null];
  let selector = {};
  selector.$or = [
    { permission: 'public' },
    { members: { $elemMatch: { userId: user._id, isActive: true } } },
  ];

  Boards.find(selector).forEach(board => {
    permiitedBoards.push(board._id);
  });

  selector = {
    boardId: { $in: permiitedBoards },
    $or: [
      { boardId: { $in: [null, ''] } },
      { swimlaneId: { $in: [null, ''] } },
      { listId: { $in: [null, ''] } },
    ],
  };

  const cards = Cards.find(selector, {
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
  });

  const boards = [];
  const swimlanes = [];
  const lists = [];
  const users = [];

  cards.forEach(card => {
    if (card.boardId) boards.push(card.boardId);
    if (card.swimlaneId) swimlanes.push(card.swimlaneId);
    if (card.listId) lists.push(card.listId);
    if (card.members) {
      card.members.forEach(userId => {
        users.push(userId);
      });
    }
    if (card.assignees) {
      card.assignees.forEach(userId => {
        users.push(userId);
      });
    }
  });

  return [
    cards,
    Boards.find({ _id: { $in: boards } }),
    Swimlanes.find({ _id: { $in: swimlanes } }),
    Lists.find({ _id: { $in: lists } }),
    Users.find({ _id: { $in: users } }, { fields: Users.safeFields }),
  ];
});
