const trelloCreator = {
  // the object creation dates, indexed by Trello id (so we only parse actions once!)
  createdAt: {
    board: null,
    cards: {},
    lists: {},
  },

  // the labels we created, indexed by Trello id (to map when importing cards)
  labels: {},

  /**
   * must call parseActions before calling this one
   */
  createBoard(trelloBoard, dateOfImport) {
    const createdAt = this.createdAt.board;
    const boardToCreate = {
      archived: trelloBoard.closed,
      // XXX map from Trello colors
      color: Boards.simpleSchema()._schema.color.allowedValues[0],
      createdAt,
      labels: [],
      members: [{
        userId: Meteor.userId(),
        isAdmin: true,
        isActive: true,
      }],
      // XXX make a more robust mapping algorithm?
      permission: trelloBoard.prefs.permissionLevel,
      slug: getSlug(trelloBoard.name) || 'board',
      stars: 0,
      title: trelloBoard.name,
    };
    trelloBoard.labels.forEach((label) => {
      labelToCreate = {
        _id: Random.id(6),
        color: label.color,
        name: label.name,
      };
      // we need to remember them by Trello ID, as this is the only ref we have when importing cards
      this.labels[label.id] = labelToCreate;
      boardToCreate.labels.push(labelToCreate);
    });
    const boardId = Boards.direct.insert(boardToCreate);
    return boardId;
  },

  parseActions(trelloActions) {
    trelloActions.forEach((action) =>{
      switch (action.type) {
        case 'createBoard':
          this.createdAt.board = action.date;
          break;
        case 'createCard':
          const cardId = action.data.card.id;
          this.createdAt.cards[cardId] = action.date;
          break;
        case 'createList':
          const listId = action.data.list.id;
          this.createdAt.lists[listId] = action.date;
          break;
        default:
          // do nothing
          break;
      }
    });
  }
}

Meteor.methods({
  importTrelloCard(trelloCard, data) {
    // 1. check parameters are ok from a syntax point of view
    const DateString = Match.Where(function (dateAsString) {
      check(dateAsString, String);
      return moment(dateAsString, moment.ISO_8601).isValid();
    });
    try {
      check(trelloCard, Match.ObjectIncluding({
        name: String,
        desc: String,
        closed: Boolean,
        dateLastActivity: DateString,
        labels: [Match.ObjectIncluding({
          name: String,
          color: String,
        })],
        actions: [Match.ObjectIncluding({
          type: String,
          date: DateString,
          data: Object,
        })],
        members: [Object],
      }));
      check(data, {
        listId: String,
        sortIndex: Number,
      });
    } catch(e) {
      throw new Meteor.Error('error-json-schema');
    }

    // 2. check parameters are ok from a business point of view (exist & authorized)
    const list = Lists.findOne(data.listId);
    if(!list) {
      throw new Meteor.Error('error-list-doesNotExist');
    }
    if(Meteor.isServer) {
      if (!allowIsBoardMember(Meteor.userId(), Boards.findOne(list.boardId))) {
        throw new Meteor.Error('error-board-notAMember');
      }
    }

    // 3. map all fields for the card to create
    const dateOfImport = new Date();
    const cardToCreate = {
      archived: trelloCard.closed,
      boardId: list.boardId,
      // this is a default date, we'll fetch the actual one from the actions array
      createdAt: dateOfImport,
      dateLastActivity: dateOfImport,
      description: trelloCard.desc,
      listId: list._id,
      sort: data.sortIndex,
      title: trelloCard.name,
      // XXX use the original user?
      userId: Meteor.userId(),
    };

    // 4. find actual creation date
    const creationAction = trelloCard.actions.find((action) => {
      return action.type === 'createCard';
    });
    if(creationAction) {
      cardToCreate.createdAt = creationAction.date;
    }

    // 5. map labels - create missing ones
    trelloCard.labels.forEach((currentLabel) => {
      const color = currentLabel.color;
      const name = currentLabel.name;
      const existingLabel = list.board().getLabel(name, color);
      let labelId = undefined;
      if (existingLabel) {
        labelId = existingLabel._id;
      } else {
        let labelCreated = list.board().addLabel(name, color);
        // XXX currently mutations return no value so we have to fetch the label we just created
        // waiting on https://github.com/mquandalle/meteor-collection-mutations/issues/1 to remove...
        labelCreated = list.board().getLabel(name, color);
        labelId = labelCreated._id;
      }
      if(labelId) {
        if (!cardToCreate.labelIds) {
          cardToCreate.labelIds = [];
        }
        cardToCreate.labelIds.push(labelId);
      }
    });

    // 6. insert new card into list
    const cardId = Cards.direct.insert(cardToCreate);
    Activities.direct.insert({
      activityType: 'importCard',
      boardId: cardToCreate.boardId,
      cardId,
      createdAt: dateOfImport,
      listId: cardToCreate.listId,
      source: {
        id: trelloCard.id,
        system: 'Trello',
        url: trelloCard.url,
      },
      // we attribute the import to current user, not the one from the original card
      userId: Meteor.userId(),
    });

    // 7. parse actions and add comments
    trelloCard.actions.forEach((currentAction) => {
      if(currentAction.type === 'commentCard') {
        const commentToCreate = {
          boardId: list.boardId,
          cardId,
          createdAt: currentAction.date,
          text: currentAction.data.text,
          // XXX use the original comment user instead
          userId: Meteor.userId(),
        };
        const commentId = CardComments.direct.insert(commentToCreate);
        Activities.direct.insert({
          activityType: 'addComment',
          boardId: commentToCreate.boardId,
          cardId: commentToCreate.cardId,
          commentId,
          createdAt: commentToCreate.createdAt,
          userId: commentToCreate.userId,
        });
      }
    });
    return cardId;
  },
  importTrelloBoard(trelloBoard, data) {
    // 1. check parameters are ok from a syntax point of view
    try {
      // XXX do proper checking
      check(trelloBoard, Object);
      check(data, Object);
    } catch(e) {
      throw new Meteor.Error('error-json-schema');
    }
    // 2. check parameters are ok from a business point of view (exist & authorized)
    // XXX check we are allowed
    // 3. create all elements
    const dateOfImport = new Date();
    trelloCreator.parseActions(trelloBoard.actions);
    const boardId = trelloCreator.createBoard(trelloBoard, dateOfImport);
    return boardId;
  },
});
