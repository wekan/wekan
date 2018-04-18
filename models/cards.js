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
  type: {
    type: String,
  },
  importedId: {
    type: String,
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
    return _.contains(this.getMembers(), memberId);
  },

  activities() {
    if (this.isImportedCard()) {
      return Activities.find({cardId: this.importedId}, {sort: {createdAt: -1}});
    } else if (this.isImportedBoard()) {
      return Activities.find({boardId: this.importedId}, {sort: {createdAt: -1}});
    } else {
      return Activities.find({cardId: this._id}, {sort: {createdAt: -1}});
    }
  },

  comments() {
    if (this.isImportedCard()) {
      return CardComments.find({cardId: this.importedId}, {sort: {createdAt: -1}});
    } else {
      return CardComments.find({cardId: this._id}, {sort: {createdAt: -1}});
    }
  },

  attachments() {
    if (this.isImportedCard()) {
      return Attachments.find({cardId: this.importedId}, {sort: {uploadedAt: -1}});
    } else {
      return Attachments.find({cardId: this._id}, {sort: {uploadedAt: -1}});
    }
  },

  cover() {
    const cover = Attachments.findOne(this.coverId);
    // if we return a cover before it is fully stored, we will get errors when we try to display it
    // todo XXX we could return a default "upload pending" image in the meantime?
    return cover && cover.url() && cover;
  },

  checklists() {
    if (this.isImportedCard()) {
      return Checklists.find({cardId: this.importedId}, {sort: { sort: 1 } });
    } else {
      return Checklists.find({cardId: this._id}, {sort: { sort: 1 } });
    }
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

  isImportedCard() {
    return this.type === 'cardType-importedCard';
  },

  isImportedBoard() {
    return this.type === 'cardType-importedBoard';
  },

  isImported() {
    return this.isImportedCard() || this.isImportedBoard();
  },

  setDescription(description) {
    if (this.isImportedCard()) {
      return Cards.update({_id: this.importedId}, {$set: {description}});
    } else if (this.isImportedBoard()) {
      return Boards.update({_id: this.importedId}, {$set: {description}});
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {description}}
      );
    }
  },

  getDescription() {
    if (this.isImportedCard()) {
      const card = Cards.findOne({_id: this.importedId});
      if (card && card.description)
        return card.description;
      else
        return null;
    } else if (this.isImportedBoard()) {
      const board = Boards.findOne({_id: this.importedId});
      if (board && board.description)
        return board.description;
      else
        return null;
    } else if (this.description) {
      return this.description;
    } else {
      return null;
    }
  },

  getMembers() {
    if (this.isImportedCard()) {
      const card = Cards.findOne({_id: this.importedId});
      return card.members;
    } else if (this.isImportedBoard()) {
      const board = Boards.findOne({_id: this.importedId});
      return board.activeMembers().map((member) => {
        return member.userId;
      });
    } else {
      return this.members;
    }
  },

  assignMember(memberId) {
    if (this.isImportedCard()) {
      return Cards.update(
        { _id: this.importedId },
        { $addToSet: { members: memberId }}
      );
    } else if (this.isImportedBoard()) {
      const board = Boards.findOne({_id: this.importedId});
      return board.addMember(memberId);
    } else {
      return Cards.update(
        { _id: this._id },
        { $addToSet: { members: memberId}}
      );
    }
  },

  unassignMember(memberId) {
    if (this.isImportedCard()) {
      return Cards.update(
        { _id: this.importedId },
        { $pull: { members: memberId }}
      );
    } else if (this.isImportedBoard()) {
      const board = Boards.findOne({_id: this.importedId});
      return board.removeMember(memberId);
    } else {
      return Cards.update(
        { _id: this._id },
        { $pull: { members: memberId}}
      );
    }
  },

  toggleMember(memberId) {
    if (this.getMembers() && this.getMembers().indexOf(memberId) > -1) {
      return this.unassignMember(memberId);
    } else {
      return this.assignMember(memberId);
    }
  },

  getReceived() {
    if (this.isImportedCard()) {
      const card = Cards.findOne({_id: this.importedId});
      return card.receivedAt;
    } else {
      return this.receivedAt;
    }
  },

  setReceived(receivedAt) {
    if (this.isImportedCard()) {
      return Cards.update(
        {_id: this.importedId},
        {$set: {receivedAt}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {receivedAt}}
      );
    }
  },

  getStart() {
    if (this.isImportedCard()) {
      const card = Cards.findOne({_id: this.importedId});
      return card.startAt;
    } else if (this.isImportedBoard()) {
      const board = Boards.findOne({_id: this.importedId});
      return board.startAt;
    } else {
      return this.startAt;
    }
  },

  setStart(startAt) {
    if (this.isImportedCard()) {
      return Cards.update(
        { _id: this.importedId },
        {$set: {startAt}}
      );
    } else if (this.isImportedBoard()) {
      return Boards.update(
        {_id: this.importedId},
        {$set: {startAt}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {startAt}}
      );
    }
  },

  getDue() {
    if (this.isImportedCard()) {
      const card = Cards.findOne({_id: this.importedId});
      return card.dueAt;
    } else if (this.isImportedBoard()) {
      const board = Boards.findOne({_id: this.importedId});
      return board.dueAt;
    } else {
      return this.dueAt;
    }
  },

  setDue(dueAt) {
    if (this.isImportedCard()) {
      return Cards.update(
        { _id: this.importedId },
        {$set: {dueAt}}
      );
    } else if (this.isImportedBoard()) {
      return Boards.update(
        {_id: this.importedId},
        {$set: {dueAt}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {dueAt}}
      );
    }
  },

  getEnd() {
    if (this.isImportedCard()) {
      const card = Cards.findOne({_id: this.importedId});
      return card.endAt;
    } else if (this.isImportedBoard()) {
      const board = Boards.findOne({_id: this.importedId});
      return board.endAt;
    } else {
      return this.endAt;
    }
  },

  setEnd(endAt) {
    if (this.isImportedCard()) {
      return Cards.update(
        { _id: this.importedId },
        {$set: {endAt}}
      );
    } else if (this.isImportedBoard()) {
      return Boards.update(
        {_id: this.importedId},
        {$set: {endAt}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {endAt}}
      );
    }
  },

  getIsOvertime() {
    if (this.isImportedCard()) {
      const card = Cards.findOne({ _id: this.importedId });
      return card.isOvertime;
    } else if (this.isImportedBoard()) {
      const board = Boards.findOne({ _id: this.importedId});
      return board.isOvertime;
    } else {
      return this.isOvertime;
    }
  },

  setIsOvertime(isOvertime) {
    if (this.isImportedCard()) {
      return Cards.update(
        { _id: this.importedId },
        {$set: {isOvertime}}
      );
    } else if (this.isImportedBoard()) {
      return Boards.update(
        {_id: this.importedId},
        {$set: {isOvertime}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {isOvertime}}
      );
    }
  },

  getSpentTime() {
    if (this.isImportedCard()) {
      const card = Cards.findOne({ _id: this.importedId });
      return card.spentTime;
    } else if (this.isImportedBoard()) {
      const board = Boards.findOne({ _id: this.importedId});
      return board.spentTime;
    } else {
      return this.spentTime;
    }
  },

  setSpentTime(spentTime) {
    if (this.isImportedCard()) {
      return Cards.update(
        { _id: this.importedId },
        {$set: {spentTime}}
      );
    } else if (this.isImportedBoard()) {
      return Boards.update(
        {_id: this.importedId},
        {$set: {spentTime}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {spentTime}}
      );
    }
  },

  getTitle() {
    if (this.isImportedCard()) {
      const card = Cards.findOne({ _id: this.importedId });
      return card.title;
    } else if (this.isImportedBoard()) {
      const board = Boards.findOne({ _id: this.importedId});
      return board.title;
    } else {
      return this.title;
    }
  },

  setTitle(title) {
    if (this.isImportedCard()) {
      return Cards.update(
        { _id: this.importedId },
        {$set: {title}}
      );
    } else if (this.isImportedBoard()) {
      return Boards.update(
        {_id: this.importedId},
        {$set: {title}}
      );
    } else {
      return Cards.update(
        {_id: this._id},
        {$set: {title}}
      );
    }
  },
});

Cards.mutations({
  archive() {
    return {$set: {archived: true}};
  },

  restore() {
    return {$set: {archived: false}};
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

  setCover(coverId) {
    return {$set: {coverId}};
  },

  unsetCover() {
    return {$unset: {coverId: ''}};
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
    if (typeof  check !== 'undefined') {
      const id = Cards.direct.insert({
        title: req.body.title,
        boardId: paramBoardId,
        listId: paramListId,
        description: req.body.description,
        userId: req.body.authorId,
        swimlaneId: req.body.swimlaneId,
        sort: 0,
        members: [req.body.authorId],
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
