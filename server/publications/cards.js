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
    Users.find({ _id: { $in: users } }),
  ];
});

Meteor.publish('dueCards', function(allUsers = false) {
  check(allUsers, Boolean);

  // eslint-disable-next-line no-console
  // console.log('all users:', allUsers);

  const user = Users.findOne(this.userId);

  const archivedBoards = [];
  Boards.find({ archived: true }).forEach(board => {
    archivedBoards.push(board._id);
  });

  const permiitedBoards = [];
  let selector = {
    archived: false,
  };
  // if user is not an admin allow her to see cards only from boards where
  // she is a member
  if (!user.isAdmin) {
    selector.$or = [
      { permission: 'public' },
      { members: { $elemMatch: { userId: user._id, isActive: true } } },
    ];
  }
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
    Users.find({ _id: { $in: users } }),
  ];
});

Meteor.publish('globalSearch', function(queryParams) {
  check(queryParams, Object);

  // eslint-disable-next-line no-console
  console.log('queryParams:', queryParams);

  const user = Users.findOne(this.userId);

  // const archivedSwimlanes = Swimlanes.archivedSwimlaneIds();

  // const permiitedBoards = Boards.userBoardIds(user._id);

  let selector = {
    archived: false,
  };
  const searchLists = [];
  // eslint-disable-next-line no-console
  // console.log('listsSelector:', queryParams.keys());
  if ('listsSelector' in queryParams) {
    // eslint-disable-next-line no-console
    // console.log('listsSelector:', queryParams.listsSelector.keys());
    for (const key in queryParams.listsSelector) {
      selector[key] = queryParams.listsSelector[key];
    }

    // eslint-disable-next-line no-console
    console.log('search list selector:', selector);
    Lists.find(selector).forEach(list => {
      searchLists.push(list._id);
    });
    // eslint-disable-next-line no-console
    console.log('search lists:', searchLists);
  }

  const searchSwimlanes = [];
  if ('swimlanesSelector' in queryParams) {
    for (const key in queryParams.swimlanesSelector) {
      selector[key] = queryParams.swimlanesSelector[key];
    }

    Lists.find(selector).forEach(swim => {
      searchSwimlanes.push(swim._id);
    });
  }

  selector = {
    archived: false,
    boardId: { $in: Boards.userBoardIds(user._id) },
    swimlaneId: { $nin: Swimlanes.archivedSwimlaneIds() },
    listId: { $nin: Lists.archivedListIds() },
  };

  if (searchSwimlanes.length) {
    selector.swimlaneId.$in = searchSwimlanes;
  }

  if (searchLists.length) {
    selector.listId.$in = searchLists;
  }

  // eslint-disable-next-line no-console
  console.log('selector:', selector);
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
    Users.find({ _id: { $in: users } }),
  ];
});
