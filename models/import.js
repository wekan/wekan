Meteor.methods({
  /**
   *
   */
  importTrelloCard(trelloCard, listId, sortIndex) {
    DateString = Match.Where(function (dateAsString) {
      check(dateAsString, String);
      //const date = new Date(dateAsString);
      //return (date.toString() !== 'Invalid Date') && !isNan(date);
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

    const list = Lists.findOne(listId);
    if(!list) {
      throw 'exception-list-doesNotExist';
    }

    // XXX check we are allowed to run method

    // 1. map all fields for the card to create
    const dateOfImport = new Date();
    // XXX parse trelloCard.actions to determine creation date
    const cardToCreate = {
      title: trelloCard.name,
      description: trelloCard.desc,
      listId: list._id,
      boardId: list.boardId,
      userId: Meteor.userId(),
      sort: sortIndex,
      archived: trelloCard.closed,
      // XXX dateOfImport
      createdAt: dateOfImport,
      dateLastActivity: dateOfImport,
    };
    // 2. map labels
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
    // 3. insert new card into list
    // XXX replace with direct MongoDB inserts
    const _id = Cards.direct.insert(cardToCreate);
    // XXX then add import activity
    // 4. parse actions and add comments
    trelloCard.actions.forEach((currentAction) => {
      if(currentAction.type === 'commentCard') {
        const commentToCreate = {
          boardId: list.boardId,
          cardId: _id,
          userId: Meteor.userId(),
          text: currentAction.data.text,
          createdAt: currentAction.date,
        };
        // console.log(commentToCreate);
        CardComments.direct.insert(commentToCreate);
      }
      // XXX add other type of activities?
      // XXX look for createCard to set create date > no do it BEFORE saving
    });
    return _id;
  },
});
