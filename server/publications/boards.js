// This is the publication used to display the board list. We publish all the
// non-archived boards:
// 1. that the user is a member of
// 2. the user has starred
Meteor.publish('boards', function() {
  const userId = this.userId;
  // Ensure that the user is connected. If it is not, we need to return an empty
  // array to tell the client to remove the previously published docs.
  if (!Match.test(userId, String) || !userId) return [];

  // Defensive programming to verify that starredBoards has the expected
  // format -- since the field is in the `profile` a user can modify it.
  const { starredBoards = [] } = (Users.findOne(userId) || {}).profile || {};
  check(starredBoards, [String]);

  return Boards.find(
    {
      archived: false,
      $or: [
        {
          // _id: { $in: starredBoards },  // Commented out, to get a list of all public boards
          permission: 'public',
        },
        { members: { $elemMatch: { userId, isActive: true } } },
      ],
    },
    {
      fields: {
        _id: 1,
        boardId: 1,
        archived: 1,
        slug: 1,
        title: 1,
        description: 1,
        color: 1,
        members: 1,
        permission: 1,
        type: 1,
        sort: 1,
      },
      sort: { sort: 1 /* boards default sorting */ },
    },
  );
});

Meteor.publish('archivedBoards', function() {
  const userId = this.userId;
  if (!Match.test(userId, String)) return [];

  return Boards.find(
    {
      archived: true,
      members: {
        $elemMatch: {
          userId,
          isAdmin: true,
        },
      },
    },
    {
      fields: {
        _id: 1,
        archived: 1,
        slug: 1,
        title: 1,
        createdAt: 1,
        modifiedAt: 1,
        archivedAt: 1,
      },
      sort: { archivedAt: -1, modifiedAt: -1 },
    },
  );
});

// If isArchived = false, this will only return board elements which are not archived.
// If isArchived = true, this will only return board elements which are archived.
Meteor.publishRelations('board', function(boardId, isArchived) {
  this.unblock();
  check(boardId, String);
  check(isArchived, Boolean);
  const thisUserId = this.userId;
  const $or = [{ permission: 'public' }];

  if (thisUserId) {
    $or.push({
      members: { $elemMatch: { userId: thisUserId, isActive: true } },
    });
  }

  this.cursor(
    Boards.find(
      {
        _id: boardId,
        archived: false,
        // If the board is not public the user has to be a member of it to see
        // it.
        $or,
        // Sort required to ensure oplog usage
      },
      { limit: 1, sort: { sort: 1 /* boards default sorting */ } },
    ),
    function(boardId, board) {
      this.cursor(Lists.find({ boardId, archived: isArchived }));
      this.cursor(Swimlanes.find({ boardId, archived: isArchived }));
      this.cursor(Integrations.find({ boardId }));
      this.cursor(
        CustomFields.find(
          { boardIds: { $in: [boardId] } },
          { sort: { name: 1 } },
        ),
      );

      // Cards and cards comments
      // XXX Originally we were publishing the card documents as a child of the
      // list publication defined above using the following selector `{ listId:
      // list._id }`. But it was causing a race condition in publish-composite,
      // that I documented here:
      //
      //   https://github.com/englue/meteor-publish-composite/issues/29
      //
      // cottz:publish had a similar problem:
      //
      //   https://github.com/Goluis/cottz-publish/issues/4
      //
      // The current state of relational publishing in meteor is a bit sad,
      // there are a lot of various packages, with various APIs, some of them
      // are unmaintained. Fortunately this is something that will be fixed by
      // meteor-core at some point:
      //
      //   https://trello.com/c/BGvIwkEa/48-easy-joins-in-subscriptions
      //
      // And in the meantime our code below works pretty well -- it's not even a
      // hack!

      // Gather queries and send in bulk
      const cardComments = this.join(CardComments);
      cardComments.selector = _ids => ({ cardId: _ids });
      const attachments = this.join(Attachments);
      attachments.selector = _ids => ({ cardId: _ids });
      const checklists = this.join(Checklists);
      checklists.selector = _ids => ({ cardId: _ids });
      const checklistItems = this.join(ChecklistItems);
      checklistItems.selector = _ids => ({ cardId: _ids });
      const parentCards = this.join(Cards);
      parentCards.selector = _ids => ({ parentId: _ids });
      const boards = this.join(Boards);
      const subCards = this.join(Cards);
      subCards.selector = _ids => ({ _id: _ids, archived: isArchived });

      this.cursor(
        Cards.find({
          boardId: { $in: [boardId, board.subtasksDefaultBoardId] },
          archived: isArchived,
        }),
        function(cardId, card) {
          if (card.type === 'cardType-linkedCard') {
            const impCardId = card.linkedId;
            subCards.push(impCardId); // GitHub issue #2688 and #2693
            cardComments.push(impCardId);
            attachments.push(impCardId);
            checklists.push(impCardId);
            checklistItems.push(impCardId);
          } else if (card.type === 'cardType-linkedBoard') {
            boards.push(card.linkedId);
          }
          cardComments.push(cardId);
          attachments.push(cardId);
          checklists.push(cardId);
          checklistItems.push(cardId);
          parentCards.push(cardId);
        },
      );

      // Send bulk queries for all found ids
      subCards.send();
      cardComments.send();
      attachments.send();
      checklists.send();
      checklistItems.send();
      boards.send();
      parentCards.send();

      if (board.members) {
        // Board members. This publication also includes former board members that
        // aren't members anymore but may have some activities attached to them in
        // the history.
        const memberIds = _.pluck(board.members, 'userId');

        // We omit the current user because the client should already have that data,
        // and sending it triggers a subtle bug:
        // https://github.com/wefork/wekan/issues/15
        this.cursor(
          Users.find(
            {
              _id: { $in: _.without(memberIds, thisUserId) },
            },
            {
              fields: {
                username: 1,
                'profile.fullname': 1,
                'profile.avatarUrl': 1,
                'profile.initials': 1,
              },
            },
          ),
        );

        this.cursor(presences.find({ userId: { $in: memberIds } }));
      }
    },
  );

  return this.ready();
});

Meteor.methods({
  copyBoard(boardId, properties) {
    check(boardId, String);
    check(properties, Object);

    const board = Boards.findOne(boardId);
    if (board) {
      for (const key in properties) {
        board[key] = properties[key];
      }
      return board.copy();
    }
    return null;
  },
});
