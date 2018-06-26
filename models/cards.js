Cards = new Mongo.Collection('cards');

// XXX To improve pub/sub performances a card document should include a
// de-normalized number of comments so we don't have to publish the whole list
// of comments just to display the number of them in the board view.
Cards.attachSchema(new SimpleSchema({
  title: {
    type: String,
  },
  archived: {
    type: Boolean,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  parentId: {
    type: String,
    optional: true,
    defaultValue: '',
  },
  listId: {
    type: String,
  },
  swimlaneId: {
    type: String,
  },
  // The system could work without this `boardId` information (we could deduce
  // the board identifier from the card), but it would make the system more
  // difficult to manage and less efficient.
  boardId: {
    type: String,
  },
  coverId: {
    type: String,
    optional: true,
  },
  createdAt: {
    type: Date,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert) {
        return new Date();
      } else {
        this.unset();
      }
    },
  },
  customFields: {
    type: [Object],
    optional: true,
  },
  'customFields.$': {
    type: new SimpleSchema({
      _id: {
        type: String,
      },
      value: {
        type: Match.OneOf(String, Number, Boolean, Date),
        optional: true,
      },
    }),
  },
  dateLastActivity: {
    type: Date,
    autoValue() {
      return new Date();
    },
  },
  description: {
    type: String,
    optional: true,
  },
  requestedBy: {
    type: String,
    optional: true,
  },
  assignedBy: {
    type: String,
    optional: true,
  },
  labelIds: {
    type: [String],
    optional: true,
  },
  members: {
    type: [String],
    optional: true,
  },
  receivedAt: {
    type: Date,
    optional: true,
  },
  startAt: {
    type: Date,
    optional: true,
  },
  dueAt: {
    type: Date,
    optional: true,
  },
  endAt: {
    type: Date,
    optional: true,
  },
  spentTime: {
    type: Number,
    decimal: true,
    optional: true,
  },
  isOvertime: {
    type: Boolean,
    defaultValue: false,
    optional: true,
  },
  // XXX Should probably be called `authorId`. Is it even needed since we have
  // the `members` field?
  userId: {
    type: String,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return this.userId;
      }
    },
  },
  sort: {
    type: Number,
    decimal: true,
  },
  subtaskSort: {
    type: Number,
    decimal: true,
    defaultValue: -1,
    optional: true,
  },
}));

Cards.allow({
  insert(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['boardId'],
});

Cards.helpers({
  list() {
    return Lists.findOne(this.listId);
  },

  board() {
    return Boards.findOne(this.boardId);
  },

  labels() {
    const boardLabels = this.board().labels;
    const cardLabels = _.filter(boardLabels, (label) => {
      return _.contains(this.labelIds, label._id);
    });
    return cardLabels;
  },

  hasLabel(labelId) {
    return _.contains(this.labelIds, labelId);
  },

  user() {
    return Users.findOne(this.userId);
  },

  isAssigned(memberId) {
    return _.contains(this.members, memberId);
  },

  activities() {
    return Activities.find({cardId: this._id}, {sort: {createdAt: -1}});
  },

  comments() {
    return CardComments.find({cardId: this._id}, {sort: {createdAt: -1}});
  },

  attachments() {
    return Attachments.find({cardId: this._id}, {sort: {uploadedAt: -1}});
  },

  cover() {
    const cover = Attachments.findOne(this.coverId);
    // if we return a cover before it is fully stored, we will get errors when we try to display it
    // todo XXX we could return a default "upload pending" image in the meantime?
    return cover && cover.url() && cover;
  },

  checklists() {
    return Checklists.find({cardId: this._id}, {sort: { sort: 1 } });
  },

  checklistItemCount() {
    const checklists = this.checklists().fetch();
    return checklists.map((checklist) => {
      return checklist.itemCount();
    }).reduce((prev, next) => {
      return prev + next;
    }, 0);
  },

  checklistFinishedCount() {
    const checklists = this.checklists().fetch();
    return checklists.map((checklist) => {
      return checklist.finishedCount();
    }).reduce((prev, next) => {
      return prev + next;
    }, 0);
  },

  checklistFinished() {
    return this.hasChecklist() && this.checklistItemCount() === this.checklistFinishedCount();
  },

  hasChecklist() {
    return this.checklistItemCount() !== 0;
  },

  subtasks() {
    return Cards.find({
      parentId: this._id,
      archived: false,
    }, {sort: { sort: 1 } });
  },

  allSubtasks() {
    return Cards.find({
      parentId: this._id,
      archived: false,
    }, {sort: { sort: 1 } });
  },

  subtasksCount() {
    return Cards.find({
      parentId: this._id,
      archived: false,
    }).count();
  },

  subtasksFinishedCount() {
    return Cards.find({
      parentId: this._id,
      archived: true}).count();
  },

  subtasksFinished() {
    const finishCount = this.subtasksFinishedCount();
    return finishCount > 0 && this.subtasksCount() === finishCount;
  },

  allowsSubtasks() {
    return this.subtasksCount() !== 0;
  },

  customFieldIndex(customFieldId) {
    return _.pluck(this.customFields, '_id').indexOf(customFieldId);
  },

  // customFields with definitions
  customFieldsWD() {

    // get all definitions
    const definitions = CustomFields.find({
      boardId: this.boardId,
    }).fetch();

    // match right definition to each field
    if (!this.customFields) return [];
    return this.customFields.map((customField) => {
      const definition = definitions.find((definition) => {
        return definition._id === customField._id;
      });
      //search for "True Value" which is for DropDowns other then the Value (which is the id)
      let trueValue = customField.value;
      if (definition.settings.dropdownItems && definition.settings.dropdownItems.length > 0)
      {
        for (let i = 0; i < definition.settings.dropdownItems.length; i++)
        {
          if (definition.settings.dropdownItems[i]._id === customField.value)
          {
            trueValue = definition.settings.dropdownItems[i].name;
          }
        }
      }
      return {
        _id: customField._id,
        value: customField.value,
        trueValue,
        definition,
      };
    });

  },

  absoluteUrl() {
    const board = this.board();
    return FlowRouter.url('card', {
      boardId: board._id,
      slug: board.slug,
      cardId: this._id,
    });
  },

  canBeRestored() {
    const list = Lists.findOne({_id: this.listId});
    if(!list.getWipLimit('soft') && list.getWipLimit('enabled') && list.getWipLimit('value') === list.cards().count()){
      return false;
    }
    return true;
  },

  parentCard() {
    if (this.parentId === '') {
      return null;
    }
    return Cards.findOne(this.parentId);
  },

  parentCardName() {
    let result = '';
    if (this.parentId !== '') {
      const card = Cards.findOne(this.parentId);
      if (card) {
        result = card.title;
      }
    }
    return result;
  },

  parentListId() {
    const result = [];
    let crtParentId = this.parentId;
    while (crtParentId !== '') {
      const crt = Cards.findOne(crtParentId);
      if ((crt === null) || (crt === undefined)) {
        // maybe it has been deleted
        break;
      }
      if (crtParentId in result) {
        // circular reference
        break;
      }
      result.unshift(crtParentId);
      crtParentId = crt.parentId;
    }
    return result;
  },

  parentList() {
    const resultId = [];
    const result = [];
    let crtParentId = this.parentId;
    while (crtParentId !== '') {
      const crt = Cards.findOne(crtParentId);
      if ((crt === null) || (crt === undefined)) {
        // maybe it has been deleted
        break;
      }
      if (crtParentId in resultId) {
        // circular reference
        break;
      }
      resultId.unshift(crtParentId);
      result.unshift(crt);
      crtParentId = crt.parentId;
    }
    return result;
  },

  parentString(sep) {
    return this.parentList().map(function(elem){
      return elem.title;
    }).join(sep);
  },

  isTopLevel() {
    return this.parentId === '';
  },
});

Cards.mutations({
  applyToChildren(funct) {
    Cards.find({ parentId: this._id }).forEach((card) => {
      funct(card);
    });
  },

  archive() {
    this.applyToChildren((card) => { return card.archive(); });
    return {$set: {archived: true}};
  },

  restore() {
    this.applyToChildren((card) => { return card.restore(); });
    return {$set: {archived: false}};
  },

  setTitle(title) {
    return {$set: {title}};
  },

  setDescription(description) {
    return {$set: {description}};
  },

  setRequestedBy(requestedBy) {
    return {$set: {requestedBy}};
  },

  setAssignedBy(assignedBy) {
    return {$set: {assignedBy}};
  },

  move(swimlaneId, listId, sortIndex) {
    const list = Lists.findOne(listId);
    const mutatedFields = {
      swimlaneId,
      listId,
      boardId: list.boardId,
      sort: sortIndex,
    };

    return {$set: mutatedFields};
  },

  addLabel(labelId) {
    return {$addToSet: {labelIds: labelId}};
  },

  removeLabel(labelId) {
    return {$pull: {labelIds: labelId}};
  },

  toggleLabel(labelId) {
    if (this.labelIds && this.labelIds.indexOf(labelId) > -1) {
      return this.removeLabel(labelId);
    } else {
      return this.addLabel(labelId);
    }
  },

  assignMember(memberId) {
    return {$addToSet: {members: memberId}};
  },

  unassignMember(memberId) {
    return {$pull: {members: memberId}};
  },

  toggleMember(memberId) {
    if (this.members && this.members.indexOf(memberId) > -1) {
      return this.unassignMember(memberId);
    } else {
      return this.assignMember(memberId);
    }
  },

  assignCustomField(customFieldId) {
    return {$addToSet: {customFields: {_id: customFieldId, value: null}}};
  },

  unassignCustomField(customFieldId) {
    return {$pull: {customFields: {_id: customFieldId}}};
  },

  toggleCustomField(customFieldId) {
    if (this.customFields && this.customFieldIndex(customFieldId) > -1) {
      return this.unassignCustomField(customFieldId);
    } else {
      return this.assignCustomField(customFieldId);
    }
  },

  setCustomField(customFieldId, value) {
    // todo
    const index = this.customFieldIndex(customFieldId);
    if (index > -1) {
      const update = {$set: {}};
      update.$set[`customFields.${index}.value`] = value;
      return update;
    }
    // TODO
    // Ignatz 18.05.2018: Return null to silence ESLint. No Idea if that is correct
    return null;
  },

  setCover(coverId) {
    return {$set: {coverId}};
  },

  unsetCover() {
    return {$unset: {coverId: ''}};
  },

  setReceived(receivedAt) {
    return {$set: {receivedAt}};
  },

  unsetReceived() {
    return {$unset: {receivedAt: ''}};
  },

  setStart(startAt) {
    return {$set: {startAt}};
  },

  unsetStart() {
    return {$unset: {startAt: ''}};
  },

  setDue(dueAt) {
    return {$set: {dueAt}};
  },

  unsetDue() {
    return {$unset: {dueAt: ''}};
  },

  setEnd(endAt) {
    return {$set: {endAt}};
  },

  unsetEnd() {
    return {$unset: {endAt: ''}};
  },

  setOvertime(isOvertime) {
    return {$set: {isOvertime}};
  },

  setSpentTime(spentTime) {
    return {$set: {spentTime}};
  },

  unsetSpentTime() {
    return {$unset: {spentTime: '', isOvertime: false}};
  },

  setParentId(parentId) {
    return {$set: {parentId}};
  },

});


//FUNCTIONS FOR creation of Activities

function cardMove(userId, doc, fieldNames, oldListId) {
  if (_.contains(fieldNames, 'listId') && doc.listId !== oldListId) {
    Activities.insert({
      userId,
      oldListId,
      activityType: 'moveCard',
      listId: doc.listId,
      boardId: doc.boardId,
      cardId: doc._id,
    });
  }
}

function cardState(userId, doc, fieldNames) {
  if (_.contains(fieldNames, 'archived')) {
    if (doc.archived) {
      Activities.insert({
        userId,
        activityType: 'archivedCard',
        boardId: doc.boardId,
        listId: doc.listId,
        cardId: doc._id,
      });
    } else {
      Activities.insert({
        userId,
        activityType: 'restoredCard',
        boardId: doc.boardId,
        listId: doc.listId,
        cardId: doc._id,
      });
    }
  }
}

function cardMembers(userId, doc, fieldNames, modifier) {
  if (!_.contains(fieldNames, 'members'))
    return;
  let memberId;
  // Say hello to the new member
  if (modifier.$addToSet && modifier.$addToSet.members) {
    memberId = modifier.$addToSet.members;
    if (!_.contains(doc.members, memberId)) {
      Activities.insert({
        userId,
        memberId,
        activityType: 'joinMember',
        boardId: doc.boardId,
        cardId: doc._id,
      });
    }
  }

  // Say goodbye to the former member
  if (modifier.$pull && modifier.$pull.members) {
    memberId = modifier.$pull.members;
    // Check that the former member is member of the card
    if (_.contains(doc.members, memberId)) {
      Activities.insert({
        userId,
        memberId,
        activityType: 'unjoinMember',
        boardId: doc.boardId,
        cardId: doc._id,
      });
    }
  }
}

function cardCreation(userId, doc) {
  Activities.insert({
    userId,
    activityType: 'createCard',
    boardId: doc.boardId,
    listId: doc.listId,
    cardId: doc._id,
  });
}

function cardRemover(userId, doc) {
  Activities.remove({
    cardId: doc._id,
  });
  Checklists.remove({
    cardId: doc._id,
  });
  Subtasks.remove({
    cardId: doc._id,
  });
  CardComments.remove({
    cardId: doc._id,
  });
  Attachments.remove({
    cardId: doc._id,
  });
}


if (Meteor.isServer) {
  // Cards are often fetched within a board, so we create an index to make these
  // queries more efficient.
  Meteor.startup(() => {
    Cards._collection._ensureIndex({boardId: 1, createdAt: -1});
  });

  Cards.after.insert((userId, doc) => {
    cardCreation(userId, doc);
  });

  // New activity for card (un)archivage
  Cards.after.update((userId, doc, fieldNames) => {
    cardState(userId, doc, fieldNames);
  });

  //New activity for card moves
  Cards.after.update(function (userId, doc, fieldNames) {
    const oldListId = this.previous.listId;
    cardMove(userId, doc, fieldNames, oldListId);
  });

  // Add a new activity if we add or remove a member to the card
  Cards.before.update((userId, doc, fieldNames, modifier) => {
    cardMembers(userId, doc, fieldNames, modifier);
  });

  // Remove all activities associated with a card if we remove the card
  // Remove also card_comments / checklists / attachments
  Cards.after.remove((userId, doc) => {
    cardRemover(userId, doc);
  });
}
//LISTS REST API
if (Meteor.isServer) {
  JsonRoutes.add('GET', '/api/boards/:boardId/lists/:listId/cards', function (req, res) {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
    JsonRoutes.sendResult(res, {
      code: 200,
      data: Cards.find({boardId: paramBoardId, listId: paramListId, archived: false}).map(function (doc) {
        return {
          _id: doc._id,
          title: doc.title,
          description: doc.description,
        };
      }),
    });
  });

  JsonRoutes.add('GET', '/api/boards/:boardId/lists/:listId/cards/:cardId', function (req, res) {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    const paramCardId = req.params.cardId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
    JsonRoutes.sendResult(res, {
      code: 200,
      data: Cards.findOne({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false}),
    });
  });

  JsonRoutes.add('POST', '/api/boards/:boardId/lists/:listId/cards', function (req, res) {
    Authentication.checkUserId(req.userId);
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    const check = Users.findOne({_id: req.body.authorId});
    const members = req.body.members || [req.body.authorId];
    if (typeof  check !== 'undefined') {
      const id = Cards.direct.insert({
        title: req.body.title,
        boardId: paramBoardId,
        listId: paramListId,
        description: req.body.description,
        userId: req.body.authorId,
        swimlaneId: req.body.swimlaneId,
        sort: 0,
        members,
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });

      const card = Cards.findOne({_id:id});
      cardCreation(req.body.authorId, card);

    } else {
      JsonRoutes.sendResult(res, {
        code: 401,
      });
    }
  });

  JsonRoutes.add('PUT', '/api/boards/:boardId/lists/:listId/cards/:cardId', function (req, res) {
    Authentication.checkUserId(req.userId);
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    const paramListId = req.params.listId;

    if (req.body.hasOwnProperty('title')) {
      const newTitle = req.body.title;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {title: newTitle}});
    }
    if (req.body.hasOwnProperty('listId')) {
      const newParamListId = req.body.listId;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {listId: newParamListId}});

      const card = Cards.findOne({_id: paramCardId} );
      cardMove(req.body.authorId, card, {fieldName: 'listId'}, paramListId);

    }
    if (req.body.hasOwnProperty('description')) {
      const newDescription = req.body.description;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {description: newDescription}});
    }
    if (req.body.hasOwnProperty('labelIds')) {
      const newlabelIds = req.body.labelIds;
      Cards.direct.update({_id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false},
        {$set: {labelIds: newlabelIds}});
    }
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramCardId,
      },
    });
  });


  JsonRoutes.add('DELETE', '/api/boards/:boardId/lists/:listId/cards/:cardId', function (req, res) {
    Authentication.checkUserId(req.userId);
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    const paramCardId = req.params.cardId;

    Cards.direct.remove({_id: paramCardId, listId: paramListId, boardId: paramBoardId});
    const card = Cards.find({_id: paramCardId} );
    cardRemover(req.body.authorId, card);
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramCardId,
      },
    });

  });
}
