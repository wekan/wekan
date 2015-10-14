Meteor.methods({
  /**
   *
   */
  importTrelloCard(trelloCard, listId, sortIndex) {
    // 1. check parameters are ok from a syntax point of view
    DateString = Match.Where(function (dateAsString) {
      check(dateAsString, String);
      return moment(dateAsString, moment.ISO_8601).isValid();
    });
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
    check(listId, String);
    check(sortIndex, Number);

    // 2. check parameters are ok from a business point of view (exist & authorized)
    const list = Lists.findOne(listId);
    if(!list) {
      throw 'exception-list-doesNotExist';
    }
    if(Meteor.isServer) {
      if (!allowIsBoardMember(Meteor.userId(), Boards.findOne(list.boardId))) {
        throw 'exception-board-notAMember';
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
      sort: sortIndex,
      title: trelloCard.name,
      // XXX use the original user?
      userId: Meteor.userId(),
    };

    // 4. find actual creation date
    const creationAction = trelloCard.actions.find((action) => {return action.type === 'createCard';});
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
      cardId: cardId,
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
          cardId: cardId,
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
          commentId: commentId,
          createdAt: commentToCreate.createdAt,
          userId: commentToCreate.userId,
        });
      }
    });
    return cardId;
  },
});
