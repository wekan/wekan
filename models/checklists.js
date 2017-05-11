Checklists = new Mongo.Collection('checklists');

Checklists.attachSchema(new SimpleSchema({
  cardId: {
    type: String,
  },
  title: {
    type: String,
  },
  items: {
    type: [Object],
    defaultValue: [],
  },
  'items.$._id': {
    type: String,
  },
  'items.$.title': {
    type: String,
  },
  'items.$.isFinished': {
    type: Boolean,
    defaultValue: false,
  },
  finishedAt: {
    type: Date,
    optional: true,
  },
  createdAt: {
    type: Date,
    denyUpdate: false,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert) {
        return new Date();
      } else {
        this.unset();
      }
    },
  },
}));

Checklists.helpers({
  itemCount() {
    return this.items.length;
  },
  finishedCount() {
    return this.items.filter((item) => {
      return item.isFinished;
    }).length;
  },
  isFinished() {
    return 0 !== this.itemCount() && this.itemCount() === this.finishedCount();
  },
  getItem(_id) {
    return _.findWhere(this.items, { _id });
  },
  itemIndex(itemId) {
    return _.pluck(this.items, '_id').indexOf(itemId);
  },
});

Checklists.allow({
  insert(userId, doc) {
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));
  },
  update(userId, doc) {
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));
  },
  remove(userId, doc) {
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));
  },
  fetch: ['userId', 'cardId'],
});

Checklists.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  if (!doc.userId) {
    doc.userId = userId;
  }
});

Checklists.mutations({
  //for checklist itself
  setTitle(title) {
    return { $set: { title } };
  },
  //for items in checklist
  addItem(title) {
    const itemCount = this.itemCount();
    const _id = `${this._id}${itemCount}`;
    return { $addToSet: { items: { _id, title, isFinished: false } } };
  },
  removeItem(itemId) {
    return { $pull: { items: { _id: itemId } } };
  },
  editItem(itemId, title) {
    if (this.getItem(itemId)) {
      const itemIndex = this.itemIndex(itemId);
      return {
        $set: {
          [`items.${itemIndex}.title`]: title,
        },
      };
    }
    return {};
  },
  finishItem(itemId) {
    if (this.getItem(itemId)) {
      const itemIndex = this.itemIndex(itemId);
      return {
        $set: {
          [`items.${itemIndex}.isFinished`]: true,
        },
      };
    }
    return {};
  },
  resumeItem(itemId) {
    if (this.getItem(itemId)) {
      const itemIndex = this.itemIndex(itemId);
      return {
        $set: {
          [`items.${itemIndex}.isFinished`]: false,
        },
      };
    }
    return {};
  },
  toggleItem(itemId) {
    const item = this.getItem(itemId);
    if (item) {
      const itemIndex = this.itemIndex(itemId);
      return {
        $set: {
          [`items.${itemIndex}.isFinished`]: !item.isFinished,
        },
      };
    }
    return {};
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    Checklists._collection._ensureIndex({ cardId: 1, createdAt: 1 });
  });

  Checklists.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      activityType: 'addChecklist',
      cardId: doc.cardId,
      boardId: Cards.findOne(doc.cardId).boardId,
      checklistId: doc._id,
    });
  });

  //TODO: so there will be no activity for adding item into checklist, maybe will be implemented in the future.
  // Checklists.after.update((userId, doc) => {
  //   console.log('update:', doc)
  // Activities.insert({
  //   userId,
  //   activityType: 'addChecklist',
  //   boardId: doc.boardId,
  //   cardId: doc.cardId,
  //   checklistId: doc._id,
  // });
  // });

  Checklists.before.remove((userId, doc) => {
    const activity = Activities.findOne({ checklistId: doc._id });
    if (activity) {
      Activities.remove(activity._id);
    }
  });
}

//CARD COMMENT REST API
if (Meteor.isServer) {
  JsonRoutes.add('GET', '/api/boards/:boardId/cards/:cardId/checklists', function (req, res, next) {
    Authentication.checkUserId( req.userId);
    const paramCardId = req.params.cardId;
    JsonRoutes.sendResult(res, {
      code: 200,
      data: Checklists.find({ cardId: paramCardId }).map(function (doc) {
        return {
          _id: doc._id,
          title: doc.title,
        };
      }),
    });
  });

  JsonRoutes.add('GET', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId', function (req, res, next) {
    Authentication.checkUserId( req.userId);
    const paramChecklistId = req.params.checklistId;
    const paramCardId = req.params.cardId;
    JsonRoutes.sendResult(res, {
      code: 200,
      data: Checklists.findOne({ _id: paramChecklistId, cardId: paramCardId }),
    });
  });

  JsonRoutes.add('POST', '/api/boards/:boardId/cards/:cardId/checklists', function (req, res, next) {
    Authentication.checkUserId( req.userId);
    const paramCardId = req.params.cardId;

    const checklistToSend = {};
    checklistToSend.cardId = paramCardId;
    checklistToSend.title = req.body.title;
    checklistToSend.items = [];
    const id = Checklists.insert(checklistToSend);
    const checklist = Checklists.findOne({_id: id});
    req.body.items.forEach(function (item) {
      checklist.addItem(item);
    }, this);


    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });
  });

  JsonRoutes.add('DELETE', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId', function (req, res, next) {
    Authentication.checkUserId( req.userId);
    const paramCommentId = req.params.commentId;
    const paramCardId = req.params.cardId;
    Checklists.remove({ _id: paramCommentId, cardId: paramCardId });
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramCardId,
      },
    });
  });
}
