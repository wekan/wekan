class TrelloCreator {
  constructor() {
    // the object creation dates, indexed by Trello id (so we only parse actions once!)
    this.createdAt = {
      board: null,
      cards: {},
      lists: {},
    };
    // the labels we created, indexed by Trello id (to map when importing cards)
    this.labels = {};
    // the lists we created, indexed by Trello id (to map when importing cards)
    this.lists = {};
    // the comments, indexed by Trello card id (to map when importing cards)
    this.comments = {};
  }

  /**
   * must call parseActions before calling this one
   */
  createBoardAndLabels(trelloBoard) {
    const createdAt = this.createdAt.board;
    const boardToCreate = {
      archived: trelloBoard.closed,
      color: this.getColor(trelloBoard.prefs.background),
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
      const labelToCreate = {
        _id: Random.id(6),
        color: label.color,
        name: label.name,
      };
      // we need to remember them by Trello ID, as this is the only ref we have when importing cards
      this.labels[label.id] = labelToCreate;
      boardToCreate.labels.push(labelToCreate);
    });
    const now = new Date();
    const boardId = Boards.direct.insert(boardToCreate);
    Boards.direct.update(boardId, {$set: {modifiedAt: now}});
    // log activity
    Activities.direct.insert({
      activityType: 'importBoard',
      boardId,
      createdAt: now,
      source: {
        id: trelloBoard.id,
        system: 'Trello',
        url: trelloBoard.url,
      },
      // we attribute the import to current user, not the one from the original object
      userId: Meteor.userId(),
    });
    return boardId;
  }

  createLists(trelloLists, boardId) {
    trelloLists.forEach((list) => {
      const listToCreate = {
        archived: list.closed,
        boardId,
        createdAt: this.createdAt.lists[list.id],
        title: list.name,
        userId: Meteor.userId(),
      };
      const listId = Lists.direct.insert(listToCreate);
      const now = new Date();
      Lists.direct.update(listId, {$set: {'updatedAt': now}});
      listToCreate._id = listId;
      this.lists[list.id] = listToCreate;
      // log activity
      Activities.direct.insert({
        activityType: 'importList',
        boardId,
        createdAt: now,
        listId,
        source: {
          id: list.id,
          system: 'Trello',
        },
        // we attribute the import to current user, not the one from the original object
        userId: Meteor.userId(),
      });
    });
  }

  createCardsAndComments(trelloCards, boardId) {
    trelloCards.forEach((card) => {
      const cardToCreate = {
        archived: card.closed,
        boardId,
        createdAt: this.createdAt.cards[card.id],
        dateLastActivity: new Date(),
        description: card.desc,
        listId: this.lists[card.idList]._id,
        sort: card.pos,
        title: card.name,
        // XXX use the original user?
        userId: Meteor.userId(),
      };
      // add labels
      if(card.idLabels) {
        cardToCreate.labelIds = card.idLabels.map((trelloId) => {
          return this.labels[trelloId]._id;
        });
      }
      // insert card
      const cardId = Cards.direct.insert(cardToCreate);
      // log activity
      Activities.direct.insert({
        activityType: 'importCard',
        boardId,
        cardId,
        createdAt: new Date(),
        listId: cardToCreate.listId,
        source: {
          id: card.id,
          system: 'Trello',
          url: card.url,
        },
        // we attribute the import to current user, not the one from the original card
        userId: Meteor.userId(),
      });
      // add comments
      const comments = this.comments[card.id];
      if(comments) {
        comments.forEach((comment) => {
          const commentToCreate = {
            boardId,
            cardId,
            createdAt: comment.date,
            text: comment.data.text,
            // XXX use the original comment user instead
            userId: Meteor.userId(),
          };
          // dateLastActivity will be set from activity insert, no need to update it ourselves
          const commentId = CardComments.direct.insert(commentToCreate);
          Activities.direct.insert({
            activityType: 'addComment',
            boardId: commentToCreate.boardId,
            cardId: commentToCreate.cardId,
            commentId,
            createdAt: commentToCreate.createdAt,
            userId: commentToCreate.userId,
          });
        });
      }
      // XXX add attachments
    });
  }

  getColor(trelloColorCode) {
    // trello color name => wekan color
    const mapColors = {
      'blue': 'belize',
      'orange': 'pumpkin',
      'green': 'nephritis',
      'red': 'pomegranate',
      'purple': 'wisteria',
      'pink': 'pomegranate',
      'lime': 'nephritis',
      'sky': 'belize',
      'grey': 'midnight',
    };
    const wekanColor = mapColors[trelloColorCode];
    return wekanColor || Boards.simpleSchema()._schema.color.allowedValues[0];
  }

  parseActions(trelloActions) {
    trelloActions.forEach((action) => {
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
      case 'commentCard':
        const id = action.data.card.id;
        if(this.comments[id]) {
          this.comments[id].push(action);
        } else {
          this.comments[id] = [action];
        }
        break;
      default:
        // do nothing
        break;
      }
    });
  }
}

Meteor.methods({
  importTrelloBoard(trelloBoard, data) {
    const trelloCreator = new TrelloCreator();
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
    trelloCreator.parseActions(trelloBoard.actions);
    const boardId = trelloCreator.createBoardAndLabels(trelloBoard);
    trelloCreator.createLists(trelloBoard.lists, boardId);
    trelloCreator.createCardsAndComments(trelloBoard.cards, boardId);
    // XXX add members
    return boardId;
  },
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
});
